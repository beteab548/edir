import prisma from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";
import { addMonths } from "date-fns";

class PaymentProcessingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PaymentProcessingError";
  }
}

class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

interface ApplyCatchUpPaymentParams {
  memberId: number;
  contributionId: number;
  paidAmount: number;
  paymentMethod: string;
  documentReference?: string;
}

export async function applyCatchUpPayment({
  memberId,
  contributionId,
  paidAmount,
  paymentMethod = "Cash",
  documentReference = "-",
}: ApplyCatchUpPaymentParams) {
  // Validate inputs (unchanged logic)
  if (!memberId || !contributionId) {
    throw new ValidationError("Member ID and Contribution ID are required");
  }
  if (paidAmount <= 0) {
    throw new ValidationError("Paid amount must be greater than zero");
  }
  if (!paymentMethod) {
    throw new ValidationError("Payment method is required");
  }

  try {
    return await prisma.$transaction(
      async (tx) => {
        // OPTIMIZATION: Parallel member + contribution fetch
        const [member, contribution] = await Promise.all([
          tx.member.findUnique({ where: { id: memberId } }),
          tx.contribution.findUnique({
            where: {
              member_id_contribution_type_id: {
                member_id: memberId,
                contribution_type_id: contributionId,
              },
            },
            include: { contributionType: true },
          }),
        ]);

        if (!member) throw new NotFoundError(`Member ${memberId} not found`);
        if (!contribution) {
          throw new NotFoundError(`Contribution ${contributionId} not found`);
        }

        let remaining = new Decimal(paidAmount);
        const payments: Array<{
          month: Date;
          paid: number;
          type: string;
        }> = [];

        // OPTIMIZATION: Generate custom_id upfront
        const nextId = (await tx.paymentRecord.count()) + 1;
        const formattedId = `PYN-${nextId.toString().padStart(4, "0")}`;

        const paymentRecord = await tx.paymentRecord.create({
          data: {
            member_id: memberId,
            contribution_Type_id: contributionId,
            payment_date: new Date(),
            payment_method: paymentMethod,
            document_reference: documentReference,
            total_paid_amount: new Decimal(paidAmount),
            custom_id: formattedId, // Set directly to avoid update query
          },
        });

        if (contribution.contributionType.mode === "OneTimeWindow") {
          // OPTIMIZATION: Parallel schedule + payments sum fetch
          const [schedule, totalPaidResult] = await Promise.all([
            tx.contributionSchedule.findFirst({
              where: {
                member_id: memberId,
                contribution_id: contribution.id,
              },
            }),
            tx.payment.aggregate({
              where: {
                member_id: memberId,
                contribution_id: contribution.id,
                payment_type: "OneTimeWindow",
              },
              _sum: { paid_amount: true },
            }),
          ]);

          if (!schedule) {
            throw new NotFoundError("OneTimeWindow schedule not found");
          }

          const alreadyPaid = new Decimal(totalPaidResult._sum.paid_amount ?? 0);
          const unpaidAmount = contribution.amount.minus(alreadyPaid);
          const amountToPay = Decimal.min(remaining, unpaidAmount);
          const remainingAfter = remaining.minus(amountToPay);

          if (amountToPay.gt(0)) {
            // OPTIMIZATION: Parallel payment + schedule update
            await Promise.all([
              tx.payment.create({
                data: {
                  payment_record_id: paymentRecord.id,
                  member_id: memberId,
                  contribution_id: contribution.id,
                  contribution_schedule_id: schedule.id,
                  payment_type: contribution.contributionType.name,
                  payment_month: schedule.month.toISOString().slice(0, 7),
                  paid_amount: amountToPay,
                },
              }),
              tx.contributionSchedule.update({
                where: { id: schedule.id },
                data: {
                  paid_amount: (schedule.paid_amount ?? new Decimal(0)).plus(amountToPay),
                  ...(amountToPay.gte(unpaidAmount) && {
                    is_paid: true,
                    paid_at: new Date(),
                  }),
                },
              }),
            ]);

            payments.push({
              month: schedule.month,
              paid: amountToPay.toNumber(),
              type: unpaidAmount.lte(amountToPay)
                ? "contribution_full"
                : "contribution_partial",
            });

            // OPTIMIZATION: Single upsert for balance
            await tx.balance.upsert({
              where: {
                member_id_contribution_id: {
                  member_id: memberId,
                  contribution_id: contribution.id,
                },
              },
              update: { amount: { decrement: amountToPay } },
              create: {
                member_id: memberId,
                contribution_id: contribution.id,
                amount: new Decimal(0).minus(amountToPay),
              },
            });

            const graceMonths =
              contribution.contributionType.months_before_inactivation ?? 5;
            const deadlineDate = addMonths(
              contribution.start_date,
              graceMonths
            );

            if (
              new Date() > deadlineDate &&
              (schedule.paid_amount ?? new Decimal(0)).plus(amountToPay).lt(contribution.amount)
            ) {
              await tx.member.update({
                where: { id: memberId },
                data: {
                  status: "Inactive",
                  end_date: new Date(),
                  remark: "Inactivated due to unpaid contributions",
                },
              });
            }
          }

          if (remainingAfter.gt(0)) {
            payments.push({
              month: new Date(),
              paid: remainingAfter.toNumber(),
              type: "unallocated",
            });
          }
        } else {
          // Recurring contributions - optimized with penalty pre-loading
          const schedules = await tx.contributionSchedule.findMany({
            where: {
              member_id: memberId,
              contribution_id: contribution.id,
              is_paid: false,
            },
            orderBy: { month: "asc" },
            include: {
              penalties: {
                where: { resolved_at: null },
              },
            },
          });

          if (schedules.length === 0) {
            throw new PaymentProcessingError("No unpaid schedules found");
          }

          let totalContributionPaid = new Decimal(0);

          for (const sched of schedules) {
            if (remaining.lte(0)) break;

            const penalty = sched.penalties[0]; // Pre-loaded penalty
            const currentPaid = sched.paid_amount ?? new Decimal(0);

            // Handle penalty if exists
            if (penalty) {
              const penaltyAmount = penalty.expected_amount ?? new Decimal(0);
              const penaltyPaidAmount = penalty.paid_amount ?? new Decimal(0);
              const penaltyRemaining = penaltyAmount.minus(penaltyPaidAmount);
              const penaltyToPay = Decimal.min(penaltyRemaining, remaining);

              if (penaltyToPay.gt(0)) {
                const newPenaltyPaid = penaltyPaidAmount.plus(penaltyToPay);
                const penaltyFullyPaid = newPenaltyPaid.gte(penaltyAmount);

                await Promise.all([
                  tx.payment.create({
                    data: {
                      payment_record_id: paymentRecord.id,
                      member_id: memberId,
                      contribution_id: contribution.id,
                      contribution_schedule_id: sched.id,
                      payment_type: "penalty",
                      payment_month: sched.month.toISOString().slice(0, 7),
                      paid_amount: penaltyToPay,
                    },
                  }),
                  tx.penalty.update({
                    where: { id: penalty.id },
                    data: {
                      paid_amount: newPenaltyPaid,
                      ...(penaltyFullyPaid && {
                        is_paid: true,
                        resolved_at: new Date(),
                      }),
                    },
                  }),
                ]);

                payments.push({
                  month: sched.month,
                  paid: penaltyToPay.toNumber(),
                  type: penaltyFullyPaid ? "penalty" : "penalty_partial",
                });

                remaining = remaining.minus(penaltyToPay);
              }
            }

            // Handle contribution payment
            const expectedAmount = sched.expected_amount;
            const unpaid = expectedAmount.minus(currentPaid);
            const toPay = Decimal.min(unpaid, remaining);

            if (toPay.gt(0)) {
              const newTotalPaid = currentPaid.plus(toPay);
              totalContributionPaid = totalContributionPaid.plus(toPay);
              const isFullyPaid = newTotalPaid.gte(expectedAmount);

              await Promise.all([
                tx.payment.create({
                  data: {
                    payment_record_id: paymentRecord.id,
                    member_id: memberId,
                    contribution_id: contribution.id,
                    contribution_schedule_id: sched.id,
                    payment_type: contribution.type_name,
                    payment_month: sched.month.toISOString().slice(0, 7),
                    paid_amount: toPay,
                  },
                }),
                tx.contributionSchedule.update({
                  where: { id: sched.id },
                  data: {
                    paid_amount: newTotalPaid,
                    ...(isFullyPaid && {
                      is_paid: true,
                      paid_at: new Date(),
                    }),
                  },
                }),
              ]);

              payments.push({
                month: sched.month,
                paid: toPay.toNumber(),
                type: isFullyPaid
                  ? currentPaid.gt(0)
                    ? "contribution_partial_to_full"
                    : "contribution_full"
                  : "contribution_partial",
              });

              remaining = remaining.minus(toPay);
            }
          }

          // Handle remaining amount
          if (remaining.gt(0)) {
            payments.push({
              month: new Date(),
              paid: remaining.toNumber(),
              type: "unallocated",
            });
          }

          // Update balance
          await tx.balance.upsert({
            where: {
              member_id_contribution_id: {
                member_id: memberId,
                contribution_id: contribution.id,
              },
            },
            update: { amount: { decrement: totalContributionPaid } },
            create: {
              member_id: memberId,
              contribution_id: contribution.id,
              amount: new Decimal(0).minus(totalContributionPaid),
            },
          });
        }

        // Final updates
        const updatedBalance = await tx.balance.findUnique({
          where: {
            member_id_contribution_id: {
              member_id: memberId,
              contribution_id: contribution.id,
            },
          },
        });

        const remainingBalance = updatedBalance?.amount ?? new Decimal(0);

        if (
          contribution.contributionType.name === "Registration" &&
          remainingBalance.eq(0)
        ) {
          await tx.member.update({
            where: { id: memberId },
            data: { member_type: "Existing" },
          });
        }

        await tx.paymentRecord.update({
          where: { id: paymentRecord.id },
          data: {
            remaining_balance: remainingBalance.greaterThan(0)
              ? remainingBalance
              : new Decimal(0),
          },
        });

        return payments;
      },
      { timeout: 20000 } 
    );
  } catch (error) {
    if (
      error instanceof ValidationError ||
      error instanceof NotFoundError ||
      error instanceof PaymentProcessingError
    ) {
      throw error;
    }
    if (error instanceof Error) {
      throw new PaymentProcessingError(`Database failed: ${error.message}`);
    }
    throw new PaymentProcessingError("Unknown payment error occurred");
  }
}
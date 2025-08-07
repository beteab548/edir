import prisma from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";
import { addMonths, startOfMonth, isBefore, endOfDay, isAfter } from "date-fns";

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
  paymentMethod?: string;
  documentReference?: string;
  simulate?: boolean;
  simulationMonths?: number;
}

interface PaymentResult {
  payments: Array<{
    month: Date;
    paid: number;
    type: string;
  }>;
  isSimulated: boolean;
  simulatedMonths?: number;
  simulationDate?: Date;
  remainingBalance: Decimal;
  excessAmount: Decimal; // ADDED
}

export async function applyCatchUpPayment({
  memberId,
  contributionId,
  paidAmount,
  paymentMethod = "Cash",
  documentReference = "-",
  simulate = false,
  simulationMonths = 0,
}: ApplyCatchUpPaymentParams): Promise<PaymentResult> {
  // Validate inputs
  if (!memberId || !contributionId) {
    throw new ValidationError("Member ID and Contribution ID are required");
  }
  if (paidAmount <= 0) {
    throw new ValidationError("Paid amount must be greater than zero");
  }
  if (!paymentMethod) {
    throw new ValidationError("Payment method is required");
  }
  if (
    simulate &&
    (simulationMonths < 0 || !Number.isInteger(simulationMonths))
  ) {
    throw new ValidationError("Simulation months must be a positive integer");
  }

  try {
    let usedForContribution = new Decimal(0);
    let usedForPenalty = new Decimal(0);
    const payments: Array<{ month: Date; paid: number; type: string }> = [];
    let initialPayment = new Decimal(paidAmount);
    return await prisma.$transaction(
      async (tx) => {
        const [member, contribution] = await Promise.all([
          tx.member.findUnique({
            where: { id: memberId },
            select: { id: true, status: true, member_type: true },
          }),
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

        const nextId = (await tx.paymentRecord.count()) + 1;
        const formattedId = `PYN-${nextId.toString().padStart(4, "0")}`;

        let currentDate = simulate
          ? addMonths(new Date(), simulationMonths)
          : new Date();
        let currentMonthStart = startOfMonth(currentDate);

        let remainingPayment = new Decimal(paidAmount);

        // Create paymentRecord with excess_balance: 0 initially
        const paymentRecord = await tx.paymentRecord.create({
          data: {
            member_id: memberId,
            contribution_Type_id: contributionId,
            payment_date: new Date(),
            payment_method: paymentMethod,
            document_reference: documentReference,
            total_paid_amount: initialPayment,
            excess_balance: new Decimal(0), // Initial excess_balance is 0
            custom_id: formattedId,
          },
        });

        if (contribution.contributionType.mode === "OneTimeWindow") {
          const startDate = contribution.contributionType.start_date;
          const endDate = contribution.contributionType.end_date;

          if (!startDate || !endDate) {
            throw new PaymentProcessingError(
              "OneTimeWindow contribution must have start and end dates"
            );
          }

          if (isBefore(currentDate, startDate)) {
            throw new PaymentProcessingError(
              `Payment cannot be made before the start date (${startDate.toISOString()})`
            );
          }

          if (isAfter(currentDate, endOfDay(endDate))) {
            throw new PaymentProcessingError(
              `Payment cannot be made after the end date (${endDate.toISOString()})`
            );
          }

          const schedule = await tx.contributionSchedule.findFirst({
            where: {
              member_id: memberId,
              contribution_id: contribution.id,
            },
            orderBy: { month: "asc" },
          });

          if (!schedule) {
            throw new NotFoundError("OneTimeWindow schedule not found");
          }

          const unpaidAmount = schedule.expected_amount.minus(
            schedule.paid_amount ?? new Decimal(0)
          );
          const amountToPay = Decimal.min(remainingPayment, unpaidAmount);

          if (amountToPay.gt(0)) {
            const isFullyPaid = amountToPay.gte(unpaidAmount);

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
                  paid_amount: { increment: amountToPay },
                  is_paid: isFullyPaid,
                  paid_at: isFullyPaid ? new Date() : undefined,
                },
              }),
            ]);

            payments.push({
              month: schedule.month,
              paid: amountToPay.toNumber(),
              type: isFullyPaid ? "contribution_full" : "contribution_partial",
            });

            remainingPayment = remainingPayment.minus(amountToPay);
            usedForContribution = usedForContribution.plus(amountToPay);
          }
        } else {
          if (remainingPayment.gt(0)) {
            const pastSchedulesWithPenalties =
              await tx.contributionSchedule.findMany({
                where: {
                  member_id: memberId,
                  contribution_id: contribution.id,
                  is_paid: false,
                  month: { lt: currentMonthStart },
                },
                include: {
                  penalties: {
                    where: { is_paid: false },
                    orderBy: { applied_at: "asc" },
                  },
                },
                orderBy: { month: "asc" },
              });

            for (const schedule of pastSchedulesWithPenalties) {
              if (remainingPayment.lte(0)) break;

              for (const penalty of schedule.penalties) {
                if (remainingPayment.lte(0)) break;

                const due = penalty.expected_amount.minus(
                  penalty.paid_amount ?? 0
                );
                if (due.lte(0)) continue;

                const toPay = Decimal.min(remainingPayment, due);
                const isFullyPaid = toPay.gte(due);

                await Promise.all([
                  tx.penalty.update({
                    where: { id: penalty.id },
                    data: {
                      paid_amount: { increment: toPay },
                      is_paid: isFullyPaid,
                      resolved_at: isFullyPaid ? new Date() : undefined,
                    },
                  }),
                  tx.payment.create({
                    data: {
                      payment_record_id: paymentRecord.id,
                      member_id: memberId,
                      contribution_id: contribution.id,
                      contribution_schedule_id: schedule.id,
                      penalty_id: penalty.id,
                      payment_type: "penalty",
                      payment_month: schedule.month.toISOString().slice(0, 7),
                      paid_amount: toPay,
                    },
                  }),
                ]);

                remainingPayment = remainingPayment.minus(toPay);
                usedForPenalty = usedForPenalty.plus(toPay);
                payments.push({
                  month: schedule.month,
                  paid: toPay.toNumber(),
                  type: "penalty",
                });
              }
            }
          }

          if (remainingPayment.gt(0)) {
            const pastSchedules = await tx.contributionSchedule.findMany({
              where: {
                member_id: memberId,
                contribution_id: contribution.id,
                is_paid: false,
                month: { lt: currentMonthStart },
              },
              orderBy: { month: "asc" },
            });

            for (const schedule of pastSchedules) {
              if (remainingPayment.lte(0)) break;

              const paidAlready = schedule.paid_amount ?? 0;
              const remainingDue = schedule.expected_amount.minus(paidAlready);
              if (remainingDue.lte(0)) continue;

              const toPay = Decimal.min(remainingPayment, remainingDue);
              const isFullyPaid = paidAlready
                .plus(toPay)
                .gte(schedule.expected_amount);

              await Promise.all([
                tx.contributionSchedule.update({
                  where: { id: schedule.id },
                  data: {
                    paid_amount: { increment: toPay },
                    is_paid: isFullyPaid,
                    paid_at: isFullyPaid ? new Date() : undefined,
                  },
                }),
                tx.payment.create({
                  data: {
                    payment_record_id: paymentRecord.id,
                    member_id: memberId,
                    contribution_id: contribution.id,
                    contribution_schedule_id: schedule.id,
                    payment_type: contribution.contributionType.name,
                    payment_month: schedule.month.toISOString().slice(0, 7),
                    paid_amount: toPay,
                  },
                }),
              ]);

              remainingPayment = remainingPayment.minus(toPay);
              usedForContribution = usedForContribution.plus(toPay);
              payments.push({
                month: schedule.month,
                paid: toPay.toNumber(),
                type: isFullyPaid
                  ? "contribution_full"
                  : "contribution_partial",
              });
            }
          }

          if (remainingPayment.gt(0)) {
            const currentSchedule = await tx.contributionSchedule.findFirst({
              where: {
                member_id: memberId,
                contribution_id: contribution.id,
                month: {
                  gte: currentMonthStart,
                  lt: startOfMonth(addMonths(currentMonthStart, 1)),
                },
              },
            });

            if (currentSchedule) {
              const paidAlready = currentSchedule.paid_amount ?? 0;
              const remainingDue =
                currentSchedule.expected_amount.minus(paidAlready);
              if (remainingDue.gt(0)) {
                const toPay = Decimal.min(remainingPayment, remainingDue);
                const isFullyPaid = paidAlready
                  .plus(toPay)
                  .gte(currentSchedule.expected_amount);

                await Promise.all([
                  tx.contributionSchedule.update({
                    where: { id: currentSchedule.id },
                    data: {
                      paid_amount: { increment: toPay },
                      is_paid: isFullyPaid,
                      paid_at: isFullyPaid ? new Date() : undefined,
                    },
                  }),
                  tx.payment.create({
                    data: {
                      payment_record_id: paymentRecord.id,
                      member_id: memberId,
                      contribution_id: contribution.id,
                      contribution_schedule_id: currentSchedule.id,
                      payment_type: contribution.contributionType.name,
                      payment_month: currentSchedule.month
                        .toISOString()
                        .slice(0, 7),
                      paid_amount: toPay,
                    },
                  }),
                ]);

                remainingPayment = remainingPayment.minus(toPay);
                usedForContribution = usedForContribution.plus(toPay);
                payments.push({
                  month: currentSchedule.month,
                  paid: toPay.toNumber(),
                  type: isFullyPaid
                    ? "contribution_full"
                    : "contribution_partial",
                });
              }
            }
          }
        }
        let excessAmount = remainingPayment;

        await tx.balance.upsert({
          where: {
            member_id_contribution_id: {
              member_id: memberId,
              contribution_id: contribution.id,
            },
          },
          update: {
            amount: { decrement: usedForContribution },
            ...(excessAmount.gt(0) && {
              unallocated_amount: {
                increment: excessAmount,
              },
            }),
          },
          create: {
            member_id: memberId,
            contribution_id: contribution.id,
            amount: new Decimal(0).minus(usedForContribution),
            unallocated_amount: excessAmount.gt(0)
              ? excessAmount
              : new Decimal(0),
          },
        });

        // Fetch the updated balance *after* upsert
        const updatedBalance = await tx.balance.findUnique({
          where: {
            member_id_contribution_id: {
              member_id: memberId,
              contribution_id: contribution.id,
            },
          },
        });

        const remainingBalance = updatedBalance?.amount ?? new Decimal(0); // Get the remaining balance
        const newUnallocatedAmount =
          updatedBalance?.unallocated_amount ?? new Decimal(0);

        // Update the paymentRecord with the newUnallocatedAmount and remainingBalance
        await tx.paymentRecord.update({
          where: { id: paymentRecord.id },
          data: {
            excess_balance: newUnallocatedAmount,
            remaining_balance: remainingBalance, // <---- Add this line
          },
        });

        if (
          contribution.contributionType.name === "Registration" &&
          remainingBalance.eq(0) &&
          !simulate
        ) {
          await tx.member.update({
            where: { id: memberId },
            data: { member_type: "Existing" },
          });
        }

        return {
          payments,
          isSimulated: simulate,
          simulatedMonths: simulationMonths,
          simulationDate: currentDate,
          remainingBalance,
          excessAmount,
        };
      },
      {
        isolationLevel: "Serializable",
        timeout: 20000,
        maxWait: 10000,
      }
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
      throw new PaymentProcessingError(
        `Payment processing failed: ${error.message}`
      );
    }
    throw new PaymentProcessingError("Unknown payment error occurred");
  }
}

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
}: ApplyCatchUpPaymentParams): Promise<
  Array<{
    month: Date;
    paid: number;
    type: string;
  }>
> {
  if (!memberId || !contributionId) {
    throw new ValidationError("Member ID and Contribution ID are required");
  }

  if (paidAmount < 0) {
    throw new ValidationError("Paid amount must be greater than zero");
  }

  if (!paymentMethod) {
    throw new ValidationError("Payment method is required");
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const member = await tx.member.findUnique({ where: { id: memberId } });
      if (!member) throw new NotFoundError(`Member ${memberId} not found`);

      const contribution = await tx.contribution.findUnique({
        where: {
          member_id_contribution_type_id: {
            member_id: memberId,
            contribution_type_id: contributionId,
          },
        },
        include: { contributionType: true },
      });
      if (!contribution) {
        throw new NotFoundError(`Contribution ${contributionId} not found`);
      }

      const payments: {
        month: Date;
        paid: number;
        type: string;
      }[] = [];

      let remaining = new Decimal(paidAmount);

      // ----- OneTimeWindow Handling -----
      if (contribution.contributionType.mode === "OneTimeWindow") {
        const schedule = await tx.contributionSchedule.findFirst({
          where: {
            member_id: memberId,
            contribution_id: contribution.id,
          },
        });

        if (!schedule) {
          throw new NotFoundError("OneTimeWindow schedule not found");
        }

        const totalPaidResult = await tx.payment.aggregate({
          where: {
            member_id: memberId,
            contribution_id: contribution.id,
            payment_type: "OneTimeWindow",
          },
          _sum: {
            paid_amount: true,
          },
        });

        const alreadyPaid = new Decimal(totalPaidResult._sum.paid_amount ?? 0);
        const unpaidAmount = contribution.amount.minus(alreadyPaid);
        const amountToPay = Decimal.min(remaining, unpaidAmount);
        const remainingAfter = remaining.minus(amountToPay);

        if (amountToPay.gt(0)) {
          await tx.payment.create({
            data: {
              contribution_id: contribution.id,
              member_id: memberId,
              payment_date: new Date(),
              payment_type: contribution.contributionType.name,
              payment_month: new Date().toISOString().slice(0, 7),
              paid_amount: amountToPay,
              payment_method: paymentMethod,
              document: documentReference,
            },
          });

          const newTotalPaid = (schedule.paid_amount ?? new Decimal(0)).plus(amountToPay);
          const isFullyPaid = newTotalPaid.greaterThanOrEqualTo(contribution.amount);

          await tx.contributionSchedule.update({
            where: { id: schedule.id },
            data: {
              paid_amount: newTotalPaid,
              ...(isFullyPaid && {
                is_paid: true,
                paid_at: new Date(),
              }),
            },
          });

          payments.push({
            month: new Date(),
            paid: amountToPay.toNumber(),
            type: unpaidAmount.lte(amountToPay)
              ? "contribution_full"
              : "contribution_partial",
          });

          // Update balance - ONLY for contribution payments
          const balanceRecord = await tx.balance.findUnique({
            where: {
              member_id_contribution_id: {
                member_id: memberId,
                contribution_id: contribution.id,
              },
            },
          });

          if (balanceRecord) {
            await tx.balance.update({
              where: { id: balanceRecord.id },
              data: {
                amount: balanceRecord.amount.minus(amountToPay),
              },
            });
          } else {
            await tx.balance.create({
              data: {
                member_id: memberId,
                contribution_id: contribution.id,
                amount: new Decimal(0).minus(amountToPay),
              },
            });
          }

          const graceMonths =
            contribution.contributionType.months_before_inactivation ?? 5;
          const deadlineDate = addMonths(contribution.start_date, graceMonths);

          const totalPaidAfter = alreadyPaid.plus(amountToPay);
          if (
            new Date() > deadlineDate &&
            totalPaidAfter.lt(contribution.amount)
          ) {
            await tx.member.update({
              where: { id: memberId },
              data: { status: "Inactive" },
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

        return payments;
      }

      // ----- Recurring Handling -----
      const schedules = await tx.contributionSchedule.findMany({
        where: {
          member_id: memberId,
          contribution_id: contribution.id,
          is_paid: false,
        },
        orderBy: { month: "asc" },
      });

      if (schedules.length === 0) {
        throw new PaymentProcessingError("No unpaid schedules found");
      }

      const monthlyAmount =
        contribution.contributionType.mode === "OpenEndedRecurring"
          ? contribution.amount
          : contribution.amount.dividedBy(schedules.length);

      for (const sched of schedules) {
        if (remaining.lte(0)) break;

        const penalty = await tx.penalty.findFirst({
          where: {
            member_id: memberId,
            contribution_id: contribution.id,
            resolved_at: null,
            contributionSchedule: {
              month: sched.month,
            },
          },
        });

        const penaltyAmount = penalty ? penalty.amount : new Decimal(0);
        if (penalty && penaltyAmount.gt(0) && remaining.greaterThanOrEqualTo(penaltyAmount)) {
          await tx.payment.create({
            data: {
              contribution_id: contribution.id,
              member_id: memberId,
              payment_date: new Date(),
              payment_type: "penalty",
              payment_month: sched.month.toISOString().slice(0, 7),
              paid_amount: penaltyAmount,
              payment_method: paymentMethod,
              document: documentReference,
            },
          });

          await tx.penalty.update({
            where: { id: penalty.id },
            data: { resolved_at: new Date(), is_paid: true },
          });

          payments.push({
            month: sched.month,
            paid: penaltyAmount.toNumber(),
            type: "penalty",
          });

          remaining = remaining.minus(penaltyAmount);
        }

        const currentPaid = sched.paid_amount ?? new Decimal(0);
        const unpaid = monthlyAmount.minus(currentPaid);

        if (unpaid.lte(0)) continue;

        const toPay = Decimal.min(unpaid, remaining);

        if (toPay.gt(0)) {
          const newTotalPaid = currentPaid.plus(toPay);
          const isFullyPaid = newTotalPaid.greaterThanOrEqualTo(monthlyAmount);

          await tx.payment.create({
            data: {
              contribution_id: contribution.id,
              member_id: memberId,
              payment_date: new Date(),
              payment_type: contribution.type_name,
              payment_month: sched.month.toISOString().slice(0, 7),
              paid_amount: toPay,
              payment_method: paymentMethod,
              document: documentReference,
            },
          });

          await tx.contributionSchedule.update({
            where: { id: sched.id },
            data: {
              paid_amount: newTotalPaid,
              ...(isFullyPaid && {
                is_paid: true,
                paid_at: new Date(),
              }),
            },
          });

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
        // else skip 0 payment
      }

      if (remaining.gt(0)) {
        payments.push({
          month: new Date(),
          paid: remaining.toNumber(),
          type: "unallocated",
        });
      }

      // Calculate total contribution payments only (exclude penalties)
      const totalContributionPaid = new Decimal(
        payments
          .filter((p) => p.type !== "penalty")
          .reduce((acc, p) => acc + p.paid, 0)
      );

      const balanceRecord = await tx.balance.findUnique({
        where: {
          member_id_contribution_id: {
            member_id: memberId,
            contribution_id: contribution.id,
          },
        },
      });

      if (balanceRecord) {
        await tx.balance.update({
          where: { id: balanceRecord.id },
          data: {
            amount: balanceRecord.amount.minus(totalContributionPaid),
          },
        });
      } else {
        await tx.balance.create({
          data: {
            member_id: memberId,
            contribution_id: contribution.id,
            amount: new Decimal(0).minus(totalContributionPaid),
          },
        });
      }

      return payments;
    });
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

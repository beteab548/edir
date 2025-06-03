import prisma from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

class PaymentProcessingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PaymentProcessingError';
  }
}

class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

interface ApplyCatchUpPaymentParams {
  memberId: number;
  contributionId: number;
  paidAmount: Decimal;
  paymentMethod: string;
  documentReference?: string;
}

export async function applyCatchUpPayment({
  memberId,
  contributionId,
  paidAmount,
  paymentMethod = 'Cash',
  documentReference = '-',
}: ApplyCatchUpPaymentParams): Promise<Array<{
  month: Date;
  paid: number;
  type: string;
}>> {
  // Input validation
  if (!memberId || !contributionId) {
    throw new ValidationError('Member ID and Contribution ID are required');
  }

  if (paidAmount.lessThanOrEqualTo(0)) {
    throw new ValidationError('Paid amount must be greater than zero');
  }

  if (!paymentMethod) {
    throw new ValidationError('Payment method is required');
  }

  try {
    return await prisma.$transaction(async (tx) => {
      // Verify member exists
      const member = await tx.member.findUnique({
        where: { id: memberId },
      });

      if (!member) {
        throw new NotFoundError(`Member with ID ${memberId} not found`);
      }

      // Verify contribution exists
      const contribution = await tx.contribution.findUnique({
        where: { id: contributionId },
        include: { contributionType: true },
      });

      if (!contribution) {
        throw new NotFoundError(`Contribution with ID ${contributionId} not found`);
      }

      const schedules = await tx.contributionSchedule.findMany({
        where: {
          member_id: memberId,
          contribution_id: contributionId,
          is_paid: false,
        },
        orderBy: { month: 'asc' },
      });

      if (schedules.length === 0) {
        throw new PaymentProcessingError('No unpaid schedules found for this member and contribution');
      }

      let remaining = new Decimal(paidAmount);
      const payments = [];

      for (const sched of schedules) {
        const monthlyAmount = contribution.amount;

        try {
          // Check for penalty on this schedule's month
          const penalty = await tx.penalty.findFirst({
            where: {
              member_id: memberId,
              contribution_id: contributionId,
              resolved_at: null,
              missed_months: {
                some: {
                  month: sched.month.toISOString().slice(0, 7),
                },
              },
            },
          });

          const penaltyAmount = penalty ? penalty.amount : new Decimal(0);

          // Pay penalty first if exists and funds available
          if (penalty && remaining.greaterThanOrEqualTo(penaltyAmount)) {
            await tx.payment.create({
              data: {
                contribution_id: contributionId,
                member_id: memberId,
                payment_date: new Date(),
                payment_month: sched.month.toISOString().slice(0, 7),
                paid_amount: penaltyAmount,
                payment_method: paymentMethod,
                document: documentReference,
              },
            });

            await tx.penalty.update({
              where: { id: penalty.id },
              data: { resolved_at: new Date() },
            });

            remaining = remaining.minus(penaltyAmount);
            payments.push({
              month: sched.month,
              paid: penaltyAmount.toNumber(),
              type: 'penalty',
            });
          }

          // Then pay contribution
          if (remaining.greaterThanOrEqualTo(monthlyAmount)) {
            await tx.payment.create({
              data: {
                contribution_id: contributionId,
                member_id: memberId,
                payment_date: new Date(),
                payment_month: sched.month.toISOString().slice(0, 7),
                paid_amount: monthlyAmount,
                payment_method: paymentMethod,
                document: documentReference,
              },
            });

            await tx.contributionSchedule.update({
              where: { id: sched.id },
              data: { is_paid: true, paid_at: new Date() },
            });

            remaining = remaining.minus(monthlyAmount);
            payments.push({
              month: sched.month,
              paid: monthlyAmount.toNumber(),
              type: 'contribution_full',
            });
          } else if (remaining.greaterThan(0)) {
            // Partial contribution payment (after penalty is cleared)
            await tx.payment.create({
              data: {
                contribution_id: contributionId,
                member_id: memberId,
                payment_date: new Date(),
                payment_month: sched.month.toISOString().slice(0, 7),
                paid_amount: remaining,
                payment_method: paymentMethod,
                document: documentReference,
              },
            });

            // <=== THIS IS THE IMPORTANT FIX ===>
            await tx.contributionSchedule.update({
              where: { id: sched.id },
              data: {
                paid_amount: {
                  increment: remaining,
                },
              },
            });
            payments.push({
              month: sched.month,
              paid: remaining.toNumber(),
              type: 'contribution_partial',
            });
            remaining = new Decimal(0);
            break;
          }
        } catch (error) {
          throw new PaymentProcessingError(
            `Failed to process payment for month ${sched.month.toISOString()}: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      }

      // Update Balance
      try {
        const totalPaid = payments.reduce((acc, p) => acc + p.paid, 0);

        const balanceRecord = await tx.balance.findUnique({
          where: {
            member_id_contribution_id: {
              member_id: memberId,
              contribution_id: contributionId,
            },
          },
        });

        if (balanceRecord) {
          await tx.balance.update({
            where: { id: balanceRecord.id },
            data: {
              amount: balanceRecord.amount.minus(totalPaid),
            },
          });
        } else {
          // create new balance if none exists
          await tx.balance.create({
            data: {
              member_id: memberId,
              contribution_id: contributionId,
              amount: new Decimal(0).minus(totalPaid),
            },
          });
        }
      } catch (error) {
        throw new PaymentProcessingError(
          `Failed to update balance: ${error instanceof Error ? error.message : String(error)}`
        );
      }

      return payments;
    });
  } catch (error) {
    if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof PaymentProcessingError) {
      throw error; // Re-throw our custom errors
    }

    if (error instanceof Error) {
      throw new PaymentProcessingError(`Database operation failed: ${error.message}`);
    }

    throw new PaymentProcessingError('Unknown error occurred during payment processing');
  }
}

/// code to accomodate overpayment by creating future contributionSchudules

// services/paymentService.ts
// import { prisma } from '@/lib/prisma';
// import { Decimal } from '@prisma/client/runtime/library';
// import { addMonths, parseISO } from 'date-fns';

// export async function applyCatchUpPayment(
//   memberId: number,
//   contributionId: number,
//   paidAmount: Decimal
// ) {
//   return await prisma.$transaction(async (tx) => {
//     const schedules = await tx.contributionSchedule.findMany({
//       where: {
//         member_id: memberId,
//         contribution_id: contributionId,
//         is_paid: false,
//       },
//       orderBy: { month: 'asc' },
//     });

//     let remaining = new Decimal(paidAmount);
//     const payments = [];
//     let totalPaid = new Decimal(0);

//     const contribution = await tx.contribution.findUnique({
//       where: { id: contributionId },
//       include: { contributionType: true },
//     });
//     if (!contribution) throw new Error('Contribution not found');

//     let lastMonth = schedules.length > 0 ? schedules[schedules.length - 1].month : new Date();

//     for (const sched of schedules) {
//       const monthlyAmount = contribution.amount;
//       const alreadyPaid = new Decimal(sched.paid_amount || 0);

//       const penalty = await tx.penalty.findFirst({
//         where: {
//           member_id: memberId,
//           contribution_id: contributionId,
//           applied_at: { lt: new Date() },
//           resolved_at: null,
//           missed_months: {
//             some: {
//               month: sched.month.toISOString().slice(0, 7),
//             },
//           },
//         },
//       });

//       const penaltyAmount = penalty ? penalty.amount : new Decimal(0);
//       const totalDue = monthlyAmount.plus(penaltyAmount);
//       const remainingDue = totalDue.minus(alreadyPaid);

//       if (remaining.greaterThanOrEqualTo(remainingDue)) {
//         await tx.payment.create({
//           data: {
//             contribution_id: contributionId,
//             member_id: memberId,
//             payment_date: new Date(),
//             payment_month: sched.month.toISOString().slice(0, 7),
//             paid_amount: remainingDue,
//             payment_method: 'Cash',
//             document: '-',
//           },
//         });

//         await tx.contributionSchedule.update({
//           where: { id: sched.id },
//           data: {
//             is_paid: true,
//             paid_at: new Date(),
//             paid_amount: { increment: remainingDue },
//           },
//         });

//         if (penalty && alreadyPaid.plus(remaining).greaterThanOrEqualTo(totalDue)) {
//           await tx.penalty.update({
//             where: { id: penalty.id },
//             data: { resolved_at: new Date() },
//           });
//         }

//         remaining = remaining.minus(remainingDue);
//         totalPaid = totalPaid.plus(remainingDue);
//         payments.push({ month: sched.month, paid: remainingDue.toNumber(), type: 'full' });
//       } else if (remaining.greaterThan(0)) {
//         await tx.payment.create({
//           data: {
//             contribution_id: contributionId,
//             member_id: memberId,
//             payment_date: new Date(),
//             payment_month: sched.month.toISOString().slice(0, 7),
//             paid_amount: remaining,
//             payment_method: 'Cash',
//             document: '-',
//           },
//         });

//         await tx.contributionSchedule.update({
//           where: { id: sched.id },
//           data: {
//             paid_amount: { increment: remaining },
//           },
//         });

//         totalPaid = totalPaid.plus(remaining);
//         payments.push({ month: sched.month, paid: remaining.toNumber(), type: 'partial' });
//         remaining = new Decimal(0);
//         break;
//       }
//     }

//     // Dynamically create and fulfill future schedules if remaining exists
//     while (remaining.greaterThan(0)) {
//       lastMonth = addMonths(lastMonth, 1);

//       const newSchedule = await tx.contributionSchedule.create({
//         data: {
//           member_id: memberId,
//           contribution_id: contributionId,
//           month: lastMonth,
//           is_paid: false,
//           paid_amount: new Decimal(0),
//         },
//       });

//       const monthlyAmount = contribution.amount;

//       if (remaining.greaterThanOrEqualTo(monthlyAmount)) {
//         await tx.payment.create({
//           data: {
//             contribution_id: contributionId,
//             member_id: memberId,
//             payment_date: new Date(),
//             payment_month: lastMonth.toISOString().slice(0, 7),
//             paid_amount: monthlyAmount,
//             payment_method: 'Cash',
//             document: '-',
//           },
//         });

//         await tx.contributionSchedule.update({
//           where: { id: newSchedule.id },
//           data: {
//             is_paid: true,
//             paid_at: new Date(),
//             paid_amount: monthlyAmount,
//           },
//         });

//         remaining = remaining.minus(monthlyAmount);
//         totalPaid = totalPaid.plus(monthlyAmount);
//         payments.push({ month: lastMonth, paid: monthlyAmount.toNumber(), type: 'future-full' });
//       } else {
//         await tx.payment.create({
//           data: {
//             contribution_id: contributionId,
//             member_id: memberId,
//             payment_date: new Date(),
//             payment_month: lastMonth.toISOString().slice(0, 7),
//             paid_amount: remaining,
//             payment_method: 'Cash',
//             document: '-',
//           },
//         });

//         await tx.contributionSchedule.update({
//           where: { id: newSchedule.id },
//           data: {
//             paid_amount: remaining,
//           },
//         });

//         totalPaid = totalPaid.plus(remaining);
//         payments.push({ month: lastMonth, paid: remaining.toNumber(), type: 'future-partial' });
//         remaining = new Decimal(0);
//       }
//     }

//     await tx.balance.updateMany({
//       where: {
//         member_id: memberId,
//         contribution_id: contributionId,
//       },
//       data: {
//         amount: {
//           decrement: totalPaid,
//         },
//       },
//     });

//     return payments;
//   });
// }

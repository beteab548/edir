import prisma from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

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
      console.log("contribution type is", contribution.type_name);
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

      // ... (previous code remains the same until the schedule processing part)

// ... (previous code remains the same until the schedule processing part)

let remaining = new Decimal(paidAmount);
const payments = [];

// Calculate equal monthly amount for oneTimeWindow
const monthlyAmount = contribution.contributionType.mode === 'OneTimeWindow'
  ? contribution.amount.dividedBy(schedules.length)
  : contribution.amount;

for (const sched of schedules) {
  if (remaining.lte(0)) break;

  try {
    // 1. Process penalty first if exists
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
    if (penalty && remaining.greaterThanOrEqualTo(penaltyAmount)) {
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

      remaining = remaining.minus(penaltyAmount);
      payments.push({
        month: sched.month,
        paid: penaltyAmount.toNumber(),
        type: "penalty",
      });
    }

    // 2. Calculate how much we can pay for this month's contribution
    const currentPaidAmount = sched.paid_amount ?? new Decimal(0);
    const unpaidAmount = monthlyAmount.minus(currentPaidAmount);
    
    if (unpaidAmount.lte(0)) continue; // month is already fully paid

    if (remaining.greaterThan(0)) {
      const amountToPay = Decimal.min(remaining, unpaidAmount);
      
      await tx.payment.create({
        data: {
          contribution_id: contribution.id,
          member_id: memberId,
          payment_date: new Date(),
          payment_type: contribution.type_name,
          payment_month: sched.month.toISOString().slice(0, 7),
          paid_amount: amountToPay,
          payment_method: paymentMethod,
          document: documentReference,
        },
      });

      const newPaidAmount = currentPaidAmount.plus(amountToPay);
      const fullyPaid = newPaidAmount.greaterThanOrEqualTo(monthlyAmount);

      await tx.contributionSchedule.update({
        where: { id: sched.id },
        data: {
          paid_amount: newPaidAmount,
          ...(fullyPaid && {
            is_paid: true,
            paid_at: new Date(),
          }),
        },
      });

      payments.push({
        month: sched.month,
        paid: amountToPay.toNumber(),
        type: fullyPaid 
          ? (currentPaidAmount.gt(0) ? "contribution_partial_to_full" : "contribution_full")
          : "contribution_partial",
      });

      remaining = remaining.minus(amountToPay);
    }
  } catch (error) {
    throw new PaymentProcessingError(
      `Failed to process ${sched.month.toISOString()}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

// Handle any remaining amount (could be overpayment)
if (remaining.gt(0)) {
  // You can either:
  // 1. Create a credit balance for the member
  // 2. Create new future schedules
  // 3. Return as unallocated (current approach)
  payments.push({
    month: new Date(),
    paid: remaining.toNumber(),
    type: "unallocated",
  });
}

// ... (rest of the code remains the same)

      // Update balance
      try {
        const totalPaid = payments.reduce((acc, p) => acc + p.paid, 0);
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
              amount: balanceRecord.amount.minus(totalPaid),
            },
          });
        } else {
          await tx.balance.create({
            data: {
              member_id: memberId,
              contribution_id: contribution.id,
              amount: new Decimal(0).minus(totalPaid),
            },
          });
        }
      } catch (error) {
        throw new PaymentProcessingError(
          `Failed to update balance: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
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

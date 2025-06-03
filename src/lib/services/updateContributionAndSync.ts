// this code assums the contributionType to be updated before this function is run to update the contibtions accordingly
import prisma from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

export async function updateContributionAndSync({
  contributionId,
  updatedData,
}: {
  contributionId: number;
  updatedData: Partial<{
    amount: Decimal;
    start_date: Date;
    end_date: Date;
    contribution_type_id: number;
  }>;
}) {
  return await prisma.$transaction(async (tx) => {
    // Update the contribution and include contributionType info
    const updatedContribution = await tx.contribution.update({
      where: { id: contributionId },
      data: updatedData,
      include: { contributionType: true },
    });

    const memberId = updatedContribution.member_id;

    // Determine number of months for schedule based on contributionType.mode and period_months
    const months =
      updatedContribution.contributionType.mode === 'OneTimeWindow' &&
      updatedContribution.contributionType.period_months
        ? updatedContribution.contributionType.period_months
        : 1;

    const monthlyAmount = updatedContribution.amount.div(months);

    // Fetch existing schedules for this contribution and member
    const existingSchedules = await tx.contributionSchedule.findMany({
      where: {
        contribution_id: contributionId,
        member_id: memberId,
      },
    });

    // Create or keep schedules for the new period
    for (let i = 0; i < months; i++) {
      const monthDate = new Date(updatedContribution.start_date);
      monthDate.setMonth(monthDate.getMonth() + i);

      const existing = existingSchedules.find(
        (s) => s.month.toISOString().slice(0, 7) === monthDate.toISOString().slice(0, 7)
      );

      if (!existing) {
        await tx.contributionSchedule.create({
          data: {
            member_id: memberId,
            contribution_id: contributionId,
            month: new Date(monthDate),
            paid_amount: new Decimal(0),
          },
        });
      }
    }

    // Delete schedules outside the new valid months
    const validMonths = Array.from({ length: months }, (_, i) => {
      const d = new Date(updatedContribution.start_date);
      d.setMonth(d.getMonth() + i);
      return d.toISOString().slice(0, 7);
    });

    for (const sched of existingSchedules) {
      const schedMonth = sched.month.toISOString().slice(0, 7);
      if (!validMonths.includes(schedMonth)) {
        await tx.contributionSchedule.delete({ where: { id: sched.id } });
      }
    }

    // Sync balance: total amount owed minus sum of payments made
    const totalPaid = await tx.payment.aggregate({
      where: { contribution_id: contributionId },
      _sum: { paid_amount: true },
    });

    const paid = totalPaid._sum.paid_amount || new Decimal(0);
    const newBalance = updatedContribution.amount.minus(paid);

    await tx.balance.upsert({
      where: {
        member_id_contribution_id: {
          member_id: memberId,
          contribution_id: contributionId,
        },
      },
      update: {
        amount: newBalance,
      },
      create: {
        member_id: memberId,
        contribution_id: contributionId,
        amount: newBalance,
      },
    });

    // Update unresolved penalties with new flat penalty_amount from contributionType
    const flatPenaltyAmount = updatedContribution.contributionType.penalty_amount || new Decimal(0);

    const unresolvedPenalties = await tx.penalty.findMany({
      where: {
        contribution_id: contributionId,
        member_id: memberId,
        resolved_at: null,
      },
    });

    for (const penalty of unresolvedPenalties) {
      if (!flatPenaltyAmount.equals(penalty.amount)) {
        await tx.penalty.update({
          where: { id: penalty.id },
          data: { amount: flatPenaltyAmount },
        });
      }
    }

    return updatedContribution;
  });
}

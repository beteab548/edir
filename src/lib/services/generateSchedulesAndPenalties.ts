// scripts/generateSchedulesAndPenalties.ts
import  prisma  from '@/lib/prisma';
import { addMonths, isBefore, startOfMonth } from 'date-fns';

export async function generateContributionSchedules() {
  const members = await prisma.member.findMany();
  const contributions = await prisma.contribution.findMany({
    include: { contributionType: true },
  });

  for (const member of members) {
    for (const contribution of contributions) {
      const existingSchedules = await prisma.contributionSchedule.findMany({
        where: {
          member_id: member.id,
          contribution_id: contribution.id,
        },
        orderBy: { month: 'asc' },
      });

      const startMonth = startOfMonth(contribution.start_date);
      const monthsToGenerate = contribution.contributionType.duration_months;

      for (let i = 0; i < monthsToGenerate; i++) {
        const month = addMonths(startMonth, i);
        const alreadyExists = existingSchedules.some(sched => sched.month.getTime() === month.getTime());

        if (!alreadyExists) {
          await prisma.contributionSchedule.create({
            data: {
              member_id: member.id,
              contribution_id: contribution.id,
              month,
              is_paid: false,
              paid_amount: 0,
            },
          });
        }
      }
    }
  }
}

export async function applyPenaltiesForMissedPayments() {
  const today = new Date();
  const unpaidSchedules = await prisma.contributionSchedule.findMany({
    where: {
      is_paid: false,
      month: { lt: startOfMonth(today) },
    },
    include: {
      contribution: { include: { contributionType: true } },
    },
  });

  for (const schedule of unpaidSchedules) {
    const existingPenalty = await prisma.penalty.findFirst({
      where: {
        member_id: schedule.member_id,
        contribution_id: schedule.contribution_id,
        resolved_at: null,
        missed_months: {
          some: {
            month: schedule.month,
          },
        },
      },
    });

    if (!existingPenalty) {
      const penalty = await prisma.penalty.create({
        data: {
          member_id: schedule.member_id,
          contribution_id: schedule.contribution_id,
          amount: schedule.contribution.contributionType.penalty_amount,
          applied_at: today,
          resolved_at: null,
        },
      });

      await prisma.penaltyMonth.create({
        data: {
          penalty_id: penalty.id,
          month: schedule.month,
        },
      });
    }
  }
}

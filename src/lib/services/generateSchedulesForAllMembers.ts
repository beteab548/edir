import { PrismaClient } from "@prisma/client";
import { addMonths, isAfter, startOfMonth } from "date-fns";

const prisma = new PrismaClient();

function generateMonthlyDates(start: Date, end: Date): Date[] {
  const dates: Date[] = [];
  let current = startOfMonth(start);
  while (!isAfter(current, end)) {
    dates.push(current);
    current = addMonths(current, 1);
  }
  return dates;
}

export async function generateContributionSchedulesForAllActiveMembers() {
  const now = new Date();
  const oneYearFromNow = addMonths(now, 12);

  const activeMembers = await prisma.member.findMany({
    where: { status: "Active" },
    include: {
      Contribution: {
        include: {
          contributionType: true,
        },
      },
    },
  });

  const allNewSchedules: {
    contribution_id: number;
    member_id: number;
    month: Date;
    paid_amount: number;
    is_paid: boolean;
  }[] = [];

  for (const member of activeMembers) {
    for (const contribution of member.Contribution) {
      const { contributionType } = contribution;

      if (!contributionType.is_active) continue;

      const startDate = contributionType.start_date ?? contribution.start_date;
      if (!startDate) continue;

      let months: Date[] = [];

      if (contributionType.mode === "Recurring") {
        if (!contributionType.end_date) continue;
        months = generateMonthlyDates(startDate, contributionType.end_date);
      } else if (contributionType.mode === "OneTimeWindow") {
        if (!contributionType.period_months) continue;
        const endDate = addMonths(startDate, contributionType.period_months);
        months = generateMonthlyDates(startDate, endDate);
      } else if (contributionType.mode === "OpenEndedRecurring") {
        months = generateMonthlyDates(startDate, oneYearFromNow);
      }

      if (months.length === 0) continue;

      // Fetch existing months in one go
      const existingSchedules = await prisma.contributionSchedule.findMany({
        where: {
          member_id: member.id,
          contribution_id: contribution.id,
          month: { in: months },
        },
        select: { month: true },
      });

      const existingMonthsSet = new Set(existingSchedules.map(s => s.month.toISOString()));

      // Filter only months that aren't already scheduled
      const missingMonths = months.filter(m => !existingMonthsSet.has(m.toISOString()));

      for (const month of missingMonths) {
        allNewSchedules.push({
          member_id: member.id,
          contribution_id: contribution.id,
          month,
          paid_amount: 0,
          is_paid: false,
        });
      }
    }
  }

  // Bulk insert all new schedules
  if (allNewSchedules.length > 0) {
    const batchSize = 500;
    for (let i = 0; i < allNewSchedules.length; i += batchSize) {
      const batch = allNewSchedules.slice(i, i + batchSize);
      await prisma.contributionSchedule.createMany({ data: batch });
    }
  }

  console.log(`✅ ${allNewSchedules.length} schedules generated.`);
}

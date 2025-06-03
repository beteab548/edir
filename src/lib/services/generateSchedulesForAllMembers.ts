import { PrismaClient } from "@prisma/client";
import { addMonths, isAfter, differenceInMonths } from "date-fns";

const prisma = new PrismaClient();

function normalizeToMonthStart(date: Date): Date {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), 1));
}

// Generates dates normalized to month start (for Recurring and OpenEndedRecurring)
function generateMonthlyDates(start: Date, end: Date): Date[] {
  const dates: Date[] = [];
  let current = normalizeToMonthStart(start);
  const normalizedEnd = normalizeToMonthStart(end);

  while (!isAfter(current, normalizedEnd)) {
    dates.push(current);
    current = addMonths(current, 1);
  }

  return dates;
}

// New: Generate monthly dates preserving exact day (for OneTimeWindow)
function generateMonthlyDatesPreserveDay(start: Date, monthsCount: number): Date[] {
  const dates: Date[] = [];
  for (let i = 0; i < monthsCount; i++) {
    dates.push(addMonths(start, i));
  }
  return dates;
}

export async function generateContributionSchedulesForAllActiveMembers() {
  const now = new Date();
  const oneYearFromNow = addMonths(now, 11);

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

  const balanceUpdatesMap = new Map<
    string,
    { member_id: number; contribution_id: number; amount: number }
  >();

  for (const member of activeMembers) {
    for (const contribution of member.Contribution) {
      const { contributionType } = contribution;
      if (!contributionType.is_active) continue;

      if (!contributionType) continue;

      if (contributionType.mode === "OneTimeWindow") {
        // Use exact member join date as start
        const startDate = contribution.start_date ?? contributionType.start_date;
        if (!startDate || !contributionType.period_months) continue;

        const months = generateMonthlyDatesPreserveDay(
          startDate,
          contributionType.period_months
        );

        const contributionAmount = Number(contributionType.amount);
        if (contributionAmount <= 0) continue;
        const monthlyAmount = contributionAmount / months.length;

        const existingSchedules = await prisma.contributionSchedule.findMany({
          where: {
            member_id: member.id,
            contribution_id: contribution.id,
            month: { in: months },
          },
          select: { month: true },
        });

        const existingMonthsSet = new Set(
          existingSchedules.map((s) => s.month.toISOString())
        );
        const missingMonths = months.filter(
          (m) => !existingMonthsSet.has(m.toISOString())
        );

        for (const month of missingMonths) {
          allNewSchedules.push({
            member_id: member.id,
            contribution_id: contribution.id,
            month,
            paid_amount: 0,
            is_paid: false,
          });
        }

        if (missingMonths.length > 0) {
          const key = `${member.id}-${contribution.id}`;

          // Only add full amount once, if schedules didn't exist before
          const isFirstTime = existingSchedules.length === 0;
          const totalAmount = isFirstTime ? contributionAmount : 0;

          if (totalAmount > 0) {
            if (balanceUpdatesMap.has(key)) {
              balanceUpdatesMap.get(key)!.amount += totalAmount;
            } else {
              balanceUpdatesMap.set(key, {
                member_id: member.id,
                contribution_id: contribution.id,
                amount: totalAmount,
              });
            }
          }
        }

        continue;
      }

      // For Recurring and OpenEndedRecurring
      let startDate = contributionType.start_date ?? contribution.start_date;
      if (!startDate) continue;

      if (contributionType.mode === "Recurring") {
        if (!contributionType.end_date) continue;
        const months = generateMonthlyDates(startDate, contributionType.end_date);

        const existingSchedules = await prisma.contributionSchedule.findMany({
          where: {
            member_id: member.id,
            contribution_id: contribution.id,
            month: { in: months },
          },
          select: { month: true },
        });

        const existingMonthsSet = new Set(
          existingSchedules.map((s) => s.month.toISOString())
        );
        const missingMonths = months.filter(
          (m) => !existingMonthsSet.has(m.toISOString())
        );

        const contributionAmount = Number(contributionType.amount);
        if (contributionAmount <= 0) continue;

        for (const month of missingMonths) {
          allNewSchedules.push({
            member_id: member.id,
            contribution_id: contribution.id,
            month,
            paid_amount: 0,
            is_paid: false,
          });
        }

        if (missingMonths.length > 0) {
          const key = `${member.id}-${contribution.id}`;
          const totalAmount = contributionAmount * missingMonths.length;
          if (balanceUpdatesMap.has(key)) {
            balanceUpdatesMap.get(key)!.amount += totalAmount;
          } else {
            balanceUpdatesMap.set(key, {
              member_id: member.id,
              contribution_id: contribution.id,
              amount: totalAmount,
            });
          }
        }
        continue;
      }

      if (contributionType.mode === "OpenEndedRecurring") {
        // Use contribution start date if present, else type start date
        const recurringStart = contribution.start_date ?? startDate;
        const months = generateMonthlyDates(
          recurringStart,
          oneYearFromNow
        );

        const existingSchedules = await prisma.contributionSchedule.findMany({
          where: {
            member_id: member.id,
            contribution_id: contribution.id,
            month: { in: months },
          },
          select: { month: true },
        });

        const existingMonthsSet = new Set(
          existingSchedules.map((s) => s.month.toISOString())
        );
        const missingMonths = months.filter(
          (m) => !existingMonthsSet.has(m.toISOString())
        );

        const contributionAmount = Number(contributionType.amount);
        if (contributionAmount <= 0) continue;

        for (const month of missingMonths) {
          allNewSchedules.push({
            member_id: member.id,
            contribution_id: contribution.id,
            month,
            paid_amount: 0,
            is_paid: false,
          });
        }

        if (missingMonths.length > 0) {
          const key = `${member.id}-${contribution.id}`;
          const totalAmount = contributionAmount * missingMonths.length;
          if (balanceUpdatesMap.has(key)) {
            balanceUpdatesMap.get(key)!.amount += totalAmount;
          } else {
            balanceUpdatesMap.set(key, {
              member_id: member.id,
              contribution_id: contribution.id,
              amount: totalAmount,
            });
          }
        }
      }
    }
  }

  if (allNewSchedules.length > 0) {
    const batchSize = 500;
    for (let i = 0; i < allNewSchedules.length; i += batchSize) {
      const batch = allNewSchedules.slice(i, i + batchSize);
      await prisma.contributionSchedule.createMany({ data: batch });
    }
  }

  for (const update of Array.from(balanceUpdatesMap.values())) {
    await prisma.balance.upsert({
      where: {
        member_id_contribution_id: {
          member_id: update.member_id,
          contribution_id: update.contribution_id,
        },
      },
      update: {
        amount: { increment: update.amount },
      },
      create: {
        member_id: update.member_id,
        contribution_id: update.contribution_id,
        amount: update.amount,
      },
    });
  }

  // Penalty logic
  // const today = new Date();

const today = addMonths(new Date(), 1);
console.log(today);
  const unpaidSchedules = await prisma.contributionSchedule.findMany({
    where: {
      is_paid: false,
    },
    include: {
      penalties: true,
      contribution: {
        select: {
          start_date: true,
          contributionType: {
            select: {
              penalty_amount: true,
              mode: true,
              period_months: true,
              start_date: true,
            },
          },
        },
      },
    },
  });

  for (const schedule of unpaidSchedules) {
    const existingPenalty = schedule.penalties.find((p) => !p.is_paid);
    if (existingPenalty) continue;

    const contributionType = schedule.contribution.contributionType;
    if (!contributionType) continue;

    const penaltyAmount = Number(contributionType.penalty_amount ?? 10);
    if (penaltyAmount <= 0) continue;

    if (contributionType.mode === "OneTimeWindow") {
      const contributionStartDate = schedule.contribution.start_date;
      if (!contributionStartDate || !contributionType.period_months) continue;

      const monthsSinceStart = differenceInMonths(
        schedule.month,
        contributionStartDate
      );

      const penaltyDueDate = addMonths(
        contributionStartDate,
        monthsSinceStart + 1
      );

      if (isAfter(today, penaltyDueDate)) {
        await prisma.penalty.create({
          data: {
            member_id: schedule.member_id,
            contribution_id: schedule.contribution_id,
            contribution_schedule_id: schedule.id,
            reason: `Missed payment for ${schedule.month.toISOString().slice(0, 7)}`,
            amount: penaltyAmount,
            missed_month: schedule.month,
            is_paid: false,
            applied_at: new Date(),
          },
        });
      }
    } else {
      const startOfCurrentMonth = new Date(
        today.getFullYear(),
        today.getMonth(),
        1
      );
      if (schedule.month < startOfCurrentMonth) {
        await prisma.penalty.create({
          data: {
            member_id: schedule.member_id,
            contribution_id: schedule.contribution_id,
            contribution_schedule_id: schedule.id,
            reason: `Missed payment for ${schedule.month.toISOString().slice(0, 7)}`,
            amount: penaltyAmount,
            missed_month: schedule.month,
            is_paid: false,
            applied_at: new Date(),
          },
        });
      }
    }
  }

  console.log(`✅ ${allNewSchedules.length} schedules generated.`);
  console.log(`✅ ${balanceUpdatesMap.size} balances updated.`);
  console.log(`✅ penalties processed.`);
}

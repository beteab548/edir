import { PrismaClient } from "@prisma/client";
import { addMonths, isAfter, differenceInMonths } from "date-fns";

const prisma = new PrismaClient();

function normalizeToMonthStart(date: Date): Date {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), 1));
}

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

async function inactivateMember(memberId: number) {
  await prisma.member.update({
    where: { id: memberId },
    data: {
      status: "Inactive",
      remark: "Inactivated due to missed contributions",
      status_updated_at: new Date(),
    },
  });
}

const test = false;
const realCurrentDate = new Date();
const simulatedMonthsToAdd = 5;
const currentMonthStart = normalizeToMonthStart(
  test ? addMonths(realCurrentDate, simulatedMonthsToAdd) : realCurrentDate
);

export async function generateContributionSchedulesForAllActiveMembers() {
  const now = new Date();
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
    expected_amount: number;
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
      if (!contributionType?.is_active) continue;

      let startDate = contributionType.start_date ?? contribution.start_date;
      if (!startDate) continue;

      const contributionAmount = Number(contributionType.amount);
      if (contributionAmount <= 0) continue;

      if (contributionType.mode === "OneTimeWindow") {
        const existingSchedule = await prisma.contributionSchedule.findFirst({
          where: {
            member_id: member.id,
            contribution_id: contribution.id,
          },
        });

        if (!existingSchedule) {
          allNewSchedules.push({
            member_id: member.id,
            contribution_id: contribution.id,
            month: startDate,
            paid_amount: 0,
            is_paid: false,
            expected_amount: contributionAmount,
          });

          const key = `${member.id}-${contribution.id}`;
          balanceUpdatesMap.set(key, {
            member_id: member.id,
            contribution_id: contribution.id,
            amount: contributionAmount,
          });
        }
        continue;
      }

      if (contributionType.mode === "Recurring") {
        if (!contribution.start_date || !contributionType.end_date) continue;

        const recurringStart = normalizeToMonthStart(contribution.start_date);
        const recurringEnd = normalizeToMonthStart(contributionType.end_date);
        const months = generateMonthlyDates(recurringStart, recurringEnd);

        const existingSchedules = await prisma.contributionSchedule.findMany({
          where: {
            member_id: member.id,
            contribution_id: contribution.id,
            month: { in: months },
          },
          select: { month: true },
        });

        const existingMonthsSet = new Set(
          existingSchedules.map((s) =>
            normalizeToMonthStart(s.month).toISOString()
          )
        );

        const missingMonths = months.filter(
          (m) => !existingMonthsSet.has(normalizeToMonthStart(m).toISOString())
        );

        for (const month of missingMonths) {
          allNewSchedules.push({
            member_id: member.id,
            contribution_id: contribution.id,
            month,
            paid_amount: 0,
            is_paid: false,
            expected_amount: contributionAmount,
          });
        }

        if (missingMonths.length > 0) {
          const key = `${member.id}-${contribution.id}`;
          const totalAmount = contributionAmount * missingMonths.length;
          balanceUpdatesMap.set(key, {
            member_id: member.id,
            contribution_id: contribution.id,
            amount: totalAmount,
          });
        }

        continue;
      }

      if (contributionType.mode === "OpenEndedRecurring") {
        const recurringStart = normalizeToMonthStart(
          contribution.start_date ?? startDate
        );

        const endDate = addMonths(now, 11);
        const months = generateMonthlyDates(recurringStart, endDate);

        const existingSchedules = await prisma.contributionSchedule.findMany({
          where: {
            member_id: member.id,
            contribution_id: contribution.id,
            month: { in: months },
          },
          select: { month: true },
        });

        const existingMonthsSet = new Set(
          existingSchedules.map((s) =>
            normalizeToMonthStart(s.month).toISOString()
          )
        );

        const missingMonths = months.filter(
          (m) => !existingMonthsSet.has(normalizeToMonthStart(m).toISOString())
        );

        for (const month of missingMonths) {
          allNewSchedules.push({
            member_id: member.id,
            contribution_id: contribution.id,
            month,
            paid_amount: 0,
            is_paid: false,
            expected_amount: contributionAmount,
          });
        }

        if (missingMonths.length > 0) {
          const key = `${member.id}-${contribution.id}`;
          const totalAmount = contributionAmount * missingMonths.length;
          balanceUpdatesMap.set(key, {
            member_id: member.id,
            contribution_id: contribution.id,
            amount: totalAmount,
          });
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

  const unpaidSchedules = await prisma.contributionSchedule.findMany({
    where: { is_paid: false },
    include: {
      penalties: true,
      contribution: {
        select: {
          start_date: true,
          contributionType: {
            select: {
              name: true,
              penalty_amount: true,
              mode: true,
              period_months: true,
              start_date: true,
            },
          },
          member: {
            select: {
              status: true,
            },
          },
        },
      },
    },
  });

  const penaltiesToCreate: {
    member_id: number;
    contribution_id: number;
    contribution_schedule_id: number;
    reason: string;
    expected_amount: number;
    missed_month: Date;
    is_paid: boolean;
    applied_at: Date;
    penalty_type: string;
  }[] = [];

  for (const schedule of unpaidSchedules) {
    const contribution = schedule.contribution;
    const contributionType = contribution.contributionType;
    const memberStatus = contribution.member?.status;

    if (!contributionType || memberStatus !== "Active") continue;
    if (contributionType.mode === "OneTimeWindow") continue;

    const penaltyBase = Number(contributionType.penalty_amount ?? 10);
    if (penaltyBase <= 0) continue;

    const scheduleMonthStart = normalizeToMonthStart(schedule.month);

    if (isAfter(currentMonthStart, scheduleMonthStart)) {
      const monthsLate = differenceInMonths(
        currentMonthStart,
        scheduleMonthStart
      );
      const calculatedPenaltyAmount = penaltyBase * monthsLate;

      const existingUnpaidPenalty = schedule.penalties.find((p) => !p.is_paid);

      if (existingUnpaidPenalty) {
        if (
          Number(existingUnpaidPenalty.expected_amount) <
          calculatedPenaltyAmount
        ) {
          await prisma.penalty.update({
            where: { id: existingUnpaidPenalty.id },
            data: {
              expected_amount: calculatedPenaltyAmount,
              applied_at: new Date(),
              reason: `Missed payment for ${schedule.month
                .toISOString()
                .slice(0, 7)}`,
            },
          });
        }
      } else {
        penaltiesToCreate.push({
          member_id: schedule.member_id,
          contribution_id: schedule.contribution_id,
          contribution_schedule_id: schedule.id,
          reason: `Missed payment for ${schedule.month
            .toISOString()
            .slice(0, 7)}`,
          expected_amount: calculatedPenaltyAmount,
          missed_month: schedule.month,
          is_paid: false,
          applied_at: new Date(),
          penalty_type: contributionType.name ?? "Unknown",
        });
      }
    }
  }

  if (penaltiesToCreate.length > 0) {
    const batchSize = 500;
    for (let i = 0; i < penaltiesToCreate.length; i += batchSize) {
      const batch = penaltiesToCreate.slice(i, i + batchSize);
      await prisma.penalty.createMany({ data: batch });
    }
  }

  const oneTimeContributions = await prisma.contribution.findMany({
    where: {
      contributionType: {
        mode: "OneTimeWindow",
        is_active: true,
      },
      member: {
        status: "Active",
      },
    },
    include: {
      member: true,
      contributionType: true,
    },
  });

  for (const contribution of oneTimeContributions) {
    const gracePeriodMonths = contribution.contributionType.period_months ?? 3;

    const schedule = await prisma.contributionSchedule.findFirst({
      where: {
        contribution_id: contribution.id,
        member_id: contribution.member_id,
      },
    });
    if (!schedule || schedule.is_paid) continue;

    const deadline = addMonths(schedule.month, gracePeriodMonths);
    if (isAfter(currentMonthStart, deadline)) {
      await inactivateMember(contribution.member_id);
    }
  }

  const openEndedContributions = await prisma.contribution.findMany({
    where: {
      contributionType: {
        mode: "OpenEndedRecurring",
        is_active: true,
      },
      member: {
        status: "Active",
      },
    },
    include: {
      member: true,
      contributionType: true,
      ContributionSchedule: {
        where: { is_paid: false },
      },
    },
  });

  for (const contribution of openEndedContributions) {
    const gracePeriodMonths = 5;

    const unpaidSchedules = contribution.ContributionSchedule;
    if (unpaidSchedules.length === 0) continue;

    const earliestUnpaid = unpaidSchedules.sort(
      (a, b) => a.month.getTime() - b.month.getTime()
    )[0];

    const deadline = addMonths(earliestUnpaid.month, gracePeriodMonths);
    if (isAfter(currentMonthStart, deadline)) {
      await inactivateMember(contribution.member_id);
    }
  }

  const recurringContributions = await prisma.contribution.findMany({
    where: {
      contributionType: {
        mode: "Recurring",
        is_active: true,
      },
      member: {
        status: "Active",
      },
    },
    include: {
      member: true,
      contributionType: true,
      ContributionSchedule: {
        where: { is_paid: false },
      },
    },
  });

  for (const contribution of recurringContributions) {
    const { contributionType, ContributionSchedule } = contribution;

    if (!contributionType.end_date) continue;

    // const hasEnded = new Date() > contributionType.end_date;
    const hasEnded = currentMonthStart > contributionType.end_date;
    if (hasEnded && ContributionSchedule.length > 0) {
      await inactivateMember(contribution.member_id);
    }
  }
}

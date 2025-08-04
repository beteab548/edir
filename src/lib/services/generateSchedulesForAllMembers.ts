import {
  ContributionSchedule,
  Prisma,
  PrismaClient,
  Member,
  Contribution,
} from "@prisma/client";
import { addMonths, isAfter, differenceInMonths, startOfMonth } from "date-fns";
import prisma from "../prisma";

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

/**
 * Updates a member's status to Inactive.
 */
async function inactivateMember(memberId: number, simulate: boolean = false) {
  if (simulate) {
    console.log(`SIMULATION: Would inactivate member ${memberId}.`);
    return;
  }
  await prisma.member.update({
    where: { id: memberId },
    data: {
      status: "Inactive",
      remark: "Inactivated due to missed contributions",
      status_updated_at: new Date(),
    },
  });
}

interface GenerateSchedulesOptions {
  simulate?: boolean;
  simulationMonths?: number;
}

/**
 * Main function to generate contribution schedules, penalties, and handle payments.
 */
export async function generateContributionSchedulesForAllActiveMembers(
  options: GenerateSchedulesOptions = {}
) {
  const { simulate = true, simulationMonths = 2 } = options;
  const now = simulate
    ? normalizeToMonthStart(addMonths(new Date(), simulationMonths))
    : normalizeToMonthStart(new Date());
  const currentMonthStart = addMonths(now, 0);

  // STEP 1: Recalculate all balances first to ensure they are up-to-date.
  const activeMembers = await prisma.member.findMany({
    where: { status: "Active" },
    include: {
      Contribution: {
        include: {
          contributionType: true,
          ContributionSchedule: true,
        },
      },
    },
  });

  await recalculateMemberContributionBalances(activeMembers);

  // STEP 2: Generate new schedules and process payments from unallocated funds.
  const allNewSchedules = [];
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

      // Handle 'OneTimeWindow' contributions
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

      // Handle 'Recurring' and 'OpenEndedRecurring' contributions
      let recurringStart = normalizeToMonthStart(
        contribution.start_date ?? startDate
      );
      let recurringEnd: Date;

      if (contributionType.mode === "Recurring") {
        if (!contributionType.end_date) continue;
        recurringEnd = normalizeToMonthStart(contributionType.end_date);
      } else {
        // OpenEndedRecurring
        recurringEnd = addMonths(now, 11); // Generate for the next 12 months
      }

      const months = generateMonthlyDates(recurringStart, recurringEnd);
      const existingSchedules = await prisma.contributionSchedule.findMany({
        where: {
          member_id: member.id,
          contribution_id: contribution.id,
          month: { in: months },
        },
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

      // =================================================================
      // MODIFIED SECTION: Handle unallocated amount with payment records
      // =================================================================
      const balance = await prisma.balance.findUnique({
        where: {
          member_id_contribution_id: {
            member_id: member.id,
            contribution_id: contribution.id,
          },
        },
      });

      let unallocatedAmount = Number(balance?.unallocated_amount ?? 0);

      if (unallocatedAmount > 0) {
        await prisma.$transaction(
          async (tx) => {
            let remainingUnallocated = unallocatedAmount;
            if (remainingUnallocated <= 0) return;
            const nextId = (await tx.paymentRecord.count()) + 1;
            const formattedId = `PYN-${nextId.toString().padStart(4, "0")}`;
            const paymentRecord = await tx.paymentRecord.create({
              data: {
                custom_id: `${formattedId}-auto-paid`,
                member_id: member.id,
                contribution_Type_id: contribution.contribution_type_id,
                payment_method: "system",
                document_reference: "Automated System Allocation",
                total_paid_amount: 0,
              },
            });

            let totalAllocatedForRecord = 0;

            // 1. Pay past penalties first
            const pastSchedules = await tx.contributionSchedule.findMany({
              where: {
                member_id: member.id,
                contribution_id: contribution.id,
                is_paid: false,
                month: { lt: startOfMonth(currentMonthStart) },
              },
              orderBy: { month: "asc" },
            });

            for (const schedule of pastSchedules) {
              const unpaidPenalties = await tx.penalty.findMany({
                where: {
                  contribution_schedule_id: schedule.id,
                  is_paid: false,
                },
                orderBy: { applied_at: "asc" },
              });

              for (const penalty of unpaidPenalties) {
                if (remainingUnallocated <= 0) break;
                const due =
                  Number(penalty.expected_amount) - Number(penalty.paid_amount);
                if (due <= 0) continue;

                const toPay = Math.min(remainingUnallocated, due);

                await tx.penalty.update({
                  where: { id: penalty.id },
                  data: {
                    paid_amount: { increment: toPay },
                    is_paid:
                      Number(penalty.paid_amount) + toPay >=
                      Number(penalty.expected_amount),
                    resolved_at: new Date(),
                  },
                });

                await tx.payment.create({
                  data: {
                    payment_record_id: paymentRecord.id,
                    member_id: member.id,
                    contribution_id: contribution.id,
                    penalty_id: penalty.id,
                    payment_type: "Penalty",
                    payment_month: penalty.missed_month.toISOString(),
                    paid_amount: toPay,
                  },
                });

                remainingUnallocated -= toPay;
                totalAllocatedForRecord += toPay;
              }

              // 2. Pay past schedules
              if (remainingUnallocated <= 0) continue;

              const paidAlready = Number(schedule.paid_amount);
              const remainingDue =
                Number(schedule.expected_amount) - paidAlready;
              if (remainingDue > 0) {
                const toApply = Math.min(remainingUnallocated, remainingDue);

                await tx.contributionSchedule.update({
                  where: { id: schedule.id },
                  data: {
                    paid_amount: { increment: toApply },
                    is_paid:
                      paidAlready + toApply >= Number(schedule.expected_amount),
                    paid_at: new Date(),
                  },
                });

                await tx.payment.create({
                  data: {
                    payment_record_id: paymentRecord.id,
                    member_id: member.id,
                    contribution_id: contribution.id,
                    contribution_schedule_id: schedule.id,
                    payment_type: contribution.type_name,
                    payment_month: schedule.month.toISOString(),
                    paid_amount: toApply,
                  },
                });

                remainingUnallocated -= toApply;
                totalAllocatedForRecord += toApply;
              }
            }

            // 3. NEW: Pay current month's schedule if funds remain
            if (remainingUnallocated > 0) {
              const currentSchedule = await tx.contributionSchedule.findFirst({
                where: {
                  member_id: member.id,
                  contribution_id: contribution.id,
                  month: {
                    gte: startOfMonth(currentMonthStart),
                    lt: startOfMonth(addMonths(currentMonthStart, 1)),
                  },
                  is_paid: false,
                },
              });

              if (currentSchedule) {
                const paidAlready = Number(currentSchedule.paid_amount);
                const remainingDue = contributionAmount - paidAlready;

                if (remainingDue > 0) {
                  const toPay = Math.min(remainingUnallocated, remainingDue);

                  await tx.contributionSchedule.update({
                    where: { id: currentSchedule.id },
                    data: {
                      paid_amount: { increment: toPay },
                      is_paid: paidAlready + toPay >= contributionAmount,
                      paid_at: new Date(),
                    },
                  });

                  await tx.payment.create({
                    data: {
                      payment_record_id: paymentRecord.id,
                      member_id: member.id,
                      contribution_id: contribution.id,
                      contribution_schedule_id: currentSchedule.id,
                      payment_type: contribution.type_name,
                      payment_month: currentSchedule.month.toISOString(),
                      paid_amount: toPay,
                    },
                  });

                  remainingUnallocated -= toPay;
                  totalAllocatedForRecord += toPay;
                }
              }
            }

            // Final balance updates
            if (totalAllocatedForRecord > 0) {
              await tx.balance.update({
                where: {
                  member_id_contribution_id: {
                    member_id: member.id,
                    contribution_id: contribution.id,
                  },
                },
                data: {
                  unallocated_amount: { decrement: totalAllocatedForRecord },
                  amount: { decrement: totalAllocatedForRecord },
                },
              });
              const updatedBalance = await tx.balance.findUnique({
                where: {
                  member_id_contribution_id: {
                    member_id: member.id,
                    contribution_id: contribution.id,
                  },
                },
              });

              if (!updatedBalance) {
                // This is a safety check; it should never be triggered in this flow.
                throw new Error(
                  `Failed to retrieve balance for member ${member.id} after auto-payment.`
                );
              }

              // Now, update the payment record with BOTH the total paid and the new remaining balance.
              await tx.paymentRecord.update({
                where: { id: paymentRecord.id },
                data: {
                  total_paid_amount: totalAllocatedForRecord,
                  remaining_balance: updatedBalance.amount,
                },
              });
            } else {
              await tx.paymentRecord.delete({
                where: { id: paymentRecord.id },
              });
            }
          },
          {
            isolationLevel: "Serializable",
            timeout: 20000,
          }
        );
      }
      // =================================================================
      // END OF MODIFIED SECTION
      // =================================================================
    }
  }

  // BATCH OPERATIONS: Create new schedules and update balances efficiently.

  if (allNewSchedules.length > 0) {
    console.log(`Creating ${allNewSchedules.length} new schedules`);
    const batchSize = 500;
    for (let i = 0; i < allNewSchedules.length; i += batchSize) {
      const batch = allNewSchedules.slice(i, i + batchSize);
      await prisma.contributionSchedule.createMany({
        data: batch,
        skipDuplicates: true,
      });
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
      update: { amount: { increment: update.amount } },
      create: {
        member_id: update.member_id,
        contribution_id: update.contribution_id,
        amount: update.amount,
        unallocated_amount: 0,
      },
    });
  }

  // PENALTY GENERATION LOGIC
  const unpaidSchedules = await prisma.contributionSchedule.findMany({
    where: { is_paid: false },
    include: {
      penalties: true,
      contribution: {
        select: {
          contributionType: {
            select: { name: true, penalty_amount: true, mode: true },
          },
          member: { select: { status: true } },
        },
      },
    },
  });

  const penaltiesToCreate = [];
  for (const schedule of unpaidSchedules) {
    const { contribution } = schedule;
    const { contributionType, member } = contribution;
    if (
      !contributionType ||
      member?.status !== "Active" ||
      contributionType.mode === "OneTimeWindow"
    )
      continue;

    const penaltyBase = Number(contributionType.penalty_amount ?? 0);
    if (penaltyBase <= 0) continue;

    const scheduleMonthStart = normalizeToMonthStart(schedule.month);
    if (isAfter(currentMonthStart, scheduleMonthStart)) {
      const monthsLate = differenceInMonths(
        currentMonthStart,
        scheduleMonthStart
      );
      const calculatedPenaltyAmount = penaltyBase * monthsLate;
      const existingPenaltyForMonth = await prisma.penalty.findUnique({
        where: {
          member_id_contribution_id_missed_month: {
            member_id: schedule.member_id,
            contribution_id: schedule.contribution_id,
            missed_month: schedule.month,
          },
        },
      });

      if (existingPenaltyForMonth) {
        // A penalty for this month already exists. We should only UPDATE it if the amount has increased.
        if (
          Number(existingPenaltyForMonth.expected_amount) <
            calculatedPenaltyAmount &&
          !existingPenaltyForMonth.is_paid
        ) {
          await prisma.penalty.update({
            where: { id: existingPenaltyForMonth.id },
            data: {
              expected_amount: calculatedPenaltyAmount,
              applied_at: new Date(),
            },
          });
        }
        // If the existing penalty is already paid, or the amount hasn't increased, we do nothing.
      } else {
        // No penalty has ever been created for this missed month for this member.
        // It is safe to create a new one.
        penaltiesToCreate.push({
          member_id: schedule.member_id,
          contribution_id: schedule.contribution_id,
          contribution_schedule_id: schedule.id,
          reason: `Missed payment for ${schedule.month.toLocaleDateString(
            "en-US",
            {
              year: "numeric",
              month: "short",
            }
          )}`,
          expected_amount: calculatedPenaltyAmount,
          missed_month: schedule.month,
          penalty_type: contributionType.name ?? "Unknown",
        });
      }
    }
  }

  if (penaltiesToCreate.length > 0) {
    console.log(`Creating ${penaltiesToCreate.length} new penalties`);
    await prisma.penalty.createMany({
      data: penaltiesToCreate,
      skipDuplicates: true,
    });
  }

  // MEMBER INACTIVATION LOGIC
  const contributionsForInactivation = await prisma.contribution.findMany({
    where: {
      member: { status: "Active" },
      contributionType: { is_active: true },
    },
    include: {
      member: true,
      contributionType: true,
      ContributionSchedule: { where: { is_paid: false } },
    },
  });

  for (const contribution of contributionsForInactivation) {
    const {
      contributionType,
      ContributionSchedule: unpaidSchedules,
      member,
    } = contribution;

    if (contributionType.mode === "OneTimeWindow") {
      const gracePeriodMonths = contributionType.period_months ?? 3;
      const schedule = await prisma.contributionSchedule.findFirst({
        where: { contribution_id: contribution.id },
      });
      if (!schedule || schedule.is_paid) continue;

      const deadline = addMonths(schedule.month, gracePeriodMonths);
      if (isAfter(currentMonthStart, deadline)) {
        await inactivateMember(member.id, simulate);
      }
    } else if (contributionType.mode === "OpenEndedRecurring") {
      const gracePeriodMonths =
        contributionType.months_before_inactivation ?? 5;
      if (unpaidSchedules.length === 0) continue;
      const earliestUnpaid = unpaidSchedules.sort(
        (a, b) => a.month.getTime() - b.month.getTime()
      )[0];
      const deadline = addMonths(earliestUnpaid.month, gracePeriodMonths);
      if (isAfter(currentMonthStart, deadline)) {
        await inactivateMember(member.id, simulate);
      }
    } else if (contributionType.mode === "Recurring") {
      if (!contributionType.end_date) continue;
      const hasEnded = isAfter(currentMonthStart, contributionType.end_date);
      if (hasEnded && unpaidSchedules.length > 0) {
        await inactivateMember(member.id, simulate);
      }
    }
  }

  return {
    success: true,
    simulated: simulate,
    simulationMonths,
    newSchedulesCount: allNewSchedules.length,
    newPenaltiesCount: penaltiesToCreate.length,
    currentSimulationDate: currentMonthStart,
  };
}

/**
 * Recalculates the total balance for a list of members based on their schedules.
 */
async function recalculateMemberContributionBalances(
  members: (Member & {
    Contribution: (Contribution & {
      ContributionSchedule: ContributionSchedule[];
    })[];
  })[]
) {
  const balanceRecalculations: Prisma.PrismaPromise<any>[] = [];

  for (const member of members) {
    for (const contribution of member.Contribution) {
      const totalExpected = contribution.ContributionSchedule.reduce(
        (sum, schedule) => sum + Number(schedule.expected_amount),
        0
      );
      const totalPaid = contribution.ContributionSchedule.reduce(
        (sum, schedule) => sum + Number(schedule.paid_amount),
        0
      );
      const balanceAmount = Math.max(0, totalExpected - totalPaid);

      balanceRecalculations.push(
        prisma.balance.upsert({
          where: {
            member_id_contribution_id: {
              member_id: member.id,
              contribution_id: contribution.id,
            },
          },
          update: { amount: balanceAmount },
          create: {
            member_id: member.id,
            contribution_id: contribution.id,
            amount: balanceAmount,
          },
        })
      );
    }
  }

  if (balanceRecalculations.length > 0) {
    console.log(`Recalculating ${balanceRecalculations.length} balances...`);
    await prisma.$transaction(balanceRecalculations);
  }
}

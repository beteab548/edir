import { addMonths, isAfter, differenceInMonths, startOfMonth } from "date-fns";
import prisma from "../prisma";
import { Prisma, Member, Contribution } from "@prisma/client";

function normalizeToMonthStart(date: Date) {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), 1));
}

function generateMonthlyDates(start: Date, end: Date) {
  const dates: Date[] = [];
  let current = normalizeToMonthStart(start);
  const normalizedEnd = normalizeToMonthStart(end);
  while (!isAfter(current, normalizedEnd)) {
    dates.push(current);
    current = addMonths(current, 1);
  }
  return dates;
}

interface GenerateSchedulesOptions {
  simulate?: boolean;
  simulationMonths?: number;
}

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

export async function generateContributionSchedulesForAllActiveMembers(
  options: GenerateSchedulesOptions = {}
) {
  const { simulate = true, simulationMonths = 2 } = options;

  const now = simulate
    ? normalizeToMonthStart(addMonths(new Date(), simulationMonths))
    : normalizeToMonthStart(new Date());
  const currentMonthStart = startOfMonth(now);

  /** 1) Bulk load active members and static related data */
  const activeMembers = await prisma.member.findMany({
    where: { status: "Active" },
    include: {
      Contribution: {
        include: { contributionType: true },
      },
    },
  });

  if (activeMembers.length === 0) {
    return {
      success: true,
      simulated: simulate,
      newSchedulesCount: 0,
      newPenaltiesCount: 0,
      updatedPenaltiesCount: 0,
      currentSimulationDate: currentMonthStart,
    };
  }

  const memberIds = activeMembers.map((m) => m.id);

  /** 2) Prefetch schedules, balances (penalties removed from here) */
  const [allSchedules, allBalances] = await Promise.all([
    prisma.contributionSchedule.findMany({
      where: { member_id: { in: memberIds } },
    }),
    prisma.balance.findMany({
      where: { member_id: { in: memberIds } },
    }),
  ]);

  /** Maps for fast lookups */
  const schedulesByKey = new Map<string, typeof allSchedules>();
  for (const s of allSchedules) {
    const key = `${s.member_id}-${s.contribution_id}`;
    if (!schedulesByKey.has(key)) schedulesByKey.set(key, []);
    schedulesByKey.get(key)!.push(s);
  }

  // ensure schedules arrays are sorted ascending by month (oldest first)
  for (const arr of Array.from(schedulesByKey.values())) {
    arr.sort((a, b) => a.month.getTime() - b.month.getTime());
  }

  const balanceMap = new Map<string, (typeof allBalances)[number]>();
  for (const b of allBalances) {
    balanceMap.set(`${b.member_id}-${b.contribution_id}`, b);
  }

  /** Collections to create/update in bulk */
  const newSchedules: Prisma.ContributionScheduleCreateManyInput[] = [];
  const balanceUpserts: Array<{
    where: Prisma.BalanceWhereUniqueInput;
    update: Prisma.BalanceUpdateInput;
    create: Prisma.BalanceCreateInput;
  }> = [];

  /** 3) Generate missing schedules */
  for (const member of activeMembers) {
    for (const contrib of member.Contribution) {
      const { contributionType } = contrib;
      if (!contributionType?.is_active) continue;

      const contributionAmount = Number(contributionType.amount || 0);
      if (contributionAmount <= 0) continue;

      let startDate = contributionType.start_date ?? contrib.start_date;
      if (!startDate) continue;

      const key = `${member.id}-${contrib.id}`;
      const schedulesForThis = schedulesByKey.get(key) || [];

      if (contributionType.mode === "OneTimeWindow") {
        if (schedulesForThis.length === 0) {
          newSchedules.push({
            member_id: member.id,
            contribution_id: contrib.id,
            month: startDate,
            expected_amount: contributionAmount,
            paid_amount: 0,
            is_paid: false,
          });

          balanceUpserts.push({
            where: {
              member_id_contribution_id: {
                member_id: member.id,
                contribution_id: contrib.id,
              },
            },
            update: { amount: { increment: contributionAmount } },
            create: {
              member: { connect: { id: member.id } },
              contribution: { connect: { id: contrib.id } },
              amount: contributionAmount,
              unallocated_amount: 0,
            },
          });
        }
        continue;
      }

      // Recurring or OpenEndedRecurring
      let recurringStart = normalizeToMonthStart(startDate);
      let recurringEnd: Date;
      if (contributionType.mode === "Recurring") {
        if (!contributionType.end_date) continue;
        recurringEnd = normalizeToMonthStart(contributionType.end_date);
      } else {
        recurringEnd = addMonths(now, 11);
      }

      const months = generateMonthlyDates(recurringStart, recurringEnd);
      const existingMonths = new Set(
        schedulesForThis.map((s) =>
          normalizeToMonthStart(s.month).toISOString()
        )
      );
      const missingMonths = months.filter(
        (m) => !existingMonths.has(normalizeToMonthStart(m).toISOString())
      );

      if (missingMonths.length > 0) {
        for (const m of missingMonths) {
          newSchedules.push({
            member_id: member.id,
            contribution_id: contrib.id,
            month: m,
            expected_amount: contributionAmount,
            paid_amount: 0,
            is_paid: false,
          });
        }
        balanceUpserts.push({
          where: {
            member_id_contribution_id: {
              member_id: member.id,
              contribution_id: contrib.id,
            },
          },
          update: {
            amount: { increment: contributionAmount * missingMonths.length },
          },
          create: {
            member: { connect: { id: member.id } },
            contribution: { connect: { id: contrib.id } },
            amount: contributionAmount * missingMonths.length,
            unallocated_amount: 0,
          },
        });
      }
    }
  }

  /** 4) Commit new schedules and balances in bulk */
  if (newSchedules.length > 0) {
    for (let i = 0; i < newSchedules.length; i += 500) {
      await prisma.contributionSchedule.createMany({
        data: newSchedules.slice(i, i + 500),
        skipDuplicates: true,
      });
    }
  }

  if (balanceUpserts.length > 0) {
    await prisma.$transaction(
      balanceUpserts.map((u) => prisma.balance.upsert(u)),
      {
        isolationLevel: "Serializable",
      }
    );
  }

  /** 5) NEW PENALTY CALCULATION PHASE */
  const unpaidSchedules = await prisma.contributionSchedule.findMany({
    where: {
      member_id: { in: memberIds },
      is_paid: false,
    },
    include: {
      contribution: {
        select: {
          contributionType: {
            select: {
              penalty_amount: true,
              name: true,
              mode: true,
            },
          },
        },
      },
    },
  });

  const penaltiesToCreate: Prisma.PenaltyCreateManyInput[] = [];
  const penaltiesToUpdate: Array<{ id: number; newAmount: number }> = [];

  for (const schedule of unpaidSchedules) {
    const penaltyBase = Number(
      schedule.contribution.contributionType.penalty_amount ?? 0
    );
    if (penaltyBase <= 0) continue;

    const scheduleMonthStart = normalizeToMonthStart(schedule.month);
    if (isAfter(currentMonthStart, scheduleMonthStart)) {
      const monthsLate = differenceInMonths(
        currentMonthStart,
        scheduleMonthStart
      );
      const calculatedPenalty = penaltyBase * monthsLate;

      // Check if penalty already exists
      const existingPenalty = await prisma.penalty.findFirst({
        where: {
          member_id: schedule.member_id,
          contribution_id: schedule.contribution_id,
          missed_month: schedule.month,
        },
      });

      if (existingPenalty) {
        if (
          Number(existingPenalty.expected_amount) < calculatedPenalty &&
          !existingPenalty.is_paid
        ) {
          penaltiesToUpdate.push({
            id: existingPenalty.id,
            newAmount: calculatedPenalty,
          });
        }
      } else {
        penaltiesToCreate.push({
          member_id: schedule.member_id,
          contribution_id: schedule.contribution_id,
          contribution_schedule_id: schedule.id,
          expected_amount: calculatedPenalty,
          missed_month: schedule.month,
          penalty_type:
            schedule.contribution.contributionType.name ?? "Unknown",
          reason: `Missed payment for ${schedule.month.toLocaleDateString(
            "en-US",
            {
              year: "numeric",
              month: "short",
            }
          )}`,
        });
      }
    }
  }

  // Apply penalty updates in bulk
  if (penaltiesToUpdate.length > 0) {
    await prisma.$transaction(
      penaltiesToUpdate.map((update) =>
        prisma.penalty.update({
          where: { id: update.id },
          data: { expected_amount: update.newAmount },
        })
      )
    );
  }

  // Create new penalties in bulk
  if (penaltiesToCreate.length > 0) {
    await prisma.penalty.createMany({
      data: penaltiesToCreate,
      skipDuplicates: true,
    });
  }

  /** 6) Handle unallocated amounts (existing logic remains the same) */
  const balancesWithUnallocated = await prisma.balance.findMany({
    where: {
      member_id: { in: memberIds },
      unallocated_amount: { gt: 0 },
    },
  });

  if (balancesWithUnallocated.length > 0) {
    for (const bal of balancesWithUnallocated) {
      await prisma.$transaction(
        async (tx) => {
          const contrib = await tx.contribution.findUnique({
            where: { id: bal.contribution_id }, // Assuming bal.contribution_id is the ID of the Contribution
          });
          const nextId = (await tx.paymentRecord.count()) + 1;
          const formattedId = `PYN-${nextId.toString().padStart(4, "0")}`;
          const paymentRecord = await tx.paymentRecord.create({
            data: {
              custom_id: `${formattedId}`,
              member_id: bal.member_id,
              contribution_Type_id: contrib?.contribution_type_id,
              payment_method: "Excess Balance",
              total_paid_amount: 0,
              excess_balance: bal.unallocated_amount,
            },
          });
          let remainingUnallocated = Number(bal.unallocated_amount ?? 0);
          let totalAllocatedForRecord = 0;

          const pastSchedules = await tx.contributionSchedule.findMany({
            where: {
              member_id: bal.member_id,
              contribution_id: bal.contribution_id,
              is_paid: false,
              month: { lte: startOfMonth(currentMonthStart) }, // ADD THIS LINE
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
                  member_id: bal.member_id,
                  contribution_id: bal.contribution_id,
                  penalty_id: penalty.id,
                  payment_type: "Penalty",
                  payment_month: penalty.missed_month.toISOString(),
                  paid_amount: toPay,
                },
              });

              remainingUnallocated -= toPay;
              totalAllocatedForRecord += toPay;
            }

            if (remainingUnallocated <= 0) continue;

            const paidAlready = Number(schedule.paid_amount);
            const remainingDue = Number(schedule.expected_amount) - paidAlready;
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
                  member_id: bal.member_id,
                  contribution_id: bal.contribution_id,
                  contribution_schedule_id: schedule.id,
                  payment_type: "contribution",
                  payment_month: schedule.month.toISOString(),
                  paid_amount: toApply,
                },
              });

              remainingUnallocated -= toApply;
              totalAllocatedForRecord += toApply;
            }
          }
          const currentSchedule = await tx.contributionSchedule.findFirst({
            where: {
              member_id: bal.member_id,
              contribution_id: bal.contribution_id,
              month: {
                gte: startOfMonth(currentMonthStart),
                lt: startOfMonth(addMonths(currentMonthStart, 1)),
              },
              is_paid: false,
            },
          });

          if (currentSchedule) {
            const paidAlready = Number(currentSchedule.paid_amount);
            const remainingDue =
              Number(currentSchedule.expected_amount) - paidAlready;

            if (remainingDue > 0) {
              const toPay = Math.min(remainingUnallocated, remainingDue);

              await tx.contributionSchedule.update({
                where: { id: currentSchedule.id },
                data: {
                  paid_amount: { increment: toPay },
                  is_paid:
                    paidAlready + toPay >=
                    Number(currentSchedule.expected_amount),
                  paid_at: new Date(),
                },
              });

              await tx.payment.create({
                data: {
                  payment_record_id: paymentRecord.id,
                  member_id: bal.member_id,
                  contribution_id: bal.contribution_id,
                  contribution_schedule_id: currentSchedule.id,
                  payment_type: "contribution",
                  payment_month: currentSchedule.month.toISOString(),
                  paid_amount: toPay,
                },
              });

              remainingUnallocated -= toPay;
              totalAllocatedForRecord += toPay;
            }
          }

          if (totalAllocatedForRecord > 0) {
            await tx.balance.update({
              where: {
                member_id_contribution_id: {
                  member_id: bal.member_id,
                  contribution_id: bal.contribution_id,
                },
              },
              data: {
                unallocated_amount: remainingUnallocated,
                amount: { decrement: totalAllocatedForRecord },
              },
            });
            const updatedBalance = await tx.balance.findUnique({
              where: {
                member_id_contribution_id: {
                  member_id: bal.member_id,
                  contribution_id: bal.contribution_id,
                },
              },
            });

            await tx.paymentRecord.update({
              where: { id: paymentRecord.id },
              data: {
                total_paid_amount: totalAllocatedForRecord,
                remaining_balance: updatedBalance?.amount,
                excess_balance: remainingUnallocated,
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
  }

  /** 7) Member inactivation (existing logic remains the same) */
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
    newSchedulesCount: newSchedules.length,
    newPenaltiesCount: penaltiesToCreate.length,
    updatedPenaltiesCount: penaltiesToUpdate.length,
    currentSimulationDate: currentMonthStart,
  };
}

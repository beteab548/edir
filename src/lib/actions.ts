"use server";

import { Decimal } from "@prisma/client/runtime/library";
import { CombinedSchema, RelativeSchema } from "./formValidationSchemas";
import prisma from "./prisma";
import { applyCatchUpPayment } from "./services/paymentService";
import { ContributionMode, PenaltyType } from "@prisma/client";
import { deleteImageFromImageKit } from "./deleteImageFile";
import { addMonths, startOfMonth } from "date-fns";
type Payment = {
  amount?: number;
  paid_amount?: Number;
  payment_date?: Date;
  contribution_id?: string;
  contribution_type?: string;
  member_id: number;
  payment_method?: string;
  receipt?: string | undefined;
  penalty_type?: string | null;
  penalty_month?: Date | null;
};
type Penalty = {
  amount: number;
  paid_amount?: Number;
  member_id: number;
  penalty_type?: string | null;
  penalty_months?: Date | null;
  reason?: string;
  missed_month?: Date | null;
};

type CurrentState = { success: boolean; error: boolean; message?: string };
export const createMember = async (
  currentState: CurrentState,
  data: CombinedSchema
) => {
  try {
    const result = await prisma.$transaction(
      async (tx) => {
        const createdMember = await tx.member.create({
          data: {
            custom_id: "EDM-000",
            first_name: data.member.first_name,
            second_name: data.member.second_name,
            last_name: data.member.last_name,
            ...(data.member.profession
              ? { profession: data.member.profession }
              : {}),
            ...(data.member.title ? { title: data.member.title } : {}),
            ...(data.member.job_business
              ? { job_business: data.member.job_business }
              : {}),
            ...(data.member.id_number
              ? { id_number: data.member.id_number }
              : {}),
            birth_date: new Date(data.member.birth_date),
            citizen: data.member.citizen,
            ...(data.member.joined_date
              ? { joined_date: new Date(data.member.joined_date) }
              : {}),
            ...(data.member.end_date
              ? { end_date: new Date(data.member.end_date) }
              : {}),
            phone_number: data.member.phone_number,
            phone_number_2: data.member.phone_number_2 ?? "",
            wereda: data.member.wereda,
            kebele: data.member.kebele,
            zone_or_district: data.member.zone_or_district,
            house_number: data.member.house_number,
            member_type: data.member.member_type,
            ...(data.member.document ? { document: data.member.document } : {}),
            ...(data.member.document_file_id
              ? { document_file_id: data.member.document_file_id }
              : {}),
            ...(data.member.bank_name
              ? { bank_name: data.member.bank_name }
              : {}),
            ...(data.member.bank_account_number
              ? { bank_account_number: data.member.bank_account_number }
              : {}),
            ...(data.member.bank_account_name
              ? { bank_account_name: data.member.bank_account_name }
              : {}),
            ...(data.member.email ? { email: data.member.email } : {}),
            ...(data.member.email_2 ? { email_2: data.member.email_2 } : {}),
            ...(data.member.phone_number_2
              ? { phone_number_2: data.member.phone_number_2 }
              : {}),
            ...(data.member.image_url
              ? { image_url: data.member.image_url }
              : {}),
            ...(data.member.image_file_id
              ? { image_file_id: data.member.image_file_id }
              : {}),
            sex: data.member.sex,
            status: data.member.status,
            remark: data.member.remark ?? "",
            relative: {
              create: data.relatives?.map((relative: RelativeSchema) => ({
                first_name: relative.first_name,
                second_name: relative.second_name,
                last_name: relative.last_name,
                relation_type: relative.relation_type,
                status: relative.status,
              })),
            },
          },
        });

        // Update custom_id formatted string
        const formattedId = `EDM-${createdMember.id
          .toString()
          .padStart(4, "0")}`;
        await tx.member.update({
          where: { id: createdMember.id },
          data: { custom_id: formattedId },
        });

        const today = new Date();

        // Fetch all active, for-all contribution types
        const activeContributionTypes = await tx.contributionType.findMany({
          where: {
            is_active: true,
            is_for_all: true,
            OR: [{ end_date: null }, { end_date: { gte: today } }],
          },
          select: {
            id: true,
            name: true,
            amount: true,
            start_date: true,
            end_date: true,
          },
        });

        // Filter contribution types:
        // Exclude "Registration" contribution if member is not "New"
        const filteredContributionTypes = activeContributionTypes.filter(
          (type) => {
            if (
              type.name === "Registration" &&
              createdMember.member_type !== "New"
            ) {
              return false;
            }
            return true;
          }
        );

        // Map filtered contributions
        const contributionsData = filteredContributionTypes.map((type) => ({
          contribution_type_id: type.id,
          member_id: createdMember.id,
          type_name: type.name,
          amount: type.amount,
          start_date: new Date(),
          end_date: type.end_date || new Date(),
        }));

        // If member is "New", add "Registration" contribution only if not already included
        if (createdMember.member_type === "New") {
          const alreadyHasRegistration = contributionsData.some(
            (c) => c.type_name === "Registration"
          );

          if (!alreadyHasRegistration) {
            const registrationType = await tx.contributionType.findFirst({
              where: { name: "Registration", is_active: true },
              select: {
                id: true,
                name: true,
                amount: true,
                start_date: true,
                end_date: true,
              },
            });

            if (registrationType) {
              contributionsData.push({
                contribution_type_id: registrationType.id,
                member_id: createdMember.id,
                type_name: registrationType.name,
                amount: registrationType.amount,
                start_date: new Date(),
                end_date: registrationType.end_date || new Date(),
              });
            }
          }
        }

        if (contributionsData.length > 0) {
          await tx.contribution.createMany({
            data: contributionsData,
          });
        }

        return createdMember;
      },
      { timeout: 20000 }
    );

    return { success: true, error: false, member: result };
  } catch (err) {
    console.error("Create member failed:", err);
    return { success: false, error: true };
  }
};

export const updateMember = async (
  currentState: CurrentState,
  data: CombinedSchema
) => {
  const existingMember = await prisma.member.findUnique({
    where: { id: data.member.id },
    select: { status: true, end_date: true },
  });

  const memberStatusChanged = existingMember?.status !== data.member.status;
  const memberStatusChangedToLeft = data.member.status === "Left";
  const memberStatusChangedToActive = data.member.status === "Active";
  const newDatePassed =
    existingMember?.end_date == null && data.member.end_date;

  if (!data.member?.id) return { success: false, error: true };

  try {
    await prisma.$transaction(
      async (prisma) => {
        // 1. Update the member
        await prisma.member.update({
          where: { id: data.member.id },
          data: {
            first_name: data.member.first_name,
            second_name: data.member.second_name,
            last_name: data.member.last_name,
            ...(data.member.profession && {
              profession: data.member.profession,
            }),
            ...(data.member.title && { title: data.member.title }),
            ...(data.member.job_business && {
              job_business: data.member.job_business,
            }),
            ...(data.member.id_number && { id_number: data.member.id_number }),
            birth_date: new Date(data.member.birth_date),
            citizen: data.member.citizen,
            ...(data.member.joined_date && {
              joined_date: new Date(data.member.joined_date),
            }),
            ...(newDatePassed
              ? { end_date: new Date(data.member.end_date ?? new Date()) }
              : memberStatusChangedToLeft
              ? { end_date: new Date() }
              : memberStatusChangedToActive
              ? { end_date: null }
              : {}),
            ...(data.member.document ? { document: data.member.document } : {}),
            ...(data.member.bank_name
              ? { bank_name: data.member.bank_name }
              : {}),
            ...(data.member.bank_account_number
              ? { bank_account_number: data.member.bank_account_number }
              : {}),
            ...(data.member.bank_account_name
              ? { bank_account_name: data.member.bank_account_name }
              : {}),
            ...(data.member.email ? { email: data.member.email } : {}),
            ...(data.member.email_2 ? { email_2: data.member.email_2 } : {}),
            ...(data.member.phone_number_2
              ? { phone_number_2: data.member.phone_number_2 }
              : {}),
            ...(data.member.image_url
              ? { image_url: data.member.image_url }
              : {}),
            ...(data.member.image_file_id
              ? { image_file_id: data.member.image_file_id }
              : {}),
            phone_number: data.member.phone_number,
            phone_number_2: data.member.phone_number_2 ?? "",
            wereda: data.member.wereda,
            kebele: data.member.kebele,
            zone_or_district: data.member.zone_or_district,
            house_number: data.member.house_number,
            sex: data.member.sex,
            status: data.member.status,
            ...(memberStatusChanged && { status_updated_at: new Date() }),
            remark: data.member.remark ?? "",
            member_type: data.member.member_type,
          },
        });

        // 2. Handle Registration contribution logic based on member_type
        if (data.member.member_type === "New") {
          // Add Registration contribution if not exists
          const registrationContribution = await prisma.contribution.findFirst({
            where: {
              member_id: data.member.id,
              type_name: "Registration",
            },
          });

          if (!registrationContribution) {
            const registrationType = await prisma.contributionType.findFirst({
              where: { name: "Registration", is_active: true },
              select: {
                id: true,
                amount: true,
                start_date: true,
                end_date: true,
              },
            });
            const memberId = Number(data.member.id);
            if (!memberId || typeof memberId !== "number" || isNaN(memberId)) {
              throw new Error("member_id must be a valid number.");
            }
            if (registrationType) {
              await prisma.contribution.create({
                data: {
                  contribution_type_id: registrationType.id,
                  member_id: memberId,
                  type_name: "Registration",
                  amount: registrationType.amount,
                  start_date: registrationType.start_date || new Date(),
                  end_date: registrationType.end_date || new Date(),
                },
              });
            }
          }
        } else {
          // Remove Registration contributions if member_type is NOT "New"
          await prisma.contribution.deleteMany({
            where: {
              member_id: data.member.id,
              type_name: "Registration",
            },
          });
        }

        // 3. Handle other contributions if member_type is "New" and none exist
        if (data.member.member_type === "New") {
          const existingContributions = await prisma.contribution.findFirst({
            where: { member_id: data.member.id },
          });

          if (!existingContributions) {
            const activeContributionTypes =
              await prisma.contributionType.findMany({
                where: {
                  is_active: true,
                  is_for_all: true,
                },
                select: {
                  id: true,
                  name: true,
                  amount: true,
                  start_date: true,
                  end_date: true,
                },
              });

            const memberId = Number(data.member.id);
            if (!memberId || typeof memberId !== "number" || isNaN(memberId)) {
              throw new Error("member_id must be a valid number.");
            }
            const contributionsData = activeContributionTypes.map((type) => ({
              contribution_type_id: type.id,
              member_id: memberId as number,
              type_name: type.name,
              amount: type.amount,
              start_date: type.start_date || new Date(),
              end_date: type.end_date || new Date(),
            }));

            if (contributionsData.length > 0) {
              await prisma.contribution.createMany({ data: contributionsData });
            }
          }
        }

        // 4. Handle relatives update/delete/create as you had before
        const existingRelatives = await prisma.relative.findMany({
          where: { member_id: data.member.id },
        });

        const existingMap = new Map(existingRelatives.map((r) => [r.id, r]));
        const inputRelatives = Array.isArray(data.relatives)
          ? data.relatives
          : [];
        const inputIds = inputRelatives
          .filter((r) => typeof r.id === "number")
          .map((r) => r.id as number);

        await prisma.relative.deleteMany({
          where: {
            member_id: data.member.id,
            id: {
              notIn: inputIds.length > 0 ? inputIds : [0],
            },
          },
        });

        for (const relative of inputRelatives) {
          if (relative.id && existingMap.has(relative.id)) {
            const existing = existingMap.get(relative.id);
            const updateData: any = {
              first_name: relative.first_name,
              second_name: relative.second_name,
              last_name: relative.last_name,
              relation_type: relative.relation_type,
            };

            if (relative.status !== existing?.status) {
              updateData.status = relative.status;
              updateData.status_updated_at = new Date();
            }

            await prisma.relative.update({
              where: { id: relative.id },
              data: updateData,
            });
          } else {
            if (typeof data.member.id === "number") {
              await prisma.relative.create({
                data: {
                  member_id: data.member.id,
                  first_name: relative.first_name,
                  second_name: relative.second_name,
                  last_name: relative.last_name,
                  relation_type: relative.relation_type,
                  status: relative.status,
                  status_updated_at: new Date(),
                },
              });
            } else {
              throw new Error(
                "member_id is undefined when creating a new relative."
              );
            }
          }
        }
      },
      { timeout: 20000 }
    );

    return { success: true, error: false };
  } catch (err) {
    console.error("Update error:", err);
    return { success: false, error: true };
  }
};

export const deleteMember = async (
  currentState: CurrentState,
  data: FormData
) => {
  const id = parseInt(data.get("id") as string);
  try {
    const member = await prisma.member.findUnique({
      where: { id },
      select: {
        document_file_id: true,
        image_file_id: true,
      },
    });
    if (member) {
      if (member.document_file_id) {
        await deleteImageFromImageKit(member.document_file_id);
      }
      if (member.image_file_id) {
        await deleteImageFromImageKit(member.image_file_id);
      }
    }
    await prisma.member.delete({
      where: { id },
    });

    return { success: true, error: false };
  } catch (err) {
    console.error(err);
    return { success: false, error: true };
  }
};

export const updateContribution = async (
  currentState: any,
  data: {
    id: number;
    amount: number;
    type_name: string;
    start_date: Date | null;
    end_date: Date | null;
    is_active: boolean;
    is_for_all: boolean;
    member_ids?: number[];
    mode: "Recurring" | "OneTimeWindow" | "OpenEndedRecurring";
    penalty_amount: number;
    period_months?: number | null;
  }
) => {
  try {
    const currentType = await prisma.contributionType.findUnique({
      where: { id: data.id },
    });

    if (!currentType) throw new Error("Contribution type not found");

    const currentContributions = await prisma.contribution.findMany({
      where: { type_name: currentType.name },
      select: { member_id: true, id: true },
    });

    let startDate: Date | null = null;
    let endDate: Date | null = null;

    if (data.mode === "OneTimeWindow" && data.period_months) {
      startDate = new Date();
      endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + data.period_months);
      endDate.setDate(0);
    } else {
      startDate = data.start_date ? new Date(data.start_date) : null;
      endDate = data.end_date ? new Date(data.end_date) : null;
    }

    const keepOldStartDate =
      startDate && currentType.start_date && startDate < currentType.start_date;

    const effectiveStartDate = keepOldStartDate
      ? currentType.start_date
      : startDate ?? new Date();

    const updatedType = await prisma.contributionType.update({
      where: { id: data.id },
      data: {
        amount: data.amount,
        name: data.type_name,
        start_date: startDate ?? new Date(),
        end_date: endDate,
        is_active: data.is_active,
        is_for_all: data.is_for_all,
        mode: data.mode,
        penalty_amount: data.penalty_amount,
        period_months:
          data.mode === "OneTimeWindow" ? data.period_months : null,
      },
    });

    const transactionOps = [];

    const amountChanged = !currentType.amount.equals(data.amount);
    const typeNameChanged = currentType.name !== data.type_name;
    const startDateChanged =
      currentType.start_date?.toISOString() !== startDate?.toISOString();
    const endDateChanged =
      currentType.end_date?.toISOString() !== endDate?.toISOString();

    if (
      amountChanged ||
      typeNameChanged ||
      startDateChanged ||
      endDateChanged
    ) {
      transactionOps.push(
        prisma.contribution.updateMany({
          where: { type_name: currentType.name },
          data: {
            amount: updatedType.amount,
            type_name: updatedType.name,
            start_date: effectiveStartDate,
            end_date:
              data.mode === "OpenEndedRecurring" ? null : endDate || new Date(),
          },
        })
      );
    }

    if (amountChanged) {
      const firstOfThisMonth = startOfMonth(new Date());

      const contributionsOfType = await prisma.contribution.findMany({
        where: {
          contribution_type_id: updatedType.id,
        },
        select: {
          id: true,
          member_id: true,
        },
      });

      const contributionIds = contributionsOfType.map((c) => c.id);

      if (contributionIds.length > 0) {
        transactionOps.push(
          prisma.contributionSchedule.updateMany({
            where: {
              contribution_id: {
                in: contributionIds,
              },
              is_paid: false,
              month: {
                gte: firstOfThisMonth,
              },
            },
            data: {
              expected_amount: updatedType.amount,
            },
          }),
          prisma.penalty.updateMany({
            where: {
              contribution_id: {
                in: contributionIds,
              },
              is_paid: false,
            },
            data: {
              expected_amount: Number(updatedType.penalty_amount),
            },
          })
        );

        // 🔄 Optimize: Batch find unpaid schedules in parallel
        const schedulePromises = contributionsOfType.map((contribution) =>
          prisma.contributionSchedule.findMany({
            where: {
              contribution_id: contribution.id,
              is_paid: false,
            },
            select: {
              expected_amount: true,
              paid_amount: true,
            },
          })
        );

        const unpaidSchedulesList = await Promise.all(schedulePromises);

        // 🔄 Batch balance updates based on totalRemaining
        contributionsOfType.forEach((contribution, idx) => {
          const unpaidSchedules = unpaidSchedulesList[idx];

          const totalRemaining = unpaidSchedules.reduce((sum, sched) => {
            const paid = sched.paid_amount ?? new Decimal(0);
            return sum.plus(sched.expected_amount.minus(paid));
          }, new Decimal(0));

          transactionOps.push(
            prisma.balance.updateMany({
              where: {
                member_id: contribution.member_id,
                contribution_id: contribution.id,
              },
              data: {
                amount: totalRemaining,
              },
            })
          );
        });
      }
    }

    if (data.is_for_all) {
      let membersToAdd;

      if (updatedType.name === "Registration") {
        membersToAdd = await prisma.member.findMany({
          where: {
            status: "Active",
            member_type: "New",
            id: {
              notIn: currentContributions.map((c) => c.member_id),
            },
          },
          select: { id: true },
        });
      } else {
        membersToAdd = await prisma.member.findMany({
          where: {
            status: "Active",
            id: {
              notIn: currentContributions.map((c) => c.member_id),
            },
          },
          select: { id: true },
        });
      }

      if (membersToAdd.length > 0) {
        transactionOps.push(
          prisma.contribution.createMany({
            data: membersToAdd.map((member) => ({
              contribution_type_id: currentType.id,
              member_id: member.id,
              type_name: updatedType.name,
              amount: updatedType.amount,
              start_date: startDate ?? new Date(),
              end_date: endDate,
            })),
          })
        );
      }
    } else {
      if (!data.member_ids || data.member_ids.length === 0) {
        throw new Error("At least one member must be selected");
      }

      const membersToRemove = currentContributions
        .filter((c) => !data.member_ids!.includes(c.member_id))
        .map((c) => c.member_id);

      if (membersToRemove.length > 0) {
        transactionOps.push(
          prisma.contribution.deleteMany({
            where: {
              type_name: updatedType.name,
              member_id: { in: membersToRemove },
            },
          })
        );
      }

      const existingMemberIds = currentContributions.map((c) => c.member_id);
      const membersToAdd = data.member_ids.filter(
        (id) => !existingMemberIds.includes(id)
      );

      if (membersToAdd.length > 0) {
        let trulyNewMembers = membersToAdd;

        if (updatedType.name === "Registration") {
          const newMembers = await prisma.member.findMany({
            where: {
              id: { in: membersToAdd },
              member_type: "New",
            },
            select: { id: true },
          });
          trulyNewMembers = newMembers.map((m) => m.id);
        }

        if (trulyNewMembers.length > 0) {
          transactionOps.push(
            prisma.contribution.createMany({
              data: trulyNewMembers.map((member_id) => ({
                contribution_type_id: updatedType.id,
                member_id,
                type_name: updatedType.name,
                amount: updatedType.amount,
                start_date: startDate ?? new Date(),
                end_date: endDate,
              })),
            })
          );
        }
      }
    }

    if (transactionOps.length > 0) {
      await prisma.$transaction(transactionOps);
    }

    return { success: true, error: false };
  } catch (err) {
    console.error("Contribution update failed:", err);
    return { success: false, error: true };
  }
};

export const createContributionType = async (data: {
  type_name: string;
  amount: number;
  penalty_amount: number | undefined;
  start_date: Date | undefined;
  end_date: Date | null | undefined;
  period_months: number | undefined;
  is_for_all: boolean;
  member_ids?: number[];
  is_active?: boolean;
  mode: ContributionMode;
}) => {
  try {
    let startDate: Date;
    let endDate: Date | null = null;

    if (data.mode === "OneTimeWindow" && data.period_months !== undefined) {
      startDate = new Date();
      endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + data.period_months);
      endDate.setDate(0);

      if (typeof data.period_months !== "number" || data.period_months <= 0) {
        throw new Error(
          "period months must be a positive number for OneTimeWindow mode."
        );
      }
    } else if (data.mode === "Recurring") {
      if (!data.start_date || !data.end_date) {
        throw new Error("Recurring mode requires start and end dates.");
      }
      if (data.penalty_amount === undefined) {
        throw new Error("Recurring mode requires penalty_amount.");
      }
      startDate = new Date(data.start_date);
      endDate = new Date(data.end_date);
    } else if (data.mode === "OpenEndedRecurring") {
      if (!data.start_date) {
        throw new Error("OpenEndedRecurring mode requires a start date.");
      }
      if (data.penalty_amount === undefined) {
        throw new Error("OpenEndedRecurring mode requires penalty_amount.");
      }
      startDate = new Date(data.start_date);
      endDate = null;
    } else {
      throw new Error("Invalid configuration for contribution period.");
    }

    const result = await prisma.$transaction(
      async (tx) => {
        const contributionType = await tx.contributionType.create({
          data: {
            name: data.type_name,
            amount: data.amount,
            penalty_amount:
              data.mode === "OneTimeWindow" ? null : data.penalty_amount,
            is_active: data.is_active ?? true,
            is_for_all: data.is_for_all,
            start_date: startDate,
            end_date: endDate,
            mode: data.mode,
            period_months:
              data.mode === "OneTimeWindow" ? data.period_months : null,
          },
        });

        let memberIds: number[] = [];

        if (data.is_for_all) {
          const activeMembers = await tx.member.findMany({
            where: { status: "Active" },
            select: { id: true },
          });
          memberIds = activeMembers.map((m) => m.id);
        } else if (data.member_ids?.length) {
          memberIds = data.member_ids;
        }

        if (memberIds.length > 0) {
          let filteredMemberIds = memberIds;

          if (contributionType.name === "Registration") {
            const newMembers = await tx.member.findMany({
              where: {
                id: { in: memberIds },
                member_type: "New",
                status: "Active",
              },
              select: { id: true },
            });
            filteredMemberIds = newMembers.map((m) => m.id);
          }

          if (filteredMemberIds.length > 0) {
            await tx.contribution.createMany({
              data: filteredMemberIds.map((member_id) => ({
                contribution_type_id: contributionType.id,
                member_id,
                type_name: contributionType.name,
                amount: contributionType.amount,
                start_date: contributionType.start_date!,
                end_date: contributionType.end_date,
              })),
            });
          }
        }

        return contributionType;
      },
      { timeout: 20000 }
    );

    return { success: true, error: false, contributionType: result };
  } catch (err) {
    console.error("Create contribution type failed:", err);
    return { success: false, error: true };
  }
};

export const deleteContributionType = async (id: number) => {
  try {
    await prisma.contributionType.delete({ where: { id } });
    return { success: true };
  } catch (err) {
    console.error(err);
    return { success: false };
  }
};

export const paymentActionforAutomatic = async (
  currentState: CurrentState,
  data: Payment
) => {
  try {
    const currentContributionId = Number(data.contribution_id);
    const currentMemberId = Number(data.member_id);
    const paymentAmount = Number(data.paid_amount);
    const paymentReceipt = data.receipt;
    const paymentMethod = data.payment_method || "Cash";

    const contributionExists = await prisma.contributionType.findUnique({
      where: { id: currentContributionId },
    });
    if (!contributionExists) {
      return {
        success: false,
        error: true,
        message: "Contribution Type Doesn't Exist!",
      };
    }

    const memberExists = await prisma.member.findUnique({
      where: { id: currentMemberId },
    });
    if (!memberExists) {
      return { success: false, error: true, message: "Member Doesn't Exist!" };
    }

    const currentMemberContribution = await prisma.contribution.findUnique({
      where: {
        member_id_contribution_type_id: {
          member_id: currentMemberId,
          contribution_type_id: currentContributionId,
        },
      },
    });
    if (!currentMemberContribution) {
      return {
        success: false,
        error: true,
        message: "Member Contribution Doesn't Exist!",
      };
    }
    const payments = await applyCatchUpPayment({
      memberId: currentMemberId,
      contributionId: currentContributionId,
      paidAmount: paymentAmount,
      paymentMethod,
      documentReference: paymentReceipt || "-",
    });
    return { success: true, error: false };
  } catch (error) {
    console.log(error);
    return { success: false, error: true };
  }
};
export async function waivePenalty(penaltyId: number, memberId: number) {
  try {
    const penalty = await prisma.penalty.findUnique({
      where: { id: penaltyId, member_id: memberId },
    });

    if (!penalty) {
      return { success: false, message: "Penalty not found" };
    }

    if (penalty.is_paid) {
      return { success: false, message: "Penalty is already paid" };
    }

    const updatedPenalty = await prisma.penalty.update({
      where: { id: penaltyId },
      data: {
        is_paid: true,
        resolved_at: new Date(),
        paid_amount: penalty.expected_amount,
        waived: true,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error waiving penalty:", error);
    return { success: false, message: "Failed to waive penalty" };
  }
}
export async function getMembersWithPenalties() {
  const members = await prisma.member.findMany({
    where: {
      Penalty: {
        some: {
          generated: "automatically",
        },
      },
    },
    include: {
      Penalty: {
        where: {
          generated: "automatically",
        },
        include: {
          contribution: {
            include: {
              contributionType: {
                select: {
                  mode: true,
                  name: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      first_name: "asc",
    },
  });
  return members;
}

export const createPenalty = async (
  currentState: CurrentState,
  data: Penalty
) => {
  if (!data.member_id || !data.amount) {
    console.error("Invalid data for penalty creation", data);
    return { success: false, error: true };
  }

  try {
    const member = await prisma.member.findUnique({
      where: { id: data.member_id },
    });
    if (!member) {
      return { success: false, error: true, message: "Member not found" };
    }

    const penaltyType = data.penalty_type
      ? await prisma.penaltyTypeModel.findUnique({
          where: { name: data.penalty_type },
        })
      : null;
    if (!penaltyType) {
      return { success: false, error: true, message: "penalty type not found" };
    }
    const penaltyData: any = {
      expected_amount: new Decimal(data.amount),
      member_id: data.member_id,
      missed_month: data.missed_month,
      generated: "manually",
      penalty_type: data.penalty_type,
      reason: data.penalty_type,
    };
    if (penaltyType?.id !== undefined) {
      penaltyData.penaltyTypeId = penaltyType.id;
    }
    const penalty = await prisma.penalty.create({
      data: penaltyData,
    });
    return { success: true, error: false, penalty };
  } catch (error) {
    console.error("Error creating penalty:", error);
  }

  return { success: false, error: true };
};

export const paymentActionforManual = async (
  currentState: CurrentState,
  data: Payment
) => {
  return await prisma
    .$transaction(async (tx) => {
      const penalty = await tx.penalty.findFirst({
        where: {
          member_id: data.member_id,
          is_paid: false,
          ...(data.penalty_month !== null && data.penalty_month !== undefined
            ? { missed_month: data.penalty_month }
            : {}),
        },
      });
      if (!penalty) {
        console.error("No unpaid penalty found for the given member and month");
        throw new Error("No unpaid penalty found");
      }

      if (data.paid_amount === undefined || Number(data.paid_amount) <= 0) {
        throw new Error("Invalid payment amount");
      }

      const updatedPenalty = await tx.penalty.update({
        where: { id: penalty.id },
        data: {
          is_paid: true,
          paid_amount: new Decimal(Number(data.paid_amount)),
          resolved_at: new Date(),
        },
      });

      const paymentRecordCreated = await tx.paymentRecord.create({
        data: {
          member_id: data.member_id,
          total_paid_amount: new Decimal(Number(data.paid_amount)),
          payment_date: new Date(),
          payment_method: data.payment_method || "Cash",
          document_reference: data.receipt || undefined,
          penalty_type_payed_for: "manually",
          custom_id: "",
          Penalty_id: penalty.id,
        },
      });

      const formattedId = `PYN-${paymentRecordCreated.id
        .toString()
        .padStart(4, "0")}`;

      await tx.paymentRecord.update({
        where: { id: paymentRecordCreated.id },
        data: { custom_id: formattedId },
      });

      return { success: true, error: false, penalty: updatedPenalty };
    })
    .catch((error) => {
      console.error("Error processing penalty payment:", error);
      return { success: false, error: true, message: error.message };
    });
};

export async function getPenaltyTypes() {
  return await prisma.penaltyTypeModel.findMany({ orderBy: { name: "asc" } });
}
export async function addPenaltyType(name: string) {
  const trimmedName = name.trim();
  if (!trimmedName) throw new Error("Penalty type cannot be empty");
  const existing = await prisma.penaltyTypeModel.findUnique({
    where: { name: trimmedName },
  });
  if (existing) return existing;
  try {
    return await prisma.penaltyTypeModel.create({
      data: { name: trimmedName },
    });
  } catch (err) {
    console.log(err);
  }
}
export async function addPenaltyTypeModel(name: string) {
  return prisma.penaltyTypeModel.create({ data: { name } });
}

// Get all
export async function getPenaltyTypesModel() {
  return prisma.penaltyTypeModel.findMany({ orderBy: { name: "asc" } });
}

// Update
export async function updatePenaltyType(id: number, name: string) {
  return prisma.penaltyTypeModel.update({ where: { id }, data: { name } });
}

// Delete
export async function deletePenaltyType(id: number) {
  return prisma.penaltyTypeModel.delete({ where: { id } });
}
export async function getMemberBalance(
  memberId: number,
  contribution_id: string
) {
  try {
    const MembersContribution = await prisma.contribution.findFirst({
      where: {
        member_id: memberId,
        contribution_type_id: Number(contribution_id),
      },
    });
    const penaltypaid = await prisma.penalty.findMany({
      where: { member_id: memberId, contribution_id: MembersContribution?.id },
      select: { paid_amount: true },
    });
    const penaltyExpected = await prisma.penalty.findMany({
      where: { member_id: memberId, contribution_id: MembersContribution?.id },
      select: { expected_amount: true },
    });
    const totalExpected = penaltyExpected.reduce(
      (sum, p) => sum + p.expected_amount.toNumber(),
      0
    );
    const totalPaid = penaltypaid.reduce(
      (sum, p) => sum + (p.paid_amount?.toNumber() || 0),
      0
    );

    const remaining = totalExpected - totalPaid;
    const contribution = await prisma.contribution.findUnique({
      where: {
        member_id_contribution_type_id: {
          member_id: memberId,
          contribution_type_id: Number(contribution_id),
        },
      },
    });
    const balance = await prisma.balance.findFirst({
      where: { member_id: memberId, contribution_id: contribution?.id },
      select: { amount: true },
    });
    const totalBalance = (balance ? balance.amount.toNumber() : 0) + remaining;
    return totalBalance;
  } catch (error) {
    console.error("Error fetching balance:", error);
    return 0;
  }
}

export async function deletePayment(
  currentState: CurrentState,
  data: {
    paymentId: number;
    memberName: string;
    amount: Decimal;
    paymentDate: string | Date;
    memberId: number;
    contributionTypeID: number;
  },
  type: PenaltyType
) {
  console.log("data to delete is ", data);
  return await prisma.$transaction(
    async (tx) => {
      if (type === "manually") {
        const penaltyPayments = await tx.paymentRecord.findUnique({
          where: {
            id: data.paymentId,
          },
          select: {
            Penalty_id: true,
          },
        });

        if (penaltyPayments?.Penalty_id) {
          await tx.penalty.update({
            where: {
              id: penaltyPayments.Penalty_id,
            },
            data: {
              is_paid: false,
              resolved_at: null,
              paid_amount: 0,
            },
          });
        }

        await tx.paymentRecord.delete({ where: { id: data.paymentId } });
        return { success: true, error: false };
      }

      const contribution = await tx.contribution.findUnique({
        where: {
          member_id_contribution_type_id: {
            member_id: data.memberId,
            contribution_type_id: data.contributionTypeID,
          },
        },
      });

      const contributionPayments = await tx.payment.findMany({
        where: {
          payment_record_id: data.paymentId,
          payment_type: { not: "penalty" },
        },
        select: {
          paid_amount: true,
          contribution_schedule_id: true,
          contribution_id: true,
          member_id: true,
        },
      });

      const penaltyPayments = await tx.payment.findMany({
        where: {
          payment_record_id: data.paymentId,
          payment_type: "penalty",
        },
        select: {
          contribution_id: true,
          contribution_schedule_id: true,
          member_id: true,
        },
      });

      for (const payment of penaltyPayments) {
        await tx.penalty.updateMany({
          where: {
            member_id: payment.member_id,
            contribution_id: payment.contribution_id,
            contribution_schedule_id: payment.contribution_schedule_id,
          },
          data: {
            is_paid: false,
            resolved_at: null,
            paid_amount: 0,
          },
        });
      }

      for (const p of contributionPayments) {
        const schedule = await tx.contributionSchedule.findUnique({
          where: { id: p.contribution_schedule_id ?? 1 },
          select: { paid_amount: true },
        });

        if (!schedule) continue;

        const newPaidAmount =
          schedule.paid_amount.toNumber() - Number(p.paid_amount);

        await tx.contributionSchedule.update({
          where: { id: p.contribution_schedule_id ?? 1 },
          data: {
            paid_amount: newPaidAmount,
            is_paid: newPaidAmount > 0 ? false : false,
            paid_at: newPaidAmount > 0 ? null : null,
          },
        });
      }

      const totalContributionPaidAmount = contributionPayments.reduce(
        (sum, payment) => sum + Number(payment.paid_amount),
        0
      );

      const memberBalance = await tx.balance.findUnique({
        where: {
          member_id_contribution_id: {
            member_id: data.memberId,
            contribution_id: contribution?.id ?? 0,
          },
        },
        select: { amount: true },
      });

      const updatedBalance =
        (memberBalance?.amount?.toNumber() ?? 0) + totalContributionPaidAmount;

      await tx.balance.update({
        where: {
          member_id_contribution_id: {
            member_id: data.memberId,
            contribution_id: contribution?.id ?? 0,
          },
        },
        data: { amount: updatedBalance },
      });

      await tx.paymentRecord.delete({
        where: { id: data.paymentId },
      });

      return { success: true, error: false };
    },
    { timeout: 20000 }
  );
}

export async function createAnnouncement(data: {
  title: string;
  Description: string;
  calendar: Date;
  created_at: Date;
}) {
  await prisma.announcements.create({
    data,
  });
}

export async function updateAnnouncement(
  id: number,
  data: {
    title: string;
    Description: string;
    calendar: Date;
  }
) {
  await prisma.announcements.update({
    where: { id },
    data,
  });
}

export async function deleteAnnouncement(id: number) {
  await prisma.announcements.delete({
    where: { id },
  });
}

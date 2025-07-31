"use server";
import { Decimal } from "@prisma/client/runtime/library";
import { CombinedSchema, RelativeSchema } from "./formValidationSchemas";
import { applyCatchUpPayment } from "./services/paymentService";
import { ContributionMode } from "@prisma/client";
import { deleteImageFromImageKit } from "./deleteImageFile";
import {
  ContributionSchedule,
  Prisma,
  PrismaClient,
  Member,
  Contribution,
  PenaltyType,
} from "@prisma/client";
import { addMonths, isAfter, startOfMonth } from "date-fns";

const prisma = new PrismaClient();

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
            ...(data.member.identification_number
              ? { identification_number: data.member.identification_number }
              : {}),
            ...(data.member.identification_type
              ? { identification_type: data.member.identification_type }
              : {}),
            ...(data.member.identification_image
              ? { identification_image: data.member.identification_image }
              : {}),
            ...(data.member.identification_file_id
              ? { identification_file_id: data.member.identification_file_id }
              : {}),
            birth_date: new Date(data.member.birth_date),
            citizen: data.member.citizen,
            ...(data.member.registered_date
              ? { registered_date: new Date(data.member.registered_date) }
              : {}),
            ...(data.member.end_date
              ? { end_date: new Date(data.member.end_date) }
              : {}),
            phone_number: data.member.phone_number,
            phone_number_2: data.member.phone_number_2 ?? "",
            wereda: data.member.wereda,
            kebele: data.member.kebele,
            zone_or_district: data.member.zone_or_district,
            green_area: data.member.green_area,
            block: data.member.block,
            marital_status: data.member.marital_status,
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
            founding_member: data.member.founding_member,
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
            ...(data.member.identification_number
              ? { identification_number: data.member.identification_number }
              : {}),
            ...(data.member.identification_type
              ? { identification_type: data.member.identification_type }
              : {}),
            ...(data.member.identification_image
              ? { identification_image: data.member.identification_image }
              : {}),
            ...(data.member.identification_file_id
              ? { identification_file_id: data.member.identification_file_id }
              : {}),
            birth_date: new Date(data.member.birth_date),
            citizen: data.member.citizen,
            ...(data.member.registered_date && {
              registered_date: new Date(data.member.registered_date),
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
            green_area: data.member.green_area,
            block: data.member.block,
            marital_status: data.member.marital_status,
            founding_member: data.member.founding_member,
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
    // 1. Get current contribution type and existing contributions
    const currentType = await prisma.contributionType.findUnique({
      where: { id: data.id },
    });

    if (!currentType) throw new Error("Contribution type not found");

    const currentContributions = await prisma.contribution.findMany({
      where: { type_name: currentType.name },
      select: { member_id: true, id: true },
    });

    // 2. Calculate effective dates based on mode
    const startDate =
      data.mode === "OneTimeWindow" && data.period_months
        ? new Date()
        : data.start_date
        ? new Date(data.start_date)
        : null;

    const endDate =
      data.mode === "OneTimeWindow" && data.period_months
        ? (() => {
            const d = new Date();
            d.setMonth(d.getMonth() + data.period_months);
            d.setDate(0);
            return d;
          })()
        : data.end_date
        ? new Date(data.end_date)
        : null;

    const effectiveStartDate =
      startDate && currentType.start_date && startDate < currentType.start_date
        ? currentType.start_date
        : startDate ?? new Date();

    // 3. Update the contribution type
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

    const transactionOps: any[] = [];

    // 4. Determine what changed
    const amountChanged = !currentType.amount.equals(data.amount);
    const typeNameChanged = currentType.name !== data.type_name;
    const startDateChanged =
      currentType.start_date?.toISOString() !== startDate?.toISOString();
    const endDateChanged =
      currentType.end_date?.toISOString() !== endDate?.toISOString();

    // 5. Get contributions to update based on is_for_all flag
    const contributionsToUpdate = data.is_for_all
      ? currentContributions
      : currentContributions.filter((c) =>
          data.member_ids?.includes(c.member_id)
        );

    // 6. Update contributions if needed
    if (
      (amountChanged ||
        typeNameChanged ||
        startDateChanged ||
        endDateChanged) &&
      currentType.name !== "Registration"
    ) {
      transactionOps.push(
        prisma.contribution.updateMany({
          where: {
            type_name: currentType.name,
            ...(!data.is_for_all && { member_id: { in: data.member_ids } }),
          },
          data: {
            amount: updatedType.amount,
            type_name: updatedType.name,
            start_date: effectiveStartDate,
            end_date:
              data.mode === "OpenEndedRecurring" ? null : endDate || new Date(),
          },
        })
      );
        if (typeNameChanged) {
      transactionOps.push(
        prisma.penalty.updateMany({
          where: {
            // Find all penalties that still have the OLD name
            penalty_type: currentType.name,
          },
          data: {
            // Update them to the NEW name
            penalty_type: updatedType.name,
          },
        })
      );
    }
    }

    // 7. Handle schedule updates if amount changed (same logic for both is_for_all true and false)
    if (amountChanged && updatedType.name !== "Registration") {
      const today = startOfMonth(addMonths(new Date(), 2)); // Using your adjusted date
      const contributionIds = contributionsToUpdate.map((c) => c.id);

      if (contributionIds.length > 0) {
        // Get all schedules for these contributions
        const allSchedules = await prisma.contributionSchedule.findMany({
          where: {
            contribution_id: { in: contributionIds },
          },
        });

        // Process each schedule
        for (const schedule of allSchedules) {
          const scheduleDate = startOfMonth(schedule.month);
          const isPastSchedule = scheduleDate < today;

          if (isPastSchedule) {
            continue; // Don't modify past schedules
          }

          const currentPaid = new Decimal(schedule.paid_amount ?? 0);
          const newExpected = new Decimal(updatedType.amount);

          if (currentPaid.gt(newExpected)) {
            // Case 1: Overpaid schedule
            const excessAmount = currentPaid.minus(newExpected);

            transactionOps.push(
              prisma.contributionSchedule.update({
                where: { id: schedule.id },
                data: {
                  paid_amount: newExpected,
                  expected_amount: newExpected,
                  is_paid: true,
                  paid_at: new Date(),
                },
              })
            );

            transactionOps.push(
              prisma.balance.updateMany({
                where: {
                  member_id: schedule.member_id,
                  contribution_id: schedule.contribution_id,
                },
                data: {
                  unallocated_amount: {
                    increment: excessAmount,
                  },
                },
              })
            );
          } else if (currentPaid.equals(newExpected)) {
            // Case 2: Perfectly paid schedule
            transactionOps.push(
              prisma.contributionSchedule.update({
                where: { id: schedule.id },
                data: {
                  expected_amount: newExpected,
                  is_paid: true,
                  paid_at: schedule.paid_at ?? new Date(),
                },
              })
            );
          } else {
            // Case 3: Underpaid schedule
            transactionOps.push(
              prisma.contributionSchedule.update({
                where: { id: schedule.id },
                data: {
                  expected_amount: newExpected,
                  is_paid: false,
                  paid_at: null,
                },
              })
            );
          }
        }

        // Update penalties for current and future schedules
        transactionOps.push(
          prisma.penalty.updateMany({
            where: {
              contribution_id: { in: contributionIds },
              is_paid: false,
              contributionSchedule: {
                month: { gte: today },
              },
            },
            data: {
              expected_amount: new Decimal(updatedType.penalty_amount ?? 0),
            },
          })
        );
      }
    }

    // 8. Handle member list updates
    if (data.is_for_all) {
      // Add to all active members (and new members for Registration)
      const membersToAdd = await prisma.member.findMany({
        where: {
          status: "Active",
          ...(updatedType.name === "Registration" && { member_type: "New" }),
          id: {
            notIn: currentContributions.map((c) => c.member_id),
          },
        },
        select: { id: true },
      });

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
      // Handle specific member selection
      if (!data.member_ids || data.member_ids.length === 0) {
        throw new Error("At least one member must be selected");
      }

      // Remove contributions for members not in the new list
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

      // Add contributions for new members in the list
      const existingMemberIds = currentContributions.map((c) => c.member_id);
      const membersToAdd = data.member_ids.filter(
        (id) => !existingMemberIds.includes(id)
      );

      if (membersToAdd.length > 0) {
        let trulyNewMembers = membersToAdd;

        // For Registration, only add to truly new members
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

    // 9. Execute all operations in a transaction
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
    await applyCatchUpPayment({
      memberId: currentMemberId,
      contributionId: currentContributionId,
      paidAmount: paymentAmount,
      paymentMethod,
      documentReference: paymentReceipt || "-",
      simulate: true,
      simulationMonths: 2,
    });
    return { success: true, error: false };
  } catch (error) {
    console.log(error);
    return { success: false, error: true };
  }
};
export async function waivePenalty(
  penaltyId: number,
  memberId: number,
  reason: string,
  waiverEvidence?: string,
  waiverEvidenceFileId?: string
) {
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
        resolved_at: new Date(),
        waived: true,
        waived_reason: reason,
        waived_reason_document: waiverEvidence,
        waived_reason_document_file_id: waiverEvidenceFileId,
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

// --- Main Job: Schedule Generation & Auto-Payment (FIXED) ---

export async function generateContributionSchedulesForAllActiveMembers(
  options: GenerateSchedulesOptions = {}
) {
  const { simulate = false, simulationMonths = 0 } = options;
  const now = simulate
    ? normalizeToMonthStart(addMonths(new Date(), simulationMonths))
    : normalizeToMonthStart(new Date());
  const currentMonthStart = addMonths(now, 0);

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

  const allNewSchedules = [];
  const balanceUpdatesMap = new Map<
    string,
    { member_id: number; contribution_id: number; amount: number }
  >();

  for (const member of activeMembers) {
    for (const contribution of member.Contribution) {
      // ... (Initial schedule generation logic is unchanged)
      const { contributionType } = contribution;
      if (!contributionType?.is_active) continue;
      let startDate = contributionType.start_date ?? contribution.start_date;
      if (!startDate) continue;
      const contributionAmount = Number(contributionType.amount);
      if (contributionAmount <= 0) continue;

      // Handle unallocated amount
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

            const paymentRecord = await tx.paymentRecord.create({
              data: {
                custom_id: `AUTO-ALLOC-${member.id}-${Date.now()}`,
                member_id: member.id,
                contribution_Type_id: contribution.contribution_type_id,
                payment_method: "Unallocated Balance",
                document_reference: "Automated System Allocation",
                total_paid_amount: 0,
              },
            });

            let totalAllocatedForRecord = 0;
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
                    payment_type: "Penalty", // This value is consistent
                    payment_month: penalty.missed_month.toISOString(),
                    paid_amount: toPay,
                  },
                });

                remainingUnallocated -= toPay;
                totalAllocatedForRecord += toPay;
              }

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
                    // *** FIX: Use a consistent, lowercase string that matches deletion logic ***
                    payment_type: "contribution",
                    payment_month: schedule.month.toISOString(),
                    paid_amount: toApply,
                  },
                });

                remainingUnallocated -= toApply;
                totalAllocatedForRecord += toApply;
              }
            }

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
              await tx.paymentRecord.update({
                where: { id: paymentRecord.id },
                data: { total_paid_amount: totalAllocatedForRecord },
              });
            } else {
              await tx.paymentRecord.delete({
                where: { id: paymentRecord.id },
              });
            }
          },
          { isolationLevel: "Serializable", timeout: 20000 }
        );
      }
    }
  }

  return { success: true };
}


export async function deletePayment(
  data: {
    paymentId: number;
    memberId: number;
    contributionTypeID: number;
  }
) {
  console.log("payment id",data.paymentId);
  return await prisma.$transaction(
    async (tx) => {
      const paymentRecord = await tx.paymentRecord.findUnique({
        where: { id: data.paymentId },
        select: {
          document_reference: true,
          total_paid_amount: true,
          member_id: true,
        },
      });

      if (!paymentRecord || paymentRecord.member_id !== data.memberId) {
        throw new Error("Payment record not found or does not belong to this member.");
      }

      const isAutoAllocation = paymentRecord.document_reference === "Automated System Allocation";

      const contribution = await tx.contribution.findUnique({
        where: {
          member_id_contribution_type_id: {
            member_id: data.memberId,
            contribution_type_id: data.contributionTypeID,
          },
        },
      });

      if (!contribution) {
        throw new Error("Contribution record not found for this member and contribution type.");
      }

      // 2. Reverse all allocations as before
      const allAllocations = await tx.payment.findMany({
        where: { payment_record_id: data.paymentId },
      });

      let scheduleAllocatedTotal = new Decimal(0);
      let penaltyAllocatedTotal = new Decimal(0);

      for (const allocation of allAllocations) {
        // Using .toLowerCase() to be safe against "Penalty" vs "penalty"
        if (allocation.payment_type.toLowerCase() === "penalty" && allocation.penalty_id) {
          await tx.penalty.update({
            where: { id: allocation.penalty_id },
            data: {
              paid_amount: { decrement: allocation.paid_amount },
              is_paid: false,
              resolved_at: null,
            },
          });
          penaltyAllocatedTotal = penaltyAllocatedTotal.plus(allocation.paid_amount);
        } else if (allocation.contribution_schedule_id) {
          await tx.contributionSchedule.update({
            where: { id: allocation.contribution_schedule_id },
            data: {
              paid_amount: { decrement: allocation.paid_amount },
              is_paid: false,
              paid_at: null,
            },
          });
          scheduleAllocatedTotal = scheduleAllocatedTotal.plus(allocation.paid_amount);
        }
      }

      // 3. Determine how to handle the unallocated amount based on payment type
      let amountToRestoreToUnallocated = new Decimal(0);
      let amountToWithdrawFromUnallocated = new Decimal(0);

      if (isAutoAllocation) {
        amountToRestoreToUnallocated = paymentRecord.total_paid_amount;
      } else {
        const totalPaidFromRecord = new Decimal(paymentRecord.total_paid_amount);
        const originallyUnallocated = totalPaidFromRecord.minus(scheduleAllocatedTotal).minus(penaltyAllocatedTotal);
        if (originallyUnallocated.isNegative()) {
          throw new Error("Data integrity issue: Reversal calculation resulted in a negative value.");
        }
        amountToWithdrawFromUnallocated = originallyUnallocated;
      }

      // 4. Update the balance with the corrected logic
      const currentBalance = await tx.balance.findUnique({
        where: {
          member_id_contribution_id: { member_id: data.memberId, contribution_id: contribution.id },
        },
      });

      if (!currentBalance) {
        throw new Error("Balance record not found for this member's contribution.");
      }

      if (currentBalance.unallocated_amount.lessThan(amountToWithdrawFromUnallocated)) {
        throw new Error(`Cannot revert payment. Reversal requires withdrawing ${amountToWithdrawFromUnallocated} from unallocated credit, but the member only has ${currentBalance.unallocated_amount}. This credit may have already been used.`);
      }

      const allSchedulesForContribution = await tx.contributionSchedule.findMany({
        where: { contribution_id: contribution.id },
        select: { expected_amount: true, paid_amount: true },
      });

      const totalExpected = allSchedulesForContribution.reduce((sum, s) => sum.plus(s.expected_amount), new Decimal(0));
      const totalPaid = allSchedulesForContribution.reduce((sum, s) => sum.plus(s.paid_amount), new Decimal(0));
      const newBalanceAmount = totalExpected.minus(totalPaid);

      // FIX: Dynamically build the update payload
      const updateData: any = {
        amount: newBalanceAmount.isNegative() ? 0 : newBalanceAmount,
      };

      if (amountToRestoreToUnallocated.greaterThan(0)) {
        updateData.unallocated_amount = {
          increment: amountToRestoreToUnallocated,
        };
      } else if (amountToWithdrawFromUnallocated.greaterThan(0)) {
        updateData.unallocated_amount = {
          decrement: amountToWithdrawFromUnallocated,
        };
      }
      // If both are zero, we don't add the 'unallocated_amount' key at all.
      
      await tx.balance.update({
        where: {
          member_id_contribution_id: { member_id: data.memberId, contribution_id: contribution.id },
        },
        data: updateData,
      });

      // 5. Clean up payment records
      await tx.payment.deleteMany({
        where: { payment_record_id: data.paymentId },
      });
      await tx.paymentRecord.delete({
        where: { id: data.paymentId },
      });

      return { success: true, error: false };
    },
    { isolationLevel: "Serializable", timeout: 20000 }
  );
}

// --- Balance Recalculation Helper (Unchanged) ---

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
      // if (!contribution.contributionType?.is_active) continue;

      const totalExpected = contribution.ContributionSchedule.reduce(
        (sum, schedule) => sum + Number(schedule.expected_amount),
        0
      );
      const totalPaid = contribution.ContributionSchedule.reduce(
        (sum, schedule) => sum + Number(schedule.paid_amount ?? 0),
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
export async function deletePenalty(penaltyId: number) {
  try {
    return await prisma.$transaction(async (prisma) => {
      // 1. First find the penalty and its associated payment record
      const penalty = await prisma.penalty.findUnique({
        where: { id: penaltyId },
        include: {
          contribution: {
            select: {
              member_id: true,
              contribution_type_id: true,
            },
          },
        },
      });

      if (!penalty) {
        throw new Error("Penalty not found");
      }

      // 2. Find and delete the associated payment record (if exists)
      let deletedPaymentRecord = null;
      const paymentRecord = await prisma.paymentRecord.findFirst({
        where: {
          Penalty_id: penaltyId,
          member_id: penalty.member_id,
        },
      });

      if (paymentRecord) {
        // First delete all payments associated with this payment record
        await prisma.payment.deleteMany({
          where: {
            payment_record_id: paymentRecord.id,
          },
        });

        // Then delete the payment record itself
        deletedPaymentRecord = await prisma.paymentRecord.delete({
          where: { id: paymentRecord.id },
        });
      }

      // 3. Delete the penalty
      const deletedPenalty = await prisma.penalty.delete({
        where: { id: penaltyId },
      });

      return {
        success: true,
        data: {
          penalty: deletedPenalty,
          paymentRecord: deletedPaymentRecord,
        },
        message: paymentRecord
          ? "Penalty and associated payment record deleted successfully"
          : "Penalty deleted successfully",
      };
    });
  } catch (error) {
    console.error("Error deleting penalty:", error);
    return {
      success: false,
      error: "Failed to delete penalty",
      details: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

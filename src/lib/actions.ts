"use server";
import { currentUser } from "@clerk/nextjs/server";
import { logAction } from "./audit";
import { Decimal } from "@prisma/client/runtime/library";
import { FamilyMemberSchema, RelativeSchema } from "./formValidationSchemas";
import { applyCatchUpPayment } from "./services/paymentService";
import { ContributionMode, ContributionType } from "@prisma/client";
import { deleteImageFromImageKit } from "./deleteImageFile";
import {
  ContributionSchedule,
  Prisma,
  Member,
  Contribution,
  ActionStatus,
  ActionType,
} from "@prisma/client";
import { addMonths, isAfter, startOfMonth } from "date-fns";
import prisma from "./prisma";
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

const prepareMemberData = (memberInput: any) => {
  const data: any = { ...memberInput };
  // Remove fields that will be set manually or are relations
  delete data.id;
  delete data.spouse;
  delete data.relatives;
  delete data.familyId;

  // Format dates
  data.birth_date = new Date(memberInput.birth_date);
  data.registered_date = memberInput.registered_date
    ? new Date(memberInput.registered_date)
    : new Date();
  data.end_date = memberInput.end_date ? new Date(memberInput.end_date) : null;

  return data;
};

export const createFamily = async (
  currentState: CurrentState,
  data: FamilyMemberSchema
) => {
  const user = await currentUser();

  if (!user) {
    // You should also handle this case, maybe log it as a system action
    throw new Error("User not authenticated");
  }
  try {
    const { principal, spouse, relatives } = data;

    // --- STEP 1: DEFINE THE SIMULATION'S EFFECTIVE DATE ---
    const effectiveDate = addMonths(new Date(), 0);

    const result = await prisma.$transaction(
      async (tx) => {
        // --- STEPS 2-5 are correct and unchanged ---
        const newFamily = await tx.family.create({
          data: { familyId: "FAM-TEMP" },
        });
        const humanReadableFamilyId = `FAM-${newFamily.id
          .toString()
          .padStart(4, "0")}`;
        await tx.family.update({
          where: { id: newFamily.id },
          data: { familyId: humanReadableFamilyId },
        });

        const principalData = prepareMemberData(principal);
        principalData.registered_date = effectiveDate;
        const principalMember = await tx.member.create({
          data: {
            ...principalData,
            isPrincipal: true,
            familyId: newFamily.id,
            custom_id: `EDM-TEMP`,
          },
        });
        await tx.member.update({
          where: { id: principalMember.id },
          data: {
            custom_id: `EDM-${principalMember.id.toString().padStart(4, "0")}`,
          },
        });
        if (!spouse) {
          await logAction({
            userId: user.id,
            userFullName: `${user.firstName} ${user.lastName}`,
            actionType: ActionType.MEMBER_CREATE,
            status: ActionStatus.SUCCESS,
            details: `Successfully created Member: ${principal.first_name} ${principal.last_name}`,
            targetId: `${principalMember.custom_id}`,
          });
        }
        if (spouse) {
          const spouseData = prepareMemberData(spouse);
          spouseData.registered_date = effectiveDate;
          const spouseMember = await tx.member.create({
            data: {
              ...spouseData,
              isPrincipal: false,
              familyId: newFamily.id,
              spouseId: principalMember.id,
              custom_id: "EDM-TEMP",
            },
          });
          await tx.member.update({
            where: { id: spouseMember.id },
            data: {
              custom_id: `EDM-${spouseMember.id.toString().padStart(4, "0")}`,
            },
          });
          await tx.member.update({
            where: { id: principalMember.id },
            data: { spouseId: spouseMember.id },
          });
          await logAction({
            userId: user.id,
            userFullName: `${user.firstName} ${user.lastName}`,
            actionType: ActionType.FAMILY_CREATE,
            status: ActionStatus.SUCCESS,
            details: `Successfully created family for principal member: ${principal.first_name} ${principal.last_name}`,
            targetId: `${principalMember.custom_id}`,
          });
        }

        if (relatives && relatives.length > 0) {
          await tx.relative.createMany({
            data: relatives.map((relative: RelativeSchema) => ({
              ...relative,
              id: undefined,
              familyId: newFamily.id,
            })),
          });
        }

        // --- STEP 6: Apply Financial Logic with Dynamic End Dates (CORRECTED) ---
        const contributionsToCreate = [];

        const forAllTypes = await tx.contributionType.findMany({
          where: {
            is_active: true,
            is_for_all: true,
            OR: [{ end_date: null }, { end_date: { gte: effectiveDate } }],
          },
        });

        for (const type of forAllTypes) {
          if (type.name === "Registration" && principal.member_type !== "New") {
            continue;
          }

          // Determine the actual start date for THIS member's obligation
          const memberObligationStartDate = new Date(
            Math.max(
              (type.start_date || effectiveDate).getTime(),
              effectiveDate.getTime()
            )
          );

          // --- DYNAMIC END DATE CALCULATION (THE FIX) ---
          let calculatedEndDate = type.end_date; // Default to the type's end date

          // If it's a windowed contribution with a set period, calculate the end date.
          if (
            type.mode === "OneTimeWindow" &&
            type.period_months &&
            type.period_months > 0
          ) {
            calculatedEndDate = addMonths(
              memberObligationStartDate,
              type.period_months
            );
          }
          // ------------------------------------------------

          contributionsToCreate.push({
            contribution_type_id: type.id,
            member_id: principalMember.id,
            type_name: type.name,
            amount: type.amount,
            start_date: memberObligationStartDate,
            end_date: calculatedEndDate, // <-- Use the correctly calculated end date
          });
        }

        // Handle Registration separately to ensure its logic is clear
        if (principal.member_type === "New") {
          const hasRegistration = contributionsToCreate.some(
            (c) => c.type_name === "Registration"
          );
          if (!hasRegistration) {
            const registrationType = await tx.contributionType.findFirst({
              where: { name: "Registration", is_active: true },
            });

            if (registrationType) {
              let registrationEndDate = registrationType.end_date;
              // Also apply window logic to Registration if applicable
              if (
                registrationType.mode === "OneTimeWindow" &&
                registrationType.period_months &&
                registrationType.period_months > 0
              ) {
                registrationEndDate = addMonths(
                  effectiveDate,
                  registrationType.period_months
                );
              }

              contributionsToCreate.push({
                contribution_type_id: registrationType.id,
                member_id: principalMember.id,
                type_name: registrationType.name,
                amount: registrationType.amount,
                start_date: effectiveDate, // Registration always starts on join date
                end_date: registrationEndDate,
              });
            }
          }
        }

        if (contributionsToCreate.length > 0) {
          await tx.contribution.createMany({ data: contributionsToCreate });
        }

        // --- STEP 7: Generate Initial Payment Schedules (No changes needed here) ---
        await generateInitialSchedulesForMember(
          principalMember.id,
          tx,
          effectiveDate
        );

        return principalMember;
      },
      { timeout: 20000 }
    );

    return { success: true, error: false };
  } catch (err) {
    const error =
      err instanceof Error ? err : new Error("An unknown error occurred");
    console.error("Failed to create family:", err);
    await logAction({
      userId: user.id,
      userFullName: `${user.firstName} ${user.lastName}`,
      actionType: ActionType.FAMILY_CREATE,
      status: ActionStatus.FAILURE,
      details: `Failed to create family for principal: ${data.principal.first_name} ${data.principal.last_name}`,
      error: error.message,
    });
    return {
      success: false,
      error: true,
      message: "A database error occurred during family creation.",
    };
  }
};

const prepareMemberUpdateData = (memberInput: any) => {
  // We don't include fields that should not be changed directly, like id or familyId.
  const data: any = {
    ...memberInput,
    birth_date: new Date(memberInput.birth_date),
    registered_date: memberInput.registered_date
      ? new Date(memberInput.registered_date)
      : new Date(),
    end_date: memberInput.end_date ? new Date(memberInput.end_date) : null,
  };
  // Remove fields that we don't want to update directly or that are relations
  delete data.id;
  delete data.spouse;
  delete data.relative;
  delete data.familyId; // Family ID should never change during an update

  return data;
};

/**
 * Server action to update a family unit. It handles updates to the principal,
 * creation/update/unlinking of a spouse, and full CRUD for relatives.
 */
export const updateFamily = async (
  currentState: CurrentState,
  data: FamilyMemberSchema
) => {
  const user = await currentUser();
  if (!user) {
    // This case should be handled by your auth middleware, but it's a good safeguard.
    console.error(
      "CRITICAL: updateFamily action called without authenticated user."
    );
    return { success: false, error: true, message: "User not authenticated." };
  }
  const userFullName = `${user.firstName} ${user.lastName}`;
  const { principal, spouse, relatives } = data;

  if (!principal.id) {
    return {
      success: false,
      error: true,
      message: "Principal member ID is missing. Cannot perform update.",
    };
  }

  try {
    await prisma.$transaction(
      async (tx) => {
        // --- STEP 1: Fetch the Current State of the Principal and their Family ID ---
        const existingPrincipal = await tx.member.findUnique({
          where: { id: principal.id },
          select: {
            status: true,
            spouseId: true,
            familyId: true,
            first_name: true,
            second_name: true,
            last_name: true,
            custom_id: true,
          },
        });

        if (!existingPrincipal || !existingPrincipal.familyId) {
          throw new Error(
            `Principal member with ID ${principal.id} or their family link not found.`
          );
        }

        const familyId = existingPrincipal.familyId;

        // --- STEP 2: Update the Principal Member (WITH THE CRITICAL FIX) ---
        const principalUpdatePayload = prepareMemberUpdateData(principal);

        // --- THIS IS THE FIX ---
        // Create a new object for the update that explicitly excludes `spouseId`.
        // This prevents the foreign key error by deferring the link until after the spouse is created.
        const { spouseId, ...principalDataForFirstUpdate } =
          principalUpdatePayload;
        // --------------------

        // Your existing logic for status updates is preserved
        if (existingPrincipal.status !== principal.status) {
          principalDataForFirstUpdate.status_updated_at = new Date();
        }

        // Perform the first, safe update on the principal's own data
        const updatedPrinipal = await tx.member.update({
          where: { id: principal.id },
          data: principalDataForFirstUpdate, // Use the cleaned data WITHOUT spouseId
        });

        if (existingPrincipal.status !== updatedPrinipal.status) {
          await logAction({
            userId: user.id,
            userFullName,
            actionType: ActionType.MEMBER_UPDATE,
            status: ActionStatus.SUCCESS,
            details: `Changed status of member ${principal.first_name} ${principal.last_name} from '${existingPrincipal.status}' to '${principal.status}'.`,
            targetId: `${existingPrincipal.custom_id}`,
          });
        }
        // --- STEP 3: Handle the Spouse (Update, Create, or Unlink) ---
        // This block now runs without error because the principal update was successful.
        const oldSpouseId = existingPrincipal.spouseId;

        if (principal.marital_status === "married" && spouse) {
          // SCENARIO A: The principal is now married.
          const spouseUpdateData = prepareMemberUpdateData(spouse);

          if (spouse.id) {
            // Case 1: Update an existing spouse that was already linked.
            await tx.member.update({
              where: { id: spouse.id },
              data: spouseUpdateData,
            });
          } else {
            // Case 2: Create a brand new spouse (the scenario that was failing).
            const newSpouse = await tx.member.create({
              data: {
                ...spouseUpdateData,
                isPrincipal: false,
                familyId: familyId,
              },
            });

            // Now that BOTH records exist in the DB, establish the two-way link.
            await tx.member.update({
              where: { id: principal.id },
              data: { spouseId: newSpouse.id }, // Link principal to new spouse
            });
            await tx.member.update({
              where: { id: newSpouse.id },
              data: {
                spouseId: principal.id, // Link new spouse back to principal
                custom_id: `EDM-${newSpouse.id.toString().padStart(4, "0")}`,
              },
            });
            await logAction({
              userId: user.id,
              userFullName,
              actionType: ActionType.MEMBER_CREATE,
              status: ActionStatus.SUCCESS,
              details: `created spouse member ${newSpouse.first_name} ${newSpouse.last_name} for family of ${existingPrincipal.first_name} ${existingPrincipal.second_name}.`,
              targetId: `${existingPrincipal.custom_id}`,
            });
          }
        } else if (oldSpouseId) {
          // SCENARIO B: The principal is now single/divorced/widowed, but was married before.
          // We need to unlink and delete the old spouse.
          const oldSpouse = await tx.member.findUnique({
            where: { id: oldSpouseId },
            select: { first_name: true, last_name: true },
          });
          await tx.member.update({
            where: { id: principal.id },
            data: { spouseId: null }, // Break the link from the principal first
          });

          await tx.member.delete({
            where: { id: oldSpouseId }, // Now safely delete the old spouse
          });
          if (oldSpouse) {
            await logAction({
              userId: user.id,
              userFullName,
              actionType: ActionType.MEMBER_DELETE,
              status: ActionStatus.SUCCESS,
              details: `Deleted spouse member ${oldSpouse.first_name} ${oldSpouse.last_name} from family of ${existingPrincipal.first_name}.`,
              targetId: `${existingPrincipal.custom_id}`,
            });
          }
          // Also remove any relatives associated with the old spouse
          await tx.relative.deleteMany({
            where: {
              familyId: familyId,
              relation_type: {
                in: [
                  "Spouse_Mother",
                  "Spouse_Father",
                  "Spouse_Sister",
                  "Spouse_Brother",
                ],
              },
            },
          });
        }

        // --- STEP 4: Synchronize Relatives by Family ID (Your existing logic) ---
        if (relatives) {
          const existingRelatives = await tx.relative.findMany({
            where: { familyId: familyId },
          });
          const inputRelativeIds = relatives
            .map((r) => r.id)
            .filter((id): id is number => id !== undefined && id !== null);

          // Delete relatives that are in the DB but not in the form submission
          await tx.relative.deleteMany({
            where: {
              familyId: familyId,
              id: { notIn: inputRelativeIds },
            },
          });

          // Update existing relatives or create new ones
          for (const relative of relatives) {
            const relativeData = {
              first_name: relative.first_name,
              second_name: relative.second_name,
              last_name: relative.last_name,
              relation_type: relative.relation_type,
              status: relative.status,
            };
            if (relative.id) {
              await tx.relative.update({
                where: { id: relative.id },
                data: relativeData,
              });
            } else {
              await tx.relative.create({
                data: {
                  ...relativeData,
                  familyId: familyId,
                },
              });
            }
          }
        }

        // --- STEP 5: Handle Financial Contribution Logic (Unchanged) ---
        if (principal.member_type === "New") {
          const registrationContribution = await tx.contribution.findFirst({
            where: { member_id: principal.id, type_name: "Registration" },
          });
          if (!registrationContribution) {
            const registrationType = await tx.contributionType.findFirst({
              where: { name: "Registration", is_active: true },
            });
            if (registrationType) {
              await tx.contribution.create({
                data: {
                  contribution_type_id: registrationType.id,
                  member_id: principal.id!,
                  type_name: "Registration",
                  amount: registrationType.amount,
                  start_date: new Date(),
                },
              });
            }
          }
        } else {
          await tx.contribution.deleteMany({
            where: { member_id: principal.id, type_name: "Registration" },
          });
        }
      },
      { timeout: 20000 }
    );

    return { success: true, error: false };
  } catch (err) {
    const error =
      err instanceof Error ? err : new Error("An unknown error occurred");
    const existingPrincipal = await prisma.member.findUnique({
      where: { id: principal.id },
      select: {
        custom_id: true,
      },
    });
    await logAction({
      userId: user.id,
      userFullName,
      actionType: ActionType.FAMILY_UPDATE,
      status: ActionStatus.FAILURE,
      details: `Failed to update family for principal: ${principal.first_name} ${principal.last_name}`,
      targetId: `MEMBER-${existingPrincipal?.custom_id}`,
      error: error.message,
    });

    console.error("Update family failed:", err);
    return {
      success: false,
      error: true,
      message: "A database error occurred during the update.",
    };
  }
};

// In your actions.ts file
export const deleteFamily = async (
  currentState: CurrentState,
  formData: FormData
) => {
  const user = await currentUser();
  if (!user) {
    // This case should be handled by your auth middleware, but it's a good safeguard.
    console.error(
      "CRITICAL: updateFamily action called without authenticated user."
    );
    return { success: false, error: true, message: "User not authenticated." };
  }
  const userFullName = `${user.firstName} ${user.lastName}`;

  const memberId = parseInt(formData.get("id") as string);

  if (isNaN(memberId)) {
    return {
      success: false,
      error: true,
      message: "Invalid Member ID provided.",
    };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // --- STEP 1: Find the Member to get their Family ID ---
      const memberToDelete = await tx.member.findUnique({
        where: { id: memberId },
        select: { familyId: true },
      });

      if (!memberToDelete || !memberToDelete.familyId) {
        // This could happen if the member was already deleted or isn't in a family.
        // We can treat this as a success since the goal is for them to be gone.
        console.warn(
          `Attempted to delete a member (ID: ${memberId}) who has no family link.`
        );
        return; // Exit the transaction gracefully.
      }

      const familyId = memberToDelete.familyId;

      // --- STEP 2: Find ALL Members of the Family to Clean Up Images ---
      const allFamilyMembers = await tx.member.findMany({
        where: { familyId: familyId },
        select: {
          document_file_id: true,
          image_file_id: true,
          identification_file_id: true,
        },
      });

      // --- STEP 3: Delete All Associated Images from ImageKit ---
      for (const member of allFamilyMembers) {
        if (member.document_file_id) {
          await deleteImageFromImageKit(member.document_file_id);
        }
        if (member.image_file_id) {
          await deleteImageFromImageKit(member.image_file_id);
        }
        if (member.identification_file_id) {
          await deleteImageFromImageKit(member.identification_file_id);
        }
      }
      await tx.family.delete({
        where: { id: familyId },
      });
    }); // End of transaction
    const memberToDelete = await prisma.member.findUnique({
      where: { id: memberId },
      select: {
        familyId: true,
        first_name: true,
        second_name: true,
        custom_id: true,
      },
    });
    await logAction({
      userId: user.id,
      userFullName,
      actionType: ActionType.MEMBER_DELETE,
      status: ActionStatus.SUCCESS,
      details: `successfully deleted family for principal: ${memberToDelete?.first_name} ${memberToDelete?.second_name}`,
      targetId: `MEMBER-${memberToDelete?.custom_id}`,
    });
    return { success: true, error: false };
  } catch (err: any) {
    const userFullName = `${user.firstName} ${user.lastName}`;
    const memberToDelete = await prisma.member.findUnique({
      where: { id: memberId },
      select: {
        familyId: true,
        first_name: true,
        second_name: true,
        custom_id: true,
      },
    });
    const error =
      err instanceof Error ? err : new Error("An unknown error occurred");
    await logAction({
      userId: user.id,
      userFullName,
      actionType: ActionType.MEMBER_DELETE,
      status: ActionStatus.FAILURE,
      details: `Failed to update family for principal: ${memberToDelete?.first_name} ${memberToDelete?.second_name}`,
      targetId: `MEMBER-${memberToDelete?.custom_id}`,
      error: error.message,
    });
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      return {
        success: true,
        error: false,
        message: "Family was not found. It may have already been deleted.",
      };
    }
    return {
      success: false,
      error: true,
      message: "A database error occurred while deleting the family.",
    };
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
  const user = await currentUser();
  if (!user) {
    // This case should be handled by your auth middleware, but it's a good safeguard.
    console.error(
      "CRITICAL: updateFamily action called without authenticated user."
    );
    return { success: false, error: true, message: "User not authenticated." };
  }
  const userFullName = `${user.firstName} ${user.lastName}`;
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
      const today = startOfMonth(addMonths(new Date(), 3)); // Using your adjusted date
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
          isPrincipal: true,
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

    await logAction({
      userId: user.id,
      userFullName: `${user.firstName} ${user.lastName}`,
      actionType: ActionType.CONTRIBUTION_UPDATE,
      status: ActionStatus.SUCCESS,
      details: `Successfully Updated Contribution: ${data.type_name}`,
    });
    return { success: true, error: false };
  } catch (err) {
    const error =
      err instanceof Error ? err : new Error("An unknown error occurred");
    await logAction({
      userId: user.id,
      userFullName: `${user.firstName} ${user.lastName}`,
      actionType: ActionType.CONTRIBUTION_UPDATE,
      status: ActionStatus.FAILURE,
      details: `Failed to Update Contribution: ${data.type_name}`,
      error: error.message,
    });
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
  const user = await currentUser();
  if (!user) {
    // This case should be handled by your auth middleware, but it's a good safeguard.
    console.error(
      "CRITICAL: updateFamily action called without authenticated user."
    );
    return { success: false, error: true, message: "User not authenticated." };
  }
  const userFullName = `${user.firstName} ${user.lastName}`;
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
            where: { status: "Active", isPrincipal: true },
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
    await logAction({
      userId: user.id,
      userFullName,
      actionType: ActionType.CONTRIBUTION_CREATE,
      status: ActionStatus.SUCCESS,
      details: `Successfully Created New Contribution :${data.type_name}`,
    });
    return { success: true, error: false, contributionType: result };
  } catch (err) {
    const error =
      err instanceof Error ? err : new Error("An unknown error occurred");
    await logAction({
      userId: user.id,
      userFullName,
      actionType: ActionType.CONTRIBUTION_CREATE,
      status: ActionStatus.FAILURE,
      details: `failed to Create New Contribution :${data.type_name}`,
    });
    console.error("Create contribution type failed:", err);
    return { success: false, error: true };
  }
};

export const deleteContributionType = async (id: number) => {
  const user = await currentUser();
  if (!user) {
    // This case should be handled by your auth middleware, but it's a good safeguard.
    console.error(
      "CRITICAL: updateFamily action called without authenticated user."
    );
    return { success: false, error: true, message: "User not authenticated." };
  }
  const userFullName = `${user.firstName} ${user.lastName}`;
  try {
    const contributionToDelete = await prisma.contributionType.findUnique({
      where: { id },
      select: { name: true },
    });
    await prisma.contributionType.delete({ where: { id } });

    await logAction({
      userId: user.id,
      userFullName,
      actionType: ActionType.CONTRIBUTION_DELETE,
      status: ActionStatus.SUCCESS,
      details: `Successfully Deleted Contribution :${contributionToDelete?.name}`,
    });
    return { success: true };
  } catch (err) {
    const contributionToDelete = await prisma.contributionType.findUnique({
      where: { id },
      select: { name: true },
    });
    const error =
      err instanceof Error ? err : new Error("An unknown error occurred");
    await logAction({
      userId: user.id,
      userFullName,
      actionType: ActionType.CONTRIBUTION_UPDATE,
      status: ActionStatus.FAILURE,
      details: `failed to Create New Contribution :${contributionToDelete?.name}`,
    });
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
      simulationMonths: 3,
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
  const user = await currentUser();
  if (!user) {
    console.error(
      "CRITICAL: updateFamily action called without authenticated user."
    );
    return { success: false, error: true, message: "User not authenticated." };
  }
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
    const member = await prisma.member.findUnique({ where: { id: memberId } });
    await logAction({
      userId: user.id,
      userFullName: `${user.firstName} ${user.lastName}`,
      actionType: ActionType.PENALTY_WAIVE,
      status: ActionStatus.SUCCESS,
      targetId: member?.custom_id?.toString(),
      details: `successfully waived penalty for member ${member?.custom_id} of penalty number ${penaltyId}`,
    });
    return { success: true };
  } catch (err) {
    const member = await prisma.member.findUnique({ where: { id: memberId } });
    const error =
      err instanceof Error ? err : new Error("An unknown error occurred");
    console.error("Failed to create family:", err);
    await logAction({
      userId: user.id,
      userFullName: `${user.firstName} ${user.lastName}`,
      actionType: ActionType.PENALTY_WAIVE,
      status: ActionStatus.FAILURE,
      details: `Failed to waive for member ${member?.custom_id} of penalty number ${penaltyId}`,
      error: error.message,
      targetId: member?.custom_id?.toString(),
    });
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
  const user = await currentUser();
  if (!user) {
    console.error(
      "CRITICAL: updateFamily action called without authenticated user."
    );
    return { success: false, error: true, message: "User not authenticated." };
  }
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
    await logAction({
      userId: user.id,
      userFullName: `${user.firstName} ${user.lastName}`,
      actionType: ActionType.PENALTY_CREATE,
      status: ActionStatus.SUCCESS,
      targetId: member?.custom_id?.toString(),
      details: `successfully created Penalty for :${member?.custom_id}`,
    });
    return { success: true, error: false, penalty };
  } catch (err) {
    const member = await prisma.member.findUnique({
      where: { id: data.member_id },
    });
    const error =
      err instanceof Error ? err : new Error("An unknown error occurred");
    console.error("Failed to create family:", err);
    await logAction({
      userId: user.id,
      userFullName: `${user.firstName} ${user.lastName}`,
      actionType: ActionType.PENALTY_CREATE,
      status: ActionStatus.FAILURE,
      details: `Failed to create Penalty for :${member?.custom_id}`,
      targetId: member?.custom_id?.toString(),
      error: error.message,
    });
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
export async function addPenaltyType(name: string, amount: number) {
  const trimmedName = name.trim();
  if (!trimmedName) throw new Error("Penalty type cannot be empty");
  const existing = await prisma.penaltyTypeModel.findUnique({
    where: { name: trimmedName },
  });
  if (existing) return existing;
  try {
    return await prisma.penaltyTypeModel.create({
      data: { name: trimmedName, amount },
    });
  } catch (err) {
    console.log(err);
  }
}
export async function addPenaltyTypeModel(name: string, amount: number) {
  const user = await currentUser();
  if (!user) {
    // This case should be handled by your auth middleware, but it's a good safeguard.
    console.error(
      "CRITICAL: updateFamily action called without authenticated user."
    );
    return { success: false, error: true, message: "User not authenticated." };
  }
  try {
    await prisma.penaltyTypeModel.create({ data: { name, amount } });
    await logAction({
      userId: user.id,
      userFullName: `${user.firstName} ${user.lastName}`,
      actionType: ActionType.PENALTY_CREATE,
      status: ActionStatus.SUCCESS,
      details: `successfully created penalty type:${name} `,
    });
    return;
  } catch (err) {
    const error =
      err instanceof Error ? err : new Error("An unknown error occurred");
    console.error("Failed to create family:", err);
    await logAction({
      userId: user.id,
      userFullName: `${user.firstName} ${user.lastName}`,
      actionType: ActionType.PENALTY_CREATE,
      status: ActionStatus.FAILURE,
      details: `Failed to create Penalty Type:${name}`,
      error: error.message,
    });
  }
}

// Get all
export async function getPenaltyTypesModel() {
  return prisma.penaltyTypeModel.findMany({ orderBy: { name: "asc" } });
}

// Update
export async function updatePenaltyType(
  id: number,
  name: string,
  amount: number
) {
  const user = await currentUser();
  if (!user) {
    // This case should be handled by your auth middleware, but it's a good safeguard.
    console.error(
      "CRITICAL: updateFamily action called without authenticated user."
    );
    return { success: false, error: true, message: "User not authenticated." };
  }
  const userFullName = `${user.firstName} ${user.lastName}`;
  try {
    return prisma.penaltyTypeModel.update({
      where: { id },
      data: { name, amount },
    });
  } catch (err) {}
}

// Delete
export async function deletePenaltyType(id: number) {
  const user = await currentUser();
  if (!user) {
    // This case should be handled by your auth middleware, but it's a good safeguard.
    console.error(
      "CRITICAL: updateFamily action called without authenticated user."
    );
    return { success: false, error: true, message: "User not authenticated." };
  }
  try {
    const penaltyType = await prisma.penaltyTypeModel.findUnique({
      where: { id },
    });
    await prisma.penaltyTypeModel.delete({ where: { id } });
    await logAction({
      userId: user.id,
      userFullName: `${user.firstName} ${user.lastName}`,
      actionType: ActionType.PENALTY_DELETE,
      status: ActionStatus.SUCCESS,
      details: `successfully Deleted Penalty Type:${penaltyType?.name}`,
    });
    return;
  } catch (err) {
    const penaltyType = await prisma.penaltyTypeModel.findUnique({
      where: { id },
    });
    const error =
      err instanceof Error ? err : new Error("An unknown error occurred");
    console.error("Failed to create family:", err);
    await logAction({
      userId: user.id,
      userFullName: `${user.firstName} ${user.lastName}`,
      actionType: ActionType.PENALTY_DELETE,
      status: ActionStatus.FAILURE,
      details: `Failed to Delete Penalty Type:${penaltyType?.name}`,
      error: error.message,
    });
  }
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

export async function deletePayment(data: {
  paymentId: number;
  memberId: number;
  contributionTypeID: number;
}) {
  const user = await currentUser();
  if (!user) {
    // This case should be handled by your auth middleware, but it's a good safeguard.
    console.error(
      "CRITICAL: updateFamily action called without authenticated user."
    );
    return { success: false, error: true, message: "User not authenticated." };
  }
  const userFullName = `${user.firstName} ${user.lastName}`;
  try {
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
          throw new Error(
            "Payment record not found or does not belong to this member."
          );
        }

        const isAutoAllocation =
          paymentRecord.document_reference === "Automated System Allocation";

        const contribution = await tx.contribution.findUnique({
          where: {
            member_id_contribution_type_id: {
              member_id: data.memberId,
              contribution_type_id: data.contributionTypeID,
            },
          },
        });

        if (!contribution) {
          throw new Error(
            "Contribution record not found for this member and contribution type."
          );
        }

        // 2. Reverse all allocations as before
        const allAllocations = await tx.payment.findMany({
          where: { payment_record_id: data.paymentId },
        });

        let scheduleAllocatedTotal = new Decimal(0);
        let penaltyAllocatedTotal = new Decimal(0);

        for (const allocation of allAllocations) {
          // Using .toLowerCase() to be safe against "Penalty" vs "penalty"
          if (
            allocation.payment_type.toLowerCase() === "penalty" &&
            allocation.penalty_id
          ) {
            await tx.penalty.update({
              where: { id: allocation.penalty_id },
              data: {
                paid_amount: { decrement: allocation.paid_amount },
                is_paid: false,
                resolved_at: null,
              },
            });
            penaltyAllocatedTotal = penaltyAllocatedTotal.plus(
              allocation.paid_amount
            );
          } else if (allocation.contribution_schedule_id) {
            await tx.contributionSchedule.update({
              where: { id: allocation.contribution_schedule_id },
              data: {
                paid_amount: { decrement: allocation.paid_amount },
                is_paid: false,
                paid_at: null,
              },
            });
            scheduleAllocatedTotal = scheduleAllocatedTotal.plus(
              allocation.paid_amount
            );
          }
        }

        // 3. Determine how to handle the unallocated amount based on payment type
        let amountToRestoreToUnallocated = new Decimal(0);
        let amountToWithdrawFromUnallocated = new Decimal(0);

        if (isAutoAllocation) {
          amountToRestoreToUnallocated = paymentRecord.total_paid_amount;
        } else {
          const totalPaidFromRecord = new Decimal(
            paymentRecord.total_paid_amount
          );
          const originallyUnallocated = totalPaidFromRecord
            .minus(scheduleAllocatedTotal)
            .minus(penaltyAllocatedTotal);
          if (originallyUnallocated.isNegative()) {
            throw new Error(
              "Data integrity issue: Reversal calculation resulted in a negative value."
            );
          }
          amountToWithdrawFromUnallocated = originallyUnallocated;
        }

        // 4. Update the balance with the corrected logic
        const currentBalance = await tx.balance.findUnique({
          where: {
            member_id_contribution_id: {
              member_id: data.memberId,
              contribution_id: contribution.id,
            },
          },
        });

        if (!currentBalance) {
          throw new Error(
            "Balance record not found for this member's contribution."
          );
        }

        if (
          currentBalance.unallocated_amount.lessThan(
            amountToWithdrawFromUnallocated
          )
        ) {
          throw new Error(
            `Cannot revert payment. Reversal requires withdrawing ${amountToWithdrawFromUnallocated} from unallocated credit, but the member only has ${currentBalance.unallocated_amount}. This credit may have already been used.`
          );
        }

        const allSchedulesForContribution =
          await tx.contributionSchedule.findMany({
            where: { contribution_id: contribution.id },
            select: { expected_amount: true, paid_amount: true },
          });

        const totalExpected = allSchedulesForContribution.reduce(
          (sum, s) => sum.plus(s.expected_amount),
          new Decimal(0)
        );
        const totalPaid = allSchedulesForContribution.reduce(
          (sum, s) => sum.plus(s.paid_amount),
          new Decimal(0)
        );
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
            member_id_contribution_id: {
              member_id: data.memberId,
              contribution_id: contribution.id,
            },
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
        const paymentRecordToDelete = await prisma.paymentRecord.findUnique({
          where: { id: data.paymentId },
          include: { member: true },
        });
        await logAction({
          userId: user.id,
          userFullName: `${user.firstName} ${user.lastName}`,
          actionType: ActionType.PAYMENT_DELETE,
          status: ActionStatus.SUCCESS,
          details: `successfully Deleted Payment Record of :${paymentRecordToDelete?.custom_id} amount:${paymentRecordToDelete?.total_paid_amount} for ${paymentRecordToDelete?.member.custom_id}`,
          targetId: paymentRecordToDelete?.custom_id,
        });

        return { success: true, error: false };
      },
      { isolationLevel: "Serializable", timeout: 20000 }
    );
  } catch (err) {
    const paymentRecord = await prisma.paymentRecord.findUnique({
      where: { id: data.paymentId },
      include: { member: true },
    });
    const error =
      err instanceof Error ? err : new Error("An unknown error occurred");
    await logAction({
      userId: user.id,
      userFullName: `${user.firstName} ${user.lastName}`,
      actionType: ActionType.PAYMENT_DELETE,
      status: ActionStatus.FAILURE,
      details: `Failed to Delete Payment Record for :${paymentRecord?.custom_id} amount:${paymentRecord?.total_paid_amount} for ${paymentRecord?.member.custom_id}`,
      error: error.message,
      targetId: paymentRecord?.custom_id,
    });
  }
}

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
// In your actions.ts file

export const transferPrincipalRole = async (
  outgoingPrincipalId: number
): Promise<CurrentState> => {
  const user = await currentUser();
  if (!user) {
    console.error(
      "CRITICAL: updateFamily action called without authenticated user."
    );
    return { success: false, error: true, message: "User not authenticated." };
  }
  const userFullName = `${user.firstName} ${user.lastName}`;
  if (!outgoingPrincipalId) {
    return {
      success: false,
      error: true,
      message: "Outgoing principal ID was not provided.",
    };
  }
  try {
    await prisma.$transaction(
      async (tx) => {
        const outgoingPrincipal = await tx.member.findUnique({
          where: { id: outgoingPrincipalId, isPrincipal: true },
          select: { spouseId: true, familyId: true },
        });
        if (
          !outgoingPrincipal ||
          !outgoingPrincipal.spouseId ||
          !outgoingPrincipal.familyId
        ) {
          throw new Error(
            `Validation failed: Principal, spouse, or family link not found.`
          );
        }
        const incomingPrincipalId = outgoingPrincipal.spouseId;
        const familyId = outgoingPrincipal.familyId;

        // --- STEP 3: Perform the Role Swap ---
        await tx.member.update({
          where: { id: outgoingPrincipalId },
          data: { isPrincipal: false },
        });
        await tx.member.update({
          where: { id: incomingPrincipalId },
          data: { isPrincipal: true },
        });

        await tx.payment.updateMany({
          where: { member_id: outgoingPrincipalId },
          data: { member_id: incomingPrincipalId },
        });

        await tx.balance.updateMany({
          where: { member_id: outgoingPrincipalId },
          data: { member_id: incomingPrincipalId },
        });

        // CRITICAL FIX: Remove the 'is_paid: false' filter. Transfer ALL penalties.
        await tx.penalty.updateMany({
          where: { member_id: outgoingPrincipalId },
          data: { member_id: incomingPrincipalId },
        });

        await tx.contribution.updateMany({
          where: { member_id: outgoingPrincipalId },
          data: { member_id: incomingPrincipalId },
        });

        // CRITICAL ADDITION: Transfer all ContributionSchedule records.
        await tx.contributionSchedule.updateMany({
          where: { member_id: outgoingPrincipalId },
          data: { member_id: incomingPrincipalId },
        });

        await tx.paymentRecord.updateMany({
          where: { member_id: outgoingPrincipalId },
          data: { member_id: incomingPrincipalId },
        });

        // --- STEP 5: Re-map Family Relatives ---
        // (Your existing, correct relative re-mapping logic goes here)
        await tx.relative.deleteMany({
          where: {
            familyId: familyId,
            relation_type: { in: ["Mother", "Father", "Brother", "Sister"] },
          },
        });
        const relativesToUpdate = await tx.relative.findMany({
          where: {
            familyId: familyId,
            relation_type: {
              in: [
                "Spouse_Mother",
                "Spouse_Father",
                "Spouse_Brother",
                "Spouse_Sister",
              ],
            },
          },
        });
        for (const relative of relativesToUpdate) {
          const newRelationType = relative.relation_type.replace("Spouse_", "");
          await tx.relative.update({
            where: { id: relative.id },
            data: { relation_type: newRelationType },
          });
        }
      },
      { timeout: 20000 }
    );
    const outgoingPrincipal = await prisma.member.findUnique({
      where: { id: outgoingPrincipalId, isPrincipal: true },
      include: { spouse: true },
    });
    await logAction({
      userId: user.id,
      userFullName: `${user.firstName} ${user.lastName}`,
      actionType: ActionType.ROlE_TRANSFER,
      status: ActionStatus.SUCCESS,
      details: `successfully transfered role from ${outgoingPrincipal?.custom_id} to${outgoingPrincipal?.spouse?.custom_id}`,
    });
    return { success: true, error: false };
  } catch (err: any) {
    const outgoingPrincipal = await prisma.member.findUnique({
      where: { id: outgoingPrincipalId, isPrincipal: true },
      include: { spouse: true },
    });
    const error =
      err instanceof Error ? err : new Error("An unknown error occurred");
    console.error("Failed to create family:", err);
    await logAction({
      userId: user.id,
      userFullName: `${user.firstName} ${user.lastName}`,
      actionType: ActionType.ROlE_TRANSFER,
      status: ActionStatus.FAILURE,
      details: `Failed to transfere role from ${outgoingPrincipal?.custom_id} to${outgoingPrincipal?.spouse?.custom_id}`,
      error: error.message,
    });
    return {
      success: false,
      error: true,
      message:
        err.message || "A database error occurred during the role transfer.",
    };
  }
};
export const getPendingTransfersCount = async (): Promise<number> => {
  try {
    const count = await prisma.member.count({
      where: {
        // Condition 1: They must be a principal.
        isPrincipal: true,
        // Condition 2: Their status must require a transfer.
        status: { in: ["Deceased", "Left"] },
        // Condition 3: They must have a spouse to transfer to.
        spouseId: { not: null },
        // Condition 4: The spouse must be in a state to accept the role.
        spouse: {
          status: "Active",
        },
      },
    });
    return count;
  } catch (error) {
    console.error("Failed to fetch pending transfers count:", error);
    // Return 0 in case of an error to prevent the UI from breaking.
    return 0;
  }
};

export async function generateInitialSchedulesForMember(
  memberId: number,
  tx: Prisma.TransactionClient,
  // --- FIX #1: Accept the effectiveDate from the calling function ---
  effectiveDate: Date
) {
  // STEP 1: Fetch the new member and their contributions.
  const member = await tx.member.findUnique({
    where: { id: memberId },
    include: {
      Contribution: {
        include: {
          contributionType: true,
        },
      },
    },
  });

  if (!member) {
    console.error(
      `generateInitialSchedules: Member with ID ${memberId} not found.`
    );
    return;
  }

  // STEP 2: Loop through contributions and build the schedule data.
  const allNewSchedules = [];
  const contributionsToUpdate: number[] = [];

  // --- FIX #2: Use the effectiveDate as the "current time" for calculations ---
  const nowForOpenEnded = normalizeToMonthStart(effectiveDate);

  for (const contribution of member.Contribution) {
    const { contributionType } = contribution;
    if (!contributionType?.is_active) continue;

    // This correctly uses the contribution's start date, which was already
    // set to the effectiveDate in the `createFamily` function.
    const startDate = contribution.start_date;
    if (!startDate) continue;

    const contributionAmount = Number(contributionType.amount);
    if (contributionAmount <= 0) continue;

    if (contributionType.mode === "OneTimeWindow") {
      allNewSchedules.push({
        member_id: member.id,
        contribution_id: contribution.id,
        month: startDate,
        paid_amount: 0,
        is_paid: false,
        expected_amount: contributionAmount,
      });
      contributionsToUpdate.push(contribution.id);
      continue;
    }

    let recurringStart = normalizeToMonthStart(startDate);
    let recurringEnd: Date;

    if (contributionType.mode === "Recurring") {
      if (!contributionType.end_date) continue;
      recurringEnd = normalizeToMonthStart(contributionType.end_date);
    } else {
      recurringEnd = addMonths(nowForOpenEnded, 11);
    }

    const months = generateMonthlyDates(recurringStart, recurringEnd);

    for (const month of months) {
      allNewSchedules.push({
        member_id: member.id,
        contribution_id: contribution.id,
        month,
        paid_amount: 0,
        is_paid: false,
        expected_amount: contributionAmount,
      });
    }

    if (months.length > 0) {
      contributionsToUpdate.push(contribution.id);
    }
  }

  if (allNewSchedules.length > 0) {
    await tx.contributionSchedule.createMany({
      data: allNewSchedules,
      skipDuplicates: true,
    });

    console.log(
      `Generated ${allNewSchedules.length} initial schedules for member #${memberId}.`
    );
  }
}
export async function checkContributionmode(type: string) {
  const contributionmode = await prisma.contributionType.findUnique({
    where: { name: type },
  });
  if (
    contributionmode?.mode === "Recurring" ||
    contributionmode?.mode == "OneTimeWindow"
  ) {
    return true;
  } else {
    return false;
  }
}
export async function fetchbalance(memberID: number, type: string) {
  console.log("fetchbalcne data:", memberID, type);
  const contributionType = await prisma.contributionType.findUnique({
    where: { name: type },
  });
  const contribution = await prisma.contribution.findUnique({
    where: {
      member_id_contribution_type_id: {
        member_id: memberID,
        contribution_type_id: contributionType?.id!,
      },
    },
  });
  const balance = await prisma.balance.findUnique({
    where: {
      member_id_contribution_id: {
        member_id: memberID,
        contribution_id: contribution?.id!,
      },
    },
  });
  const penalties = await prisma.penalty.findMany({
    where: {
      member_id: memberID,
      contribution_id: contribution?.id,
      is_paid: false,
    },
  });
  console.log("penalties:", penalties);
  const totalpenalty = penalties.reduce((sum, initial) => {
    return sum + Number(Number(initial.expected_amount)-Number(initial.paid_amount));
  }, 0);
  console.log("balance:", balance?.amount, "totalpenalty:", totalpenalty);
  return Number(balance?.amount) + totalpenalty;
}

export async function checkIFhasExcessbalance(memberid: number) {
  try {
    console.log(`Checking balance for member ID: ${memberid}`); // Add this log

    const contributionType = await prisma.contributionType.findUnique({
      where: { name: "Monthly" },
    });

    if (!contributionType) {
      console.warn("Contribution type 'Monthly' not found."); // Use console.warn for non-critical issues
      return 0; // Or throw an error, depending on your logic
    }

    const contribution = await prisma.contribution.findUnique({
      where: {
        member_id_contribution_type_id: {
          member_id: memberid,
          contribution_type_id: contributionType?.id!,
        },
      },
    });

    if (!contribution) {
      console.warn(
        `No contribution found for member ID: ${memberid}, contribution type ID: ${contributionType.id}`
      );
      return 0;
    }

    const memberbalance = await prisma.balance.findUnique({
      where: {
        member_id_contribution_id: {
          member_id: memberid,
          contribution_id: contribution?.id!,
        },
      },
    });

    if (!memberbalance) {
      console.warn(
        `No balance found for member ID: ${memberid}, contribution ID: ${contribution.id}`
      );
      return 0;
    }

    console.log(`Unallocated amount: ${memberbalance.unallocated_amount}`);
    return Number(memberbalance?.unallocated_amount);
  } catch (error) {
    console.error("Error in checkIFhasExcessbalance:", error); // CRITICAL: Log the error!
    return 0; // Or re-throw the error, depending on how you want to handle it
  }
}
type contributioType = {
  id: number;
  amount: number;
  name: string;
  is_active: boolean;
};
export async function deductAmountFromBalance(
  member_id: number,
  amount: number
) {
  const contributionType = await prisma.contributionType.findUnique({
    where: { name: "Monthly" },
  });
  const contribution = await prisma.contribution.findUnique({
    where: {
      member_id_contribution_type_id: {
        member_id,
        contribution_type_id: contributionType?.id!,
      },
    },
  });
  await prisma.balance.update({
    where: {
      member_id_contribution_id: {
        member_id,
        contribution_id: contribution?.id!,
      },
    },
    data: {
      unallocated_amount: {
        decrement: amount,
      },
    },
  });
  return;
}

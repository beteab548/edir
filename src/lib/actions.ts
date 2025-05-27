"use server";

import { Decimal } from "@prisma/client/runtime/library";
import { CombinedSchema, RelativeSchema } from "./formValidationSchemas";
import prisma from "./prisma";

type CurrentState = { success: boolean; error: boolean };
export const createMember = async (
  currentState: CurrentState,
  data: CombinedSchema
) => {
  console.log("in create", data);

  try {
    await prisma.member.create({
      data: {
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
        ...(data.member.id_number ? { id_number: data.member.id_number } : {}),

        birth_date: new Date(data.member.birth_date),
        citizen: data.member.citizen,
        // joined_date is required now
        ...(data.member.joined_date
          ? { joined_date: new Date(data.member.joined_date) }
          : {}),

        ...(data.member.end_date
          ? { end_date: new Date(data.member.end_date) }
          : {}),

        phone_number: data.member.phone_number,
        wereda: data.member.wereda,
        kebele: data.member.kebele,
        zone_or_district: data.member.zone_or_district,
        member_type: data.member.member_type,
        // ...(data.member.document
        //   ? { document: data.member.document }
        //   : {}),
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
    if (data.member.member_type === "New") {
      // Get all active contribution types that are for all members
      const activeContributionTypes = await prisma.contributionType.findMany({
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
      //now create contributions for the new member
      const contributionsData = activeContributionTypes
        .filter(() => typeof data.member.id === "number")
        .map((type) => ({
          contribution_type_id: type.id, // Assuming you have an ID for the contribution type
          member_id: data.member.id as number,
          type_name: type.name,
          amount: type.amount,
          start_date: type.start_date || new Date(),
          end_date: type.end_date || new Date(),
        }));
      // Create contributions for the new member
      if (contributionsData.length > 0) {
        await prisma.contribution.createMany({
          data: contributionsData,
        });
      }
    }
    return { success: true, error: false };
  } catch (err) {
    console.error(err);
    return { success: false, error: true };
  }
};

export const updateMember = async (
  currentState: CurrentState,
  data: CombinedSchema
) => {
  console.log("Update data:", data);

  if (!data.member?.id) return { success: false, error: true };

  // Normalize relatives to always be an array

  try {
    await prisma.$transaction(async (prisma) => {
      // First update the member
      await prisma.member.update({
        where: { id: data.member.id },
        data: {
          // Member fields
          first_name: data.member.first_name,
          second_name: data.member.second_name,
          last_name: data.member.last_name,
          profession: data.member.profession,
          title: data.member.title,
          job_business: data.member.job_business,
          id_number: data.member.id_number,
          birth_date: new Date(data.member.birth_date),
          citizen: data.member.citizen,
          ...(data.member.joined_date
            ? { joined_date: new Date(data.member.joined_date) }
            : {}),
          end_date: data.member.end_date
            ? new Date(data.member.end_date)
            : null,
          phone_number: data.member.phone_number,
          wereda: data.member.wereda,
          kebele: data.member.kebele,
          zone_or_district: data.member.zone_or_district,
          sex: data.member.sex,
          status: data.member.status,
          remark: data.member.remark ?? "",
          member_type: data.member.member_type,
        },
      });
      // i want to check if the member_staus is new and then add the member to the conttribution table those contributionType that are active and for all
      if (data.member.member_type === "New") {
        // Get all active contribution types that are for all members
        const activeContributionTypes = await prisma.contributionType.findMany({
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
        //now create contributions for the new member
        const contributionsData = activeContributionTypes
          .filter(() => typeof data.member.id === "number")
          .map((type) => ({
            contribution_type_id: type.id, // Assuming you have an ID for the contribution type
            member_id: data.member.id as number,
            type_name: type.name,
            amount: type.amount,
            start_date: type.start_date || new Date(),
            end_date: type.end_date || new Date(),
          }));
        // Create contributions for the new member
        if (contributionsData.length > 0) {
          await prisma.contribution.createMany({
            data: contributionsData,
          });
        }
      }
      // Then handle relatives in a separate operation
      if (Array.isArray(data.relatives) && data.relatives.length > 0) {
        // First delete existing relatives
        await prisma.relative.deleteMany({
          where: { member_id: data.member.id },
        });

        // Then create new ones
        await prisma.relative.createMany({
          data: data.relatives.map((relative) => ({
            member_id: data.member.id as number,
            first_name: relative.first_name,
            second_name: relative.second_name,
            last_name: relative.last_name,
            relation_type: relative.relation_type,
            status: relative.status,
          })),
        });
      } else {
        // No relatives provided, ensure none exist
        await prisma.relative.deleteMany({
          where: { member_id: data.member.id },
        });
      }
    });
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
    await prisma.member.delete({
      where: { id },
    });

    return { success: true, error: false };
  } catch (err) {
    console.error(err);
    return { success: false, error: true };
  }
};
// type ContributionType={
//   id:number
//   type_name:string
//   amount:number
//   start_date:Date
//   end_date:Date
//   is_active:boolean
//   is_for_all:boolean
// }
export const updateContribution = async (
  currentState: CurrentState,
  data: {
    id: number;
    amount: number;
    type_name: string;
    start_date: Date | null;
    end_date: Date | null;
    is_active: boolean;
    is_for_all: boolean;
    member_ids?: number[];
  }
) => {
  try {
    console.log("data send for update are", data);
    // 1. Get current contribution type
    const currentType = await prisma.contributionType.findUnique({
      where: { id: data.id },
    });

    if (!currentType) {
      throw new Error("Contribution type not found");
    }

    // 2. Get all related contributions (using type_name)
    const currentContributions = await prisma.contribution.findMany({
      where: { type_name: currentType.name },
      select: { member_id: true, id: true },
    });

    // 3. Update the contribution type
    const updatedType = await prisma.contributionType.update({
      where: { id: data.id },
      data: {
        amount: data.amount,
        name: data.type_name,
        start_date: data.start_date,
        end_date: data.end_date,
        is_active: data.is_active,
        is_for_all: data.is_for_all,
      },
    });

    // 4. Prepare transaction operations
    const transactionOps = [];

    // 5. Handle amount/name changes for existing contributions
    const amountChanged = currentType.amount !== Decimal(data.amount);
    const typeNameChanged = currentType.name !== data.type_name;

    if (amountChanged || typeNameChanged) {
      transactionOps.push(
        prisma.contribution.updateMany({
          where: { type_name: currentType.name },
          data: {
            amount: updatedType.amount,
            ...(typeNameChanged && {
              type_name: updatedType.name,
            }),
          },
        })
      );
    }

    // 6. Handle member assignments
    if (data.is_for_all) {
      // Get all active members not currently linked
      const missingMembers = await prisma.member.findMany({
        where: {
          status: "Active",
          id: {
            notIn: currentContributions.map((c) => c.member_id),
          },
        },
        select: { id: true },
      });

      if (missingMembers.length > 0) {
        transactionOps.push(
          prisma.contribution.createMany({
            data: missingMembers.map((member) => ({
              contribution_type_id: currentType.id,
              member_id: member.id,
              type_name: updatedType.name,
              amount: updatedType.amount,
              start_date: updatedType.start_date || new Date(),
              end_date: updatedType.end_date || new Date(),
            })),
          })
        );
      }
    } else {
      // Handle specific member selection
      if (!data.member_ids || data.member_ids.length === 0) {
        throw new Error("At least one member must be selected");
      }

      // Find members to remove (members in current but not in new selection)
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

      // Find members to add (members in new selection but not in current)
      const existingMemberIds = currentContributions.map((c) => c.member_id);
      const membersToAdd = data.member_ids.filter(
        (id) => !existingMemberIds.includes(id)
      );

      if (membersToAdd.length > 0) {
        // First check if these members already have this contribution type
        const existingContributionsForNewMembers =
          await prisma.contribution.findMany({
            where: {
              member_id: { in: membersToAdd },
              type_name: updatedType.name,
            },
            select: { member_id: true },
          });

        const membersAlreadyHaveContribution =
          existingContributionsForNewMembers.map((c) => c.member_id);
        const trulyNewMembers = membersToAdd.filter(
          (id) => !membersAlreadyHaveContribution.includes(id)
        );

        if (trulyNewMembers.length > 0) {
          transactionOps.push(
            prisma.contribution.createMany({
              data: trulyNewMembers.map((member_id) => ({
                contribution_type_id: updatedType.id,
                member_id,
                type_name: updatedType.name,
                amount: updatedType.amount,
                start_date: updatedType.start_date || new Date(),
                end_date: updatedType.end_date || new Date(),
              })),
            })
          );
        }
      }
    }

    // 7. Execute as single transaction
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
  name: string;
  amount: number;
  start_date: Date | string;
  end_date: Date | string;
  is_for_all: boolean;
  member_ids?: number[];
  is_active?: boolean;
}) => {
  try {
    console.log(data);

    // 1. Create the contribution type
    const contributionType = await prisma.contributionType.create({
      data: {
        name: data.name,
        amount: data.amount,
        start_date: new Date(data.start_date),
        end_date: new Date(data.end_date),
        is_active: data.is_active ?? true,
        is_for_all: data.is_for_all,
      },
    });
    // 2. If is_for_all, assign to all active members; else, assign to selected members
    let memberIds: number[] = [];

    if (data.is_for_all) {
      const activeMembers = await prisma.member.findMany({
        where: { status: "Active" },
        select: { id: true },
      });
      memberIds = activeMembers.map((m) => m.id);
    } else if (data.member_ids && data.member_ids.length > 0) {
      memberIds = data.member_ids;
    }

    // 3. Create contributions for each member
    if (memberIds.length > 0) {
      await prisma.contribution.createMany({
        data: memberIds.map((member_id) => ({
          contribution_type_id: contributionType.id,
          member_id,
          type_name: contributionType.name,
          amount: contributionType.amount,
          start_date: contributionType.start_date ?? new Date(),
          end_date: contributionType.end_date ?? new Date(),
        })),
      });
    }
    return { success: true, error: false };
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

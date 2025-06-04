"use server";

import { Decimal } from "@prisma/client/runtime/library";
import { CombinedSchema, RelativeSchema } from "./formValidationSchemas";
import prisma from "./prisma";
import { Prisma } from "@prisma/client";
import { applyCatchUpPayment } from "./services/paymentService";
import { ContributionMode } from "@prisma/client"; // Assuming you have this enum defined

type CurrentState = { success: boolean; error: boolean };
export const createMember = async (
  currentState: CurrentState,
  data: CombinedSchema
) => {
  console.log("in create", data);

  try {
    const createdMember = await prisma.member.create({
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
        ...(data.member.document
          ? { document: data.member.document }
          : {}),
        ...(data.member.image_url
          ? { image_url: data.member.image_url }
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
    if (createdMember.member_type === "New") {
      console.log("member is new");
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
      const contributionsData = activeContributionTypes.map((type) => ({
        contribution_type_id: type.id, // Assuming you have an ID for the contribution type
        member_id: createdMember.id,
        type_name: type.name,
        amount: type.amount,
        start_date: new Date(),
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

  try {
    await prisma.$transaction(async (prisma) => {
      // 1. Update the member
      await prisma.member.update({
        where: { id: data.member.id },
        data: {
          first_name: data.member.first_name,
          second_name: data.member.second_name,
          last_name: data.member.last_name,
          ...(data.member.profession && { profession: data.member.profession }),
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
          ...(data.member.end_date && {
            end_date: new Date(data.member.end_date),
          }),
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

      // 2. Add contributions only if member_type is New and no contributions exist
      if (data.member.member_type === "New") {
        const existingContributions = await prisma.contribution.findFirst({
          where: { member_id: data.member.id },
        });

        if (!existingContributions) {
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

          const contributionsData = activeContributionTypes.map((type) => ({
            contribution_type_id: type.id,
            member_id: data.member.id as number,
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

      // 3. Handle relatives
      await prisma.relative.deleteMany({
        where: { member_id: data.member.id },
      });

      if (Array.isArray(data.relatives) && data.relatives.length > 0) {
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
    mode: "Recurring" | "OneTimeWindow" | "OpenEndedRecurring";
    penalty_amount: number;
    period_months?: number | null;
  }
) => {
  try {
    console.log("data send for update are", data);

    const currentType = await prisma.contributionType.findUnique({
      where: { id: data.id },
    });

    if (!currentType) {
      throw new Error("Contribution type not found");
    }

    const currentContributions = await prisma.contribution.findMany({
      where: { type_name: currentType.name },
      select: { member_id: true, id: true },
    });

    const updatedType = await prisma.contributionType.update({
      where: { id: data.id },
      data: {
        amount: data.amount,
        name: data.type_name,
        start_date: data.start_date,
        end_date: data.end_date,
        is_active: data.is_active,
        is_for_all: data.is_for_all,
        mode: data.mode,
        penalty_amount: data.penalty_amount,
        period_months:
          data.mode === "OneTimeWindow" ? data.period_months : null,
      },
    });

    const transactionOps = [];

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

    if (data.is_for_all) {
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
  penalty_amount: number;
  start_date: Date | undefined;
  end_date: Date | null | undefined;
  period_months: number | undefined;
  is_for_all: boolean;
  member_ids?: number[];
  is_active?: boolean;
  mode: ContributionMode;
}) => {
  console.log(data);
  try {
    let startDate: Date;
    let endDate: Date | null = null;

    if (data.mode === "OneTimeWindow" && data.period_months !== undefined) {
      startDate = new Date();
      endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + data.period_months);
      endDate.setDate(0); // Set to the last day of the target month
    } else if (data.mode === "Recurring") {
      if (!data.start_date || !data.end_date) {
        throw new Error("Recurring mode requires start and end dates.");
      }
      startDate = new Date(data.start_date);
      endDate = new Date(data.end_date);
    } else if (data.mode === "OpenEndedRecurring") {
      if (!data.start_date) {
        throw new Error("OpenEndedRecurring mode requires a start date.");
      }
      startDate = new Date(data.start_date);
      endDate = null; // No end date for open-ended
    } else {
      throw new Error("Invalid configuration for contribution period.");
    }

    // Create the contribution type
    const contributionType = await prisma.contributionType.create({
      data: {
        name: data.name,
        amount: data.amount,
        penalty_amount: data.penalty_amount,
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
      const activeMembers = await prisma.member.findMany({
        where: { status: "Active" },
        select: { id: true },
      });
      memberIds = activeMembers.map((m) => m.id);
    } else if (data.member_ids?.length) {
      memberIds = data.member_ids;
    }

    if (memberIds.length > 0) {
      await prisma.contribution.createMany({
        data: memberIds.map((member_id) => ({
          contribution_type_id: contributionType.id,
          member_id,
          type_name: contributionType.name,
          amount: contributionType.amount,
          start_date: contributionType.start_date!,
          end_date: contributionType.end_date,
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
type Payment = {
  paid_amount: Number;
  payment_date: Date;
  contribution_id: string;
  contribution_type: string;
  member_id: number;
  payment_method: string;
  payment_month: string;
  receipt: string;
};

export const createPaymentAction = async (
  currentState: CurrentState,
  data: Payment
) => {
  console.log("sent paymnet data is",data);
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
      return { success: false, message: "Contribution Type Doesn't Exist!" };
    }

    const memberExists = await prisma.member.findUnique({
      where: { id: currentMemberId },
    });
    if (!memberExists) {
      return { success: false, message: "Member Doesn't Exist!" };
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
      return { success: false, message: "Member Contribution Doesn't Exist!" };
    }
    const payments = await applyCatchUpPayment({
      memberId: currentMemberId,
      contributionId: currentContributionId,
      paidAmount: paymentAmount,
      paymentMethod,
      documentReference: paymentReceipt || "-",
    });
    console.log("payments are ", payments);
    return { success: true };
  } catch (error) {
    console.log(error);
    return { success: false };
  }
};

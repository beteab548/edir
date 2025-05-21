"use server";

import { revalidatePath } from "next/cache";
import { CombinedSchema, RelativeSchema } from "./formValidationSchemas";
import prisma from "./prisma";
import { ContributionType } from "@prisma/client";

type CurrentState = { success: boolean; error: boolean };

export const createMember = async (
  currentState: CurrentState,
  data: CombinedSchema
) => {
  console.log("in create",data);

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
        ...(data.member.id_number
          ? { id_number: data.member.id_number }
          : {}),

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
          end_date: data.member.end_date ? new Date(data.member.end_date) : null,
          phone_number: data.member.phone_number,
          wereda: data.member.wereda,
          kebele: data.member.kebele,
          zone_or_district: data.member.zone_or_district,
          sex: data.member.sex,
          status: data.member.status,
          remark: data.member.remark ?? "",
        }
      });

      // Then handle relatives in a separate operation
      if (Array.isArray(data.relatives) && data.relatives.length > 0) {
        // First delete existing relatives
        await prisma.relative.deleteMany({
          where: { member_id: data.member.id }
        });

        // Then create new ones
        await prisma.relative.createMany({
          data: data.relatives.map(relative => ({
            member_id: data.member.id as number,
            first_name: relative.first_name,
            second_name: relative.second_name,
            last_name: relative.last_name,
            relation_type: relative.relation_type,
            status: relative.status,
          }))
        });
      } else {
        // No relatives provided, ensure none exist
        await prisma.relative.deleteMany({
          where: { member_id: data.member.id }
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

export const updateContribution = async (
  currentState: CurrentState,
  data: ContributionType
) => {
const {amount,end_date,start_date,name,is_active,is_for_all}=data
  try {
    await prisma.contributionType.create({
  data:{
    amount,
    end_date,
    start_date,
    name,
    is_active,
    is_for_all
  }
    });

    return { success: true, error: false };
  } catch (err) {
    console.error(err);
    return { success: false, error: true };
  }
};

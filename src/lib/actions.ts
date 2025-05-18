"use server";

import { revalidatePath } from "next/cache";
import {MemberSchema} from "./formValidationSchemas";
import prisma from "./prisma";


type CurrentState = { success: boolean; error: boolean };

export const createMember = async (
  currentState: CurrentState,
  data: MemberSchema
) => {
  try {
    await prisma.member.create({
      data: {
        first_name: data.first_name,
        second_name: data.second_name,
        last_name: data.last_name,

        ...(data.profession ? { profession: data.profession } : {}),
        ...(data.title ? { title: data.title } : {}),
        ...(data.job_business ? { job_business: data.job_business } : {}),
        ...(data.id_number ? { id_number: data.id_number } : {}),

        birth_date: new Date(data.birth_date),
        citizen: data.citizen,

        // joined_date is required now
       ...(data.joined_date ? { joined_date: new Date(data.joined_date) } : {}),

        ...(data.end_date ? { end_date: new Date(data.end_date) } : {}),

        phone_number: data.phone_number,
        wereda : data.wereda,
        kebele : data.kebele,
        zone_or_district : data.zone_or_district,

        ...(data.document ? { document: data.document } : {}),

        sex: data.sex,
        status: data.status,

        remark: data.remark ?? "",
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
  data: MemberSchema
) => {
  
  if (!data.id) return { success: false, error: true };

  try {
    await prisma.member.update({
      where: {
        id: data.id,
      },
      data: {
        first_name: data.first_name,
        second_name: data.second_name,
        last_name: data.last_name,

        ...(data.profession ? { profession: data.profession } : {}),
        ...(data.title ? { title: data.title } : {}),
        ...(data.job_business ? { job_business: data.job_business } : {}),
        ...(data.id_number ? { id_number: data.id_number } : {}),

        birth_date: new Date(data.birth_date),
        citizen: data.citizen,

        // joined_date is required
        ...(data.joined_date ? { joined_date: new Date(data.joined_date) } : {}),

        ...(data.end_date ? { end_date: new Date(data.end_date) } : {}),

        phone_number: data.phone_number,
        wereda : data.wereda,
        kebele : data.kebele,
        zone_or_district : data.zone_or_district,

        ...(data.document ? { document: data.document } : {}),

        sex: data.sex,
        status: data.status,

        remark: data.remark ?? "",
      },
    });

    return { success: true, error: false };
  } catch (err) {
    console.error(err);
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



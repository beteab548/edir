import { z } from "zod";


export const memberSchema = z.object({
  id: z.coerce.number().optional(),

  first_name: z.string().min(1, { message: "First name is required!" }),
  second_name: z.string().min(1, { message: "Second name is required!" }),
  last_name: z.string().min(1, { message: "Last name is required!" }),

  profession: z.string().optional(),
  title: z.string().optional(),
  job_business: z.string().optional(),

  id_number: z.string().optional(),

  birth_date: z.coerce.date({ message: "Birth date is required!" }),
  citizen: z.string().min(1, { message: "Citizenship is required!" }),

  joined_date: z.coerce.date().optional(),
  end_date: z.coerce.date().optional(),

  wereda: z.string().optional(),
  zone_or_district: z.string().optional(),
  kebele: z.string().optional(),
  sex: z.enum(["Male", "Female"], { message: "Sex is required!" }),
  phone_number: z.string().min(1, { message: "Phone number is required!" }),

  document: z.string().optional(),
  remark: z.string().optional(),

  status: z.enum(["Active", "Inactive"], { message: "Status is required!" }),
});

export type MemberSchema = z.infer<typeof memberSchema>;


export const relativeSchema = z.object({
  id: z.number().optional(),
  member_id: z.number({ required_error: "Member ID is required!" }),

  first_name: z.string().min(1, { message: "First name is required!" }),
  second_name: z.string().min(1, { message: "Second name is required!" }),
  last_name: z.string().min(1, { message: "Last name is required!" }),

  relation_type: z.enum([
    "Mother",
    "Father",
    "Daughter",
    "Son",
    "Sister",
    "Brother",
    "Spouse_Mother",
    "Spouse_Father",
    "Spouse_Sister",
    "Spouse_Brother",
    "other",
  ], { message: "Relation type is required!" }),

  status: z.enum(["Alive", "Sick", "Deceased"], { message: "Relative status is required!" }),
});

export type RelativeSchema = z.infer<typeof relativeSchema>;




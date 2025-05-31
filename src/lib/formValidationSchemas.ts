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
  end_date: z.union([z.coerce.date(), z.literal("")]).optional(),
  wereda: z.string().optional(),
  zone_or_district: z.string().optional(),
  kebele: z.string().optional(),
  sex: z.enum(["Male", "Female"], { message: "Sex is required!" }),
  phone_number: z.string().min(1, { message: "Phone number is required!" }),

  // document: z.string().optional(),
  remark: z.string().optional(),

  status: z.enum(["Active", "Inactive"], { message: "Status is required!" }),
  member_type: z.enum(["New", "Existing"], { message: "member status is required!" }),
});


export type MemberSchema = z.infer<typeof memberSchema>;
export const relativeSchema = z.object({
  id: z.number().optional(),
  // member_id: z.number({ required_error: "Member ID is required!" }),

  first_name: z.string().min(1, { message: "First name is required!" }),
  second_name: z.string().min(1, { message: "Second name is required!" }),
  last_name: z.string().min(1, { message: "Last name is required!" }),

  relation_type: z.enum(
    [
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
    ],
    { message: "Relation type is required!" }
  ),
  status: z.enum(["Alive", "Sick", "Deceased"], {
    message: "Relative status is required!",
  }),
});
export const combinedSchema = z.object({
  member: memberSchema,
  relatives: z.array(relativeSchema).optional(),
});
export type CombinedSchema = z.infer<typeof combinedSchema>;
export type RelativeSchema = z.infer<typeof relativeSchema>;

export const ContributionSchema = z.object({
  amount: z.union([
    z.number(),
    z.string().transform((val, ctx) => {
      const parsed = parseFloat(val);
      if (isNaN(parsed)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Not a valid number",
        });
        return z.NEVER;
      }
      return parsed;
    })
  ]),
  type_name: z.string().min(1, "Contribution name is required"),
  start_date: z.union([
    z.date(),
    z.string().transform((val, ctx) => {
      const date = new Date(val);
      if (isNaN(date.getTime())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Not a valid date",
        });
        return z.NEVER;
      }
      return date;
    })
  ]),
  end_date: z.union([
    z.date(),
    z.string().transform((val, ctx) => {
      if (!val) return null; // Handle empty dates
      const date = new Date(val);
      if (isNaN(date.getTime())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Not a valid date",
        });
        return z.NEVER;
      }
      return date;
    })
  ]).nullable(),
  is_for_all:z.boolean(),
  is_active:z.boolean()
});
export type ContributionType=z.infer<typeof ContributionSchema>
export const paymentFormSchema = z.object({
  contribution_id: z.string(),
  contribution_type: z.string(),
  member_id: z.number().min(1, "Member is required"),
  payment_method: z.string().min(1, "Payment method is required"),
  payment_month: z.string().min(1, "Payment month is required"),
  receipt: z.string().min(1, "Receipt is required"),
  paid_amount: z.string(),
  payment_date: z.string(),
});

export type PaymentFormSchemaType = {
  contribution_id: string;
  contribution_type: string;
  member_id: number;
  payment_method: string;
  payment_month: string;
  receipt: string;
  paid_amount: string;
  payment_date: string;
};
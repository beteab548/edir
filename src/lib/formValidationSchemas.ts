import { z } from "zod";
import { isValidPhoneNumber } from "libphonenumber-js";
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
  phone_number: z
    .string()
    .min(1, { message: "Phone number is required" })
    .refine((val) => isValidPhoneNumber("+" + val), {
      message: "Invalid phone number",
    }),
  phone_number_2: z
    .string()
    .optional()
    .refine((val) => !val || isValidPhoneNumber("+" + val), {
      message: "Invalid phone number",
    }),
  bank_name: z.string(),
  bank_account_number: z.string().optional(),
  bank_account_name: z.string().optional(),
  email: z
    .string()
    .optional()
    .refine(
      (val) => !val || val === "" || z.string().email().safeParse(val).success,
      {
        message: "Invalid email address!",
      }
    ),

  email_2: z
    .string()
    .optional()
    .refine(
      (val) => !val || val === "" || z.string().email().safeParse(val).success,
      {
        message: "Invalid email address!",
      }
    ),
  document: z.string().optional(),
  document_file_id: z.string().optional(),
  image_url: z.string().optional(),
  image_file_id: z.string().optional(),
  remark: z.string().optional(),
  status: z.enum(["Active", "Inactive", "Deceased", "Left"], {
    message: "Member Status is required!",
  }),
  member_type: z.enum(["New", "Existing"], {
    message: "member status is required!",
  }),
});

export type MemberSchema = z.infer<typeof memberSchema>;
export const relativeSchema = z.object({
  id: z.number().optional(),
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

export const ContributionSchema = z
  .object({
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
      }),
    ]),
    type_name: z
      .string()
      .min(1, "Contribution name is required")
      .refine((val) => val.trim() === val, {
        message: "Name cannot have leading or trailing spaces",
      })
      .transform((val) => val.trim()),

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
      }),
    ]),
    end_date: z
      .union([
        z.date(),
        z.string().transform((val, ctx) => {
          if (!val) return null;
          const date = new Date(val);
          if (isNaN(date.getTime())) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Not a valid date",
            });
            return z.NEVER;
          }
          return date;
        }),
      ])
      .nullable(),
    is_for_all: z.boolean(),
    is_active: z.boolean(),
    mode: z.enum(["Recurring", "OneTimeWindow", "OpenEndedRecurring"]),
    months_before_inactivation: z
      .union([
        z.number().int().positive(),
        z.string().transform((val, ctx) => {
          if (!val) return undefined;
          const parsed = parseInt(val);
          if (isNaN(parsed) || parsed < 1) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Must be a positive integer",
            });
            return z.NEVER;
          }
          return parsed;
        }),
      ])
      .optional()
      .nullable(),
    penalty_amount: z.union([
      z.number(),
      z.string().transform((val, ctx) => {
        const parsed = parseFloat(val);
        if (isNaN(parsed)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Not a valid penalty amount",
          });
          return z.NEVER;
        }
        return parsed;
      }),
    ]),
    period_months: z
      .union([
        z.number().int().positive(),
        z.string().transform((val, ctx) => {
          if (!val) return undefined;
          const parsed = parseInt(val);
          if (isNaN(parsed) || parsed < 1) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Must be a positive integer",
            });
            return z.NEVER;
          }
          return parsed;
        }),
      ])
      .optional()
      .nullable(),
  })
  .refine((data) => data.mode !== "OneTimeWindow" || !!data.period_months, {
    message: "Period months is required for OneTimeWindow mode",
    path: ["period_months"],
  })
  .refine(
    (data) => {
      if (data.mode === "Recurring") {
        return data.end_date instanceof Date && !isNaN(data.end_date.getTime());
      }
      return true;
    },
    {
      message: "End date is required for Recurring mode",
      path: ["end_date"],
    }
  );

export type ContributionType = z.infer<typeof ContributionSchema>;
export const paymentFormSchema = z.object({
  contribution_id: z.string(),
  contribution_type: z.string(),
  member_id: z.number().min(1, "Member is required"),
  payment_method: z.string().min(1, "Payment method is required"),
  receipt: z.string().optional(),
  paid_amount: z.string(),
  payment_date: z.string(),
  penalty_month: z.string(),
});
export const penaltyPaymentFormSchema = z.object({
  member_id: z.number().min(1, "Member is required"),
  paid_amount: z.string().min(1, "Amount is required"),
  payment_method: z.string().min(1, "Payment method is required"),
  payment_date: z.string().min(1, "Payment date is required"),
  receipt: z.string().optional(),
  penalty_month: z.string().min(1, "Penalty month is required"),
});
export type penaltyPaymentFormSchemaType = z.infer<
  typeof penaltyPaymentFormSchema
>;
export type PaymentFormSchemaType = {
  contribution_id: string;
  contribution_type: string;
  member_id: number;
  payment_method: string;
  receipt: string;
  paid_amount: string;
  payment_date: string;
  penalty_month?: Date | undefined;
};

export const ContributionTypeSchema = z
  .object({
    type_name: z
      .string()
      .min(1, "Name is required")
      .transform((val) => val.trim())
      .refine((val) => val.length > 0, {
        message: "Name cannot be empty or only spaces",
      }),

    amount: z.number().min(0.01, "Amount must be positive"),
    mode: z.enum(["Recurring", "OneTimeWindow", "OpenEndedRecurring"]),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    period_months: z.number().optional(),
    penalty_amount: z.number().min(0, "Penalty must be 0 or more").optional(),
    months_before_inactivation: z.number().int().positive().optional(),
    is_for_all: z.boolean(),
    is_active: z.boolean(),
    member_ids: z.array(z.number()).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.mode === "Recurring") {
      if (!data.start_date) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Start date is required for Recurring mode",
          path: ["start_date"],
        });
      }
      if (!data.end_date) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "End date is required for Recurring mode",
          path: ["end_date"],
        });
      }
      if (data.penalty_amount === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Penalty amount is required for Recurring mode",
          path: ["penalty_amount"],
        });
      }
    } else if (data.mode === "OneTimeWindow") {
      if (typeof data.period_months !== "number" || data.period_months <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Period months must be a positive number for OneTimeWindow mode",
          path: ["period_months"],
        });
      }
      if (
        typeof data.months_before_inactivation !== "number" ||
        data.months_before_inactivation <= 0
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Months before inactivation must be a positive number for OneTimeWindow mode",
          path: ["months_before_inactivation"],
        });
      }
      data.penalty_amount = undefined;
    } else if (data.mode === "OpenEndedRecurring") {
      if (!data.start_date) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Start date is required for OpenEndedRecurring mode",
          path: ["start_date"],
        });
      }
      if (data.penalty_amount === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Penalty amount is required for OpenEndedRecurring mode",
          path: ["penalty_amount"],
        });
      }
      data.period_months = undefined;
    }
  })
  .transform((data) => {
    if (data.mode === "OpenEndedRecurring") {
      const { end_date, period_months, ...rest } = data;
      return { ...rest };
    }
    return data;
  });

export const penaltyFormSchema = z.object({
  member_id: z.number().min(1, "Member is required"),
  amount: z.number().min(0, "Amount must be positive"),
  missed_month: z.string(),
  generated: z.enum(["automatically", "manually"]),
  penalty_type: z.string().min(1, { message: "Penalty type is required" }),
});

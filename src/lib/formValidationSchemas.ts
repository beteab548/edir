import { z } from "zod";
import { isValidPhoneNumber } from "libphonenumber-js";
import { parseISO, isBefore, addDays, startOfDay } from "date-fns";

export const memberSchema = z.object({
  id: z.coerce.number().optional(),
  first_name: z.string().min(1, { message: "First name is required!" }),
  second_name: z.string().min(1, { message: "Second name is required!" }),
  last_name: z
    .string()
    .min(1, { message: "Last name is required!" })
    .optional(),
  profession: z.string().optional(),
  title: z.string().optional(),
  job_business: z.string().optional(),

  identification_type: z
    .string()
    .nullable()
    .optional()
    .transform((val) => (val === "" ? null : val))
    .refine(
      (val) => {
        if (val === null || val === undefined) {
          return true;
        }
        return ["FAYDA", "KEBELE_ID", "PASSPORT"].includes(val);
      },
      {
        message: "Please select a valid identification type",
      }
    ),
  identification_number: z.string().optional().nullable(),
  identification_image: z.string().optional().nullable(),
  identification_file_id: z.string().optional().nullable(),
  birth_date: z.coerce.date({ message: "Birth date is required!" }).optional(),
  citizen: z
    .string()
    .min(1, { message: "Citizenship is required!" })
    .optional(),
  registered_date: z.coerce.date().optional(),
  end_date: z.union([z.coerce.date(), z.literal("")]).optional(),
  wereda: z.string().optional(),
  zone_or_district: z.string().optional(),
  founding_member: z.boolean().optional(),
  green_area: z.string().optional(),
  block: z.string().optional(),
  marital_status: z
    .enum(["married", "single", "divorced", "widowed"], {
      message: "Marital Status is required!",
    })
    .optional(),
  kebele: z.string().optional(),
  house_number: z.string().optional(),
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
  bank_name: z.string().optional(),
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
  document: z.string().optional().nullable(),
  document_file_id: z.string().optional().nullable(),
  image_url: z.string().optional().nullable(),
  image_file_id: z.string().optional().nullable(),
  remark: z.string().optional(),
  status: z.enum(["Active", "Inactive", "Deceased", "Left"], {
    message: "Member Status is required!",
  }),
  member_type: z.enum(["New", "Existing"], {
    message: "member status is required!",
  }),
  familyId: z.coerce.number().optional(),
  isPrincipal: z.coerce.boolean().optional(),
  spouseId: z.coerce.number().optional(),
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
// In formValidationSchemas.ts

// memberSchema and relativeSchema remain the same.

// In your lib/formValidationSchemas.ts

// The memberSchema and relativeSchema remain exactly as they are.

export const familyMemberSchema = z
  .object({
    principal: memberSchema,
    // STEP 1: Make the spouse schema lenient by default.
    // .partial() makes all fields in the memberSchema optional.
    // This stops Zod from throwing errors on an incomplete spouse object
    // before our superRefine has a chance to run.
    spouse: memberSchema.partial().optional(),
    relatives: z.array(relativeSchema).optional(),
  })
  .superRefine((data, ctx) => {
    // STEP 2: Enforce the STRICT rules only when the condition is met.
    if (data.principal.marital_status === "married") {
      // Validate the spouse data against the ORIGINAL, STRICT memberSchema.
      const spouseValidation = memberSchema.safeParse(data.spouse);

      if (!spouseValidation.success) {
        // If validation fails, add the specific errors to the form context.
        spouseValidation.error.errors.forEach((err) => {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: err.message,
            // This is critical for attaching the error to the correct UI field.
            path: ["spouse", ...err.path],
          });
        });
      }
    }
  });

// Your exported types remain the same.
export type FamilyMemberSchema = z.infer<typeof familyMemberSchema>;

// ... (rest of your schemas)
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

      if (data.start_date && data.end_date) {
        const startDate = parseISO(data.start_date);
        const endDate = parseISO(data.end_date);
        const minEndDate = addDays(startDate, 1);

        if (!isBefore(startDate, endDate)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "End date must be after start date",
            path: ["end_date"],
          });
        } else if (isBefore(endDate, minEndDate)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "End date must be at least 1 day after start date",
            path: ["end_date"],
          });
        }
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

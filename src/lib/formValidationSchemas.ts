import { z } from "zod";


export const memberSchema = z.object({
  id: z.number().optional(),

  first_name: z.string().min(1, { message: "First name is required!" }),
  second_name: z.string().min(1, { message: "Second name is required!" }),
  last_name: z.string().min(1, { message: "Last name is required!" }),

  profession: z.string().min(1, { message: "Profession is required!" }),
  title: z.string().min(1, { message: "Title is required!" }),
  job_business: z.string().min(1, { message: "Job/Business is required!" }),

  id_number: z.string().min(1, { message: "ID number is required!" }),

  birth_date: z.coerce.date({ message: "Birth date is required!" }),
  citizen: z.string().min(1, { message: "Citizenship is required!" }),

  joined_date: z.coerce.date().optional(), 
  end_date: z.coerce.date({ message: "End date is required!" }),

  address: z.string().min(1, { message: "Address is required!" }),

  sex: z.enum(["Male", "Female"], { message: "Sex is required!" }),

  phone_number: z.string().min(1, { message: "Phone number is required!" }),

  document: z.string().min(1, { message: "Document field is required!" }),
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



export const subjectSchema = z.object({
  id: z.coerce.number().optional(),
  name: z.string().min(1, { message: "Subject name is required!" }),
  teachers: z.array(z.string()), //teacher ids
});

export type SubjectSchema = z.infer<typeof subjectSchema>;

export const classSchema = z.object({
  id: z.coerce.number().optional(),
  name: z.string().min(1, { message: "Subject name is required!" }),
  capacity: z.coerce.number().min(1, { message: "Capacity name is required!" }),
  gradeId: z.coerce.number().min(1, { message: "Grade name is required!" }),
  supervisorId: z.coerce.string().optional(),
});

export type ClassSchema = z.infer<typeof classSchema>;

export const teacherSchema = z.object({
  id: z.string().optional(),
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters long!" })
    .max(20, { message: "Username must be at most 20 characters long!" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long!" })
    .optional()
    .or(z.literal("")),
  name: z.string().min(1, { message: "First name is required!" }),
  surname: z.string().min(1, { message: "Last name is required!" }),
  email: z
    .string()
    .email({ message: "Invalid email address!" })
    .optional()
    .or(z.literal("")),
  phone: z.string().optional(),
  address: z.string(),
  img: z.string().optional(),
  bloodType: z.string().min(1, { message: "Blood Type is required!" }),
  birthday: z.coerce.date({ message: "Birthday is required!" }),
  sex: z.enum(["MALE", "FEMALE"], { message: "Sex is required!" }),
  subjects: z.array(z.string()).optional(), // subject ids
});

export type TeacherSchema = z.infer<typeof teacherSchema>;

export const studentSchema = z.object({
  id: z.string().optional(),
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters long!" })
    .max(20, { message: "Username must be at most 20 characters long!" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long!" })
    .optional()
    .or(z.literal("")),
  name: z.string().min(1, { message: "First name is required!" }),
  surname: z.string().min(1, { message: "Last name is required!" }),
  email: z
    .string()
    .email({ message: "Invalid email address!" })
    .optional()
    .or(z.literal("")),
  phone: z.string().optional(),
  address: z.string(),
  img: z.string().optional(),
  bloodType: z.string().min(1, { message: "Blood Type is required!" }),
  birthday: z.coerce.date({ message: "Birthday is required!" }),
  sex: z.enum(["MALE", "FEMALE"], { message: "Sex is required!" }),
  gradeId: z.coerce.number().min(1, { message: "Grade is required!" }),
  classId: z.coerce.number().min(1, { message: "Class is required!" }),
  parentId: z.string().min(1, { message: "Parent Id is required!" }),
});

export type StudentSchema = z.infer<typeof studentSchema>;

export const examSchema = z.object({
  id: z.coerce.number().optional(),
  title: z.string().min(1, { message: "Title name is required!" }),
  startTime: z.coerce.date({ message: "Start time is required!" }),
  endTime: z.coerce.date({ message: "End time is required!" }),
  lessonId: z.coerce.number({ message: "Lesson is required!" }),
});

export type ExamSchema = z.infer<typeof examSchema>;
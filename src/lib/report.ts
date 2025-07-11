import prisma from "@/lib/prisma";
import { ContributionMode, Member, MemberType } from "@prisma/client";

const validStatuses = ["Active", "Inactive", "Left", "Deceased"] as const;
type Status = (typeof validStatuses)[number];
const validMemberStatuses = ["New", "Existing"] as const;
type MemberStatus = (typeof validMemberStatuses)[number];
type MemberForSearch = Pick<
  Member,
  "first_name" | "second_name" | "last_name" | "phone_number" | "custom_id"
>;
function isValidStatus(status: string): status is Status {
  return validStatuses.includes(status as Status);
}
function isValidMemberStatus(memberType: string): memberType is MemberStatus {
  return validMemberStatuses.includes(memberType as MemberStatus);
}
function matchesSearch(m: MemberForSearch, search: string) {
  const fullName =
    `${m.first_name} ${m.second_name} ${m.last_name}`.toLowerCase();
  const normalizedPhone = m.phone_number?.replace(/^(\+?251)/, "0");
  const n = search.toLowerCase().replace(/^(\+?251)/, "0");

  return (
    fullName.includes(n) ||
    m.custom_id?.toLowerCase().includes(n) ||
    normalizedPhone?.includes(n)
  );
}

export async function getFilteredMembers({
  name,
  from,
  to,
  status,
  profession,
  member_type,
  house_number,
  title,
}: {
  name?: string;
  from?: string;
  to?: string;
  status?: Status;
  profession?: string;
  member_type?: MemberType;
  house_number?: string;
  title?: string;
}) {
  const filters: any = {};

  if (status && isValidStatus(status)) {
    filters.status = status;
  }

  if (profession) {
    filters.profession = { contains: profession, mode: "insensitive" };
  }

  if (member_type && isValidMemberStatus(member_type)) {
    filters.member_type = member_type;
  }

  if (house_number) {
    filters.house_number = { contains: house_number, mode: "insensitive" };
  }

  if (title) {
    filters.title = { contains: title, mode: "insensitive" };
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const fromDate =
    from && !isNaN(Date.parse(from)) ? new Date(from) : startOfMonth;
  const toDate = to && !isNaN(Date.parse(to)) ? new Date(to) : endOfMonth;

  filters.joined_date = {
    gte: fromDate,
    lte: toDate,
  };

  // Fetch initial filtered members from Prisma
  const members = await prisma.member.findMany({
    where: filters,
    orderBy: { created_at: "desc" },
    select: {
      id: true,
      first_name: true,
      second_name: true,
      last_name: true,
      phone_number: true,
      custom_id: true,
      joined_date: true,
      status: true,
      house_number: true,
      member_type: true,
      created_at: true,
      birth_date: true,
      zone_or_district: true,
      bank_account_name: true,
      bank_account_number: true,
      bank_name: true,
      email: true,
      email_2: true,
      job_business: true,
      id_number: true,
      kebele: true,
      profession: true,
      wereda: true,
      citizen: true,
      phone_number_2: true,
      sex: true,
      title: true,
      remark: true,
    },
  });

  const filtered = name
    ? members.filter((m) => matchesSearch(m, name))
    : members;

  return filtered;
}

export async function getFilteredPenalties({
  name,
  from,
  to,
  status,
  waived,
  penalty_type,
}: {
  name?: string;
  from?: string;
  to?: string;
  status?: string;
  waived?: string;
  penalty_type?: string;
}) {
  const filters: any = {};
  const fromDate = from && !isNaN(Date.parse(from)) ? new Date(from) : null;
  const toDate = to && !isNaN(Date.parse(to)) ? new Date(to) : null;
  if (waived === "true") filters.waived = true;
  else if (waived === "false") filters.waived = false;
  if (penalty_type) filters.penalty_type = penalty_type;
  if (fromDate && toDate) {
    filters.missed_month = { gte: fromDate, lte: toDate };
  } else if (fromDate) {
    filters.missed_month = { gte: fromDate };
  } else if (toDate) {
    filters.missed_month = { lte: toDate };
  }
  if (status === "Paid") {
    filters.is_paid = true;
  } else if (status === "Partially") {
    filters.is_paid = false;
    filters.paid_amount = { gt: 0 };
  } else if (status === "Unpaid") {
    filters.is_paid = false;
    filters.paid_amount = { equals: 0 };
  }
  // Fetch all penalties matching filters
  const penalties = await prisma.penalty.findMany({
    where: {
      ...filters,
      member: {
        status: "Active",
      },
    },
    include: {
      member: true,
      penaltyType: true,
    },
    orderBy: {
      applied_at: "desc",
    },
  });
  // Filter by full name, custom_id, or phone_number in JS
  // Filter by full name, custom_id, or phone_number in JS
  const filtered = name
    ? penalties.filter((m) => matchesSearch(m.member, name))
    : penalties;

  return filtered;
}

const validModes: ContributionMode[] = [
  "OpenEndedRecurring",
  "OneTimeWindow",
  "Recurring",
];

export const getFilteredContributions = async ({
  name,
  from,
  to,
  type,
  status,
  contribution_type,
}: {
  name?: string;
  from?: string;
  to?: string;
  type?: string;
  status?: string;
  contribution_type?: string;
}) => {
  const fromDate = from ? new Date(from) : undefined;
  const toDate = to ? new Date(to) : undefined;

  const whereClause: any = {
    ContributionSchedule: {
      some: {
        ...(fromDate && { month: { gte: fromDate } }),
        ...(toDate && {
          month: {
            ...(fromDate ? { gte: fromDate } : {}),
            lte: toDate,
          },
        }),
        ...(status === "Paid" && { paid_at: { not: null } }),
        ...(status === "Unpaid" && { paid_amount: { equals: 0 } }),
        ...(status === "Partially" && {
          paid_amount: { gt: 0 },
          paid_at: null,
        }),
      },
    },
  };

  // Add contributionType filter if needed
  if (type || contribution_type) {
    whereClause.contributionType = {
      is: {
        ...(validModes.includes(type as ContributionMode) && {
          mode: type as ContributionMode,
        }),
        ...(contribution_type && {
          name: { contains: contribution_type, mode: "insensitive" },
        }),
      },
    };
  }

  const contributions = await prisma.contribution.findMany({
    where: whereClause,
    include: {
      member: true,
      contributionType: true,
      ContributionSchedule: true,
    },
  });

  const filtered = name
    ? contributions.filter((m) => matchesSearch(m.member, name))
    : contributions;

  return filtered;
};

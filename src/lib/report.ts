import prisma from "@/lib/prisma";
import {
  Balance,
  Contribution,
  ContributionMode,
  ContributionSchedule,
  ContributionType,
  Member,
  MemberType,
  Prisma,
} from "@prisma/client";

const validStatuses = ["Active", "Inactive", "Left", "Deceased"] as const;
const validMartialStatuses = [
  "married",
  "widowed",
  "single",
  "divorced",
] as const;
type Status = (typeof validStatuses)[number];
type MartialStatuses = (typeof validMartialStatuses)[number];
const validMemberStatuses = ["New", "Existing"] as const;
type MemberStatus = (typeof validMemberStatuses)[number];
type MemberForSearch = Pick<
  Member,
  "first_name" | "second_name" | "last_name" | "phone_number" | "custom_id"
>;
function isValidStatus(status: string): status is Status {
  return validStatuses.includes(status as Status);
}
function isValidMartialStatus(
  martialstatus: string
): martialstatus is MartialStatuses {
  return validMartialStatuses.includes(martialstatus as MartialStatuses);
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
function convertDecimalToNumber(obj: any): any {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === "object") {
    if ("toNumber" in obj && typeof obj.toNumber === "function") {
      // Prisma Decimal detected
      return obj.toNumber();
    }

    if (obj instanceof Date) {
      // Preserve Date objects without converting
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(convertDecimalToNumber);
    }

    // For regular objects, recurse keys
    const newObj: any = {};
    for (const key in obj) {
      newObj[key] = convertDecimalToNumber(obj[key]);
    }
    return newObj;
  }

  return obj;
}

export async function getFilteredMembers({
  name,
  from,
  to,
  status,
  profession,
  member_type,
  green_area,
  block,
  house_number,
  title,
  marital_status,
  onlyPrincipals, // <-- STEP 1: ADD THE NEW PARAMETER
}: {
  name?: string;
  from?: string;
  to?: string;
  status?: Status;
  profession?: string;
  member_type?: MemberType;
  green_area?: string;
  block?: string;
  house_number?: string;
  title?: string;
  marital_status?: string;
  onlyPrincipals?: string; // It will be a string "true" from the URL
}) {
  // Start with a correctly typed Prisma WhereInput object
  const filters: Prisma.MemberWhereInput = {};

  // --- STEP 2: CONDITIONALLY APPLY THE 'isPrincipal' FILTER ---
  // If the checkbox was checked, the URL param will be 'true'.
  if (onlyPrincipals === "true") {
    filters.isPrincipal = true;
  }

  // --- The rest of your filter-building logic remains the same ---
  if (status && isValidStatus(status)) {
    filters.status = status;
  }
  if (marital_status && isValidMartialStatus(marital_status)) {
    filters.marital_status = marital_status;
  }

  if (profession) {
    filters.profession = { contains: profession, mode: "insensitive" };
  }

  if (member_type && isValidMemberStatus(member_type)) {
    filters.member_type = member_type;
  }

  // ... (the rest of your filters for house_number, green_area, block, title)

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const fromDate =
    from && !isNaN(Date.parse(from)) ? new Date(from) : startOfMonth;
  const toDate = to && !isNaN(Date.parse(to)) ? new Date(to) : endOfMonth;

  filters.registered_date = {
    gte: fromDate,
    lte: toDate,
  };

  // The 'name' filter is more complex, so we apply it after the main query.
  // If performance on large datasets becomes an issue, this part could also be
  // moved into the main Prisma query's `where` clause.
  if (name) {
    const words = name.trim().split(/\s+/);
    filters.AND = words.map((word) => ({
      OR: [
        { first_name: { contains: word, mode: "insensitive" } },
        { second_name: { contains: word, mode: "insensitive" } },
        { last_name: { contains: word, mode: "insensitive" } },
        { custom_id: { contains: word, mode: "insensitive" } },
        { phone_number: { contains: word, mode: "insensitive" } },
      ],
    }));
  }

  // Fetch filtered members from Prisma using the completed 'filters' object
  const members = await prisma.member.findMany({
    where: filters, // The 'where' clause now includes the conditional 'isPrincipal' filter
    orderBy: { id: "asc" },
    // The select statement is fine as is
    select: {
      id: true,
      first_name: true,
      second_name: true, // Add this
      last_name: true, // Add this
      phone_number: true, // Add this
      registered_date: true, // Add this
      status: true, // Add this
      green_area: true,
      block: true,
      house_number: true,
      member_type: true,
      birth_date: true,
      zone_or_district: true,
      bank_account_name: true,
      bank_account_number: true,
      bank_name: true,
      email: true,
      email_2: true,
      job_business: true,
      identification_number: true,
      kebele: true,
      profession: true,
      wereda: true,
      citizen: true,
      phone_number_2: true,
      sex: true,
      marital_status: true,
      title: true,
      remark: true,
      custom_id: true,
    },
  });

  // Since the 'name' filter was moved into the Prisma query, this post-filtering is no longer needed.
  // const filtered = name
  //   ? members.filter((m) => matchesSearch(m, name))
  //   : members;

  // The result from Prisma is already fully filtered.
  return members;
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
  const fromDate = from && !isNaN(Date.parse(from)) ? new Date(from) : null;
  const toDate = to && !isNaN(Date.parse(to)) ? new Date(to) : null;

  // --- Start with the essential, non-negotiable filters ---
  const filters: Prisma.PenaltyWhereInput = {
    member: {
      status: "Active",
      isPrincipal: true, // <-- CORRECTED: Used correct case 'isPrincipal'
    },
  };

  // --- Conditionally add the other filters to the object ---
  if (waived === "true") {
    filters.waived = true;
  } else if (waived === "false") {
    filters.waived = false;
  }

  if (penalty_type) {
    filters.penalty_type = penalty_type;
  }

  if (fromDate && toDate) {
    filters.missed_month = { gte: fromDate, lte: toDate };
  } else if (fromDate) {
    filters.missed_month = { gte: fromDate };
  } else if (toDate) {
    filters.missed_month = { lte: toDate };
  }

  if (status === "Paid") {
    filters.is_paid = true;
  } else if (status === "Partially Paid") {
    filters.is_paid = false;
    filters.paid_amount = { gt: 0 };
  } else if (status === "Unpaid") {
    filters.is_paid = false;
    filters.paid_amount = { equals: 0 };
  }

  // Fetch all penalties matching the complete set of filters
  const penaltiesRaw = await prisma.penalty.findMany({
    where: filters, // The where clause is now clean and correct
    include: { member: true, penaltyType: true },
    orderBy: { id: "asc" },
  });

  // Convert Decimal fields to number recursively
  const penalties = penaltiesRaw.map(convertDecimalToNumber);

  // Then filter by name if needed
  // Note: For better performance on large datasets, this name filter could also be moved into the main Prisma query.
  const filtered = name
    ? penalties.filter((p) => matchesSearch(p.member, name))
    : penalties;

  return filtered;
}

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
  const validModes = ["Recurring", "OneTimeWindow", "OpenEndedRecurring"];
  const fromDate = from ? new Date(from) : undefined;
  const toDate = to ? new Date(to) : undefined;

  // --- THE FIX IS HERE ---
  // We initialize the whereClause with the essential, non-negotiable filter:
  // the contribution must belong to a principal member.
  const whereClause: Prisma.ContributionWhereInput = {
    member: {
      isPrincipal: true,
    },
  };

  // Now, we conditionally add the other filters to this object.
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

  // The main database query is now correctly filtered at the source.
  const contributionsRaw: (Contribution & {
    member: Member;
    contributionType: ContributionType;
    ContributionSchedule: ContributionSchedule[];
    Balance: Balance[];
  })[] = await prisma.contribution.findMany({
    where: whereClause,
    include: {
      member: true,
      contributionType: true,
      ContributionSchedule: true,
      Balance: true,
    },
    orderBy: { id: "asc" },
  });

  // The rest of your function logic for in-memory filtering is correct
  // and will now operate on the pre-filtered set of principal-only contributions.

  // Filter schedules within the date range
  const filteredSchedulesContributions = contributionsRaw.map(
    (contribution) => {
      const filteredSchedules = contribution.ContributionSchedule.filter(
        (schedule) => {
          const month = new Date(schedule.month);
          const isAfterFrom = fromDate ? month >= fromDate : true;
          const isBeforeTo = toDate ? month <= toDate : true;
          return isAfterFrom && isBeforeTo;
        }
      );

      return {
        ...contribution,
        ContributionSchedule: filteredSchedules,
      };
    }
  );

  // Convert decimals
  const contributions = filteredSchedulesContributions.map(
    convertDecimalToNumber
  );

  // Filter by name if provided
  const filteredByName = name
    ? contributions.filter((c) => matchesSearch(c.member, name))
    : contributions;

  // Filter by status
  const filteredByStatus = status
    ? filteredByName.filter((contribution) => {
        const expected = contribution.ContributionSchedule.reduce(
          (sum: any, s: { expected_amount: any }) => sum + s.expected_amount,
          0
        );
        const paid = contribution.ContributionSchedule.reduce(
          (sum: any, s: { paid_amount: any }) => sum + s.paid_amount,
          0
        );

        if (status === "Paid") return paid >= expected && expected > 0;
        if (status === "Partially Paid") return paid > 0 && paid < expected;
        if (status === "Unpaid") return paid === 0 && expected > 0;

        return true;
      })
    : filteredByName;

  return filteredByStatus;
};

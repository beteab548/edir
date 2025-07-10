import prisma from "@/lib/prisma";

function isValidYear(year: string) {
  return /^\d{4}$/.test(year);
}

function isValidMonth(month: string) {
  const monthNum = Number(month);
  return monthNum >= 1 && monthNum <= 12;
}
const validStatuses = ["Active", "Inactive", "Left", "Deceased"] as const;
type Status = (typeof validStatuses)[number];

function isValidStatus(status: string): status is Status {
  return validStatuses.includes(status as Status);
}

export async function getFilteredMembers({
  name,
  year,
  month,
  status,
}: {
  name?: string;
  year?: string;
  month?: string;
  status?: Status;
}) {
  const filters: any = {};

  // Name/ID/Phone filter
  if (name) {
    filters.OR = [
      { first_name: { contains: name, mode: "insensitive" } },
      { second_name: { contains: name, mode: "insensitive" } },
      { last_name: { contains: name, mode: "insensitive" } },
      { phone_number: { contains: name, mode: "insensitive" } },
      { custom_id: { contains: name, mode: "insensitive" } },
    ];
  }
  if (status && isValidStatus(status)) {
    filters.status = status || "Active";
  }
  // Date filter with validation
  if (year && isValidYear(year)) {
    const validMonth =
      month && isValidMonth(month) ? month.padStart(2, "0") : "01";

    const start = new Date(`${year}-${validMonth}-01`);
    const end = new Date(start);
    end.setMonth(start.getMonth() + (month && isValidMonth(month) ? 1 : 12));

    filters.joined_date = {
      gte: start,
      lt: end,
    };
  }

  return prisma.member.findMany({
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
    },
  });
}

import prisma from "@/lib/prisma";

const validStatuses = ["Active", "Inactive", "Left", "Deceased"] as const;
type Status = (typeof validStatuses)[number];

function isValidStatus(status: string): status is Status {
  return validStatuses.includes(status as Status);
}

export async function getFilteredMembers({
  name,
  from,
  to,
  status,
}: {
  name?: string;
  from?: string;
  to?: string;
  status?: string;
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

  // Status filter
  if (status && isValidStatus(status)) {
    filters.status = status;
  } 

  // Date filtering: default to this month if from/to not provided
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
}

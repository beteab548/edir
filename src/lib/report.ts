import prisma from "@/lib/prisma";
import { MemberType } from "@prisma/client";

const validStatuses = ["Active", "Inactive", "Left", "Deceased"] as const;
type Status = (typeof validStatuses)[number];
const validMemberStatuses = ["New", "Existing"] as const;
type MemberStatus = (typeof validMemberStatuses)[number];

function isValidStatus(status: string): status is Status {
  return validStatuses.includes(status as Status);
}
function isValidMemberStatus(memberType: string): memberType is MemberStatus {
  return validMemberStatuses.includes(memberType as MemberStatus);
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

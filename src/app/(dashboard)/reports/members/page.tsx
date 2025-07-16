export const dynamic = "force-dynamic";

import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getFilteredMembers } from "@/lib/report";
import { MemberType, Status } from "@prisma/client";
import ReportShell from "@/components/report/ReportShell";
import FilterBar from "@/components/report/FilterBar";

interface SearchParams {
  searchParams: {
    query?: string;
    from?: string;
    to?: string;
    status?: Status | string;
    profession?: string;
    member_type?: string;
    house_number?: string;
    title?: string;
  };
}

export default async function ReportPage({ searchParams }: SearchParams) {
  const user = await currentUser();
  if (!user) return redirect("/sign-in");

  const members = await getFilteredMembers({
    name: searchParams.query,
    from: searchParams.from,
    to: searchParams.to,
    status: searchParams.status as Status,
    profession: searchParams.profession,
    member_type: searchParams.member_type as MemberType,
    house_number: searchParams.house_number,
    title: searchParams.title,
  });
  const processedData = members.map((m) => ({
    ID: m.custom_id,
    "Full Name": `${m.first_name} ${m.second_name} ${m.last_name}`,
    Phone: m.phone_number.replace(/^251/, "0"),
    "Join Date": new Date(m.joined_date).toLocaleDateString(),
    status: m.status,
    house_number: m.house_number,
    member_type: m.member_type,
    birth_date: m.birth_date
      ? new Date(m.birth_date).toLocaleDateString()
      : "N/A",

    zone_or_district: m.zone_or_district,
    bank_account_name: m.bank_account_name,
    bank_account_number: m.bank_account_number,
    bank_name: m.bank_name,
    email: m.email,
    email_2: m.email_2,
    job_business: m.job_business,
    id_number: m.id_number,
    kebele: m.kebele,
    profession: m.profession,
    wereda: m.wereda,
    citizen: m.citizen,
    phone_number_2: m.phone_number.replace(/^251/, "0").replace(/^\+/, "0"),
    sex: m.sex,
    title: m.title,
    remark: m.remark,
  }));

  return (
    <ReportShell
      searchparams={searchParams}
      title="Member Report"
      filename="member_report"
      data={processedData}
      columns={[
        {
          label: "ID",
          accessor: "ID",
          width: "w-[300px]",
          printWidth: "print:w-[100px]",
        },
        {
          label: "Full Name",
          accessor: "Full Name",
          width: "w-auto",
          printWidth: "print:w-[200px]",
        },
        {
          label: "Title",
          accessor: "title",
          width: "w-[100px]",
          printWidth: "print:w-[100px]",
        },
        {
          label: "job_business",
          accessor: "job_business",
          width: "w-[100px]",
          printWidth: "print:w-[100px]",
        },
        {
          label: "profession",
          accessor: "profession",
          width: "w-[100px]",
          printWidth: "print:w-[100px]",
        },
        {
          label: "Phone number 1",
          accessor: "Phone",
          width: "w-[100px]",
          printWidth: "print:w-[100px]",
        },
        {
          label: "phone number 2",
          accessor: "phone_number_2",
          width: "w-[100px]",
          printWidth: "print:w-[100px]",
        },
        {
          label: "Join Date",
          accessor: "Join Date",
          width: "w-[100px]",
          printWidth: "print:w-[100px]",
        },
        {
          label: "Status",
          accessor: "status",
          width: "w-[100px]",
          printWidth: "print:w-[100px]",
        },
        {
          label: "sex",
          accessor: "sex",
          width: "w-[100px]",
          printWidth: "print:w-[100px]",
        },
        {
          label: "id_number",
          accessor: "id_number",
          width: "w-[100px]",
          printWidth: "print:w-[100px]",
        },
        {
          label: "Member Type",
          accessor: "member_type",
          width: "w-[100px]",
          printWidth: "print:w-[100px]",
        },
        {
          label: "Birth Date",
          accessor: "birth_date",
          width: "w-[100px]",
          printWidth: "print:w-[100px]",
        },
        {
          label: "zone or district",
          accessor: "zone_or_district",
          width: "w-[150px]",
        },
        {
          label: "woreda",
          accessor: "wereda",
          width: "w-[150px]",
          printWidth: "print:w-[100px]",
        },
        {
          label: "kebele",
          accessor: "kebele",
          width: "w-[150px]",
          printWidth: "print:w-[100px]",
        },
        {
          label: "citizen",
          accessor: "citizen",
          width: "w-[150px]",
          printWidth: "print:w-[100px]",
        },
        {
          label: "email",
          accessor: "email",
          width: "w-[150px]",
          printWidth: "print:w-[100px]",
        },
        {
          label: "email 2",
          accessor: "email_2",
          width: "w-[150px]",
          printWidth: "print:w-[100px]",
        },
        {
          label: "House Number",
          accessor: "house_number",
          width: "w-[150px]",
          printWidth: "print:w-[100px]",
        },
        {
          label: "bank Account Name",
          accessor: "bank_account_name",
          width: "w-[150px]",
          printWidth: "print:w-[100px]",
        },
        {
          label: "bank Account number",
          accessor: "bank_account_number",
          width: "w-[150px]",
          printWidth: "print:w-[100px]",
        },
        {
          label: "bank Name",
          accessor: "bank_name",
          width: "w-[150px]",
          printWidth: "print:w-[100px]",
        },
        {
          label: "Remark",
          accessor: "remark",
          width: "w-[150px]",
          printWidth: "print:w-[100px]",
        },
      ]}
    >
      <FilterBar type="members" />
    </ReportShell>
  );
}

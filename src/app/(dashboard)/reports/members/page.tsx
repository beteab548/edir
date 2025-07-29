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
    green_area?: string;
    block?: string;
    marital_status?: string;
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
    green_area: searchParams.green_area,
    block: searchParams.block,
    title: searchParams.title,
    marital_status: searchParams.marital_status,
  });
  const processedData = members.map((m: any) => ({
    ID: m.custom_id,
    "Full Name": `${m.first_name} ${m.second_name} ${m.last_name}`,
    Phone: m.phone_number ? m.phone_number.replace(/^251/, "0") : "",
    "Registered Date": new Date(m.registered_date).toLocaleDateString(),
    status: m.status,
    green_area: m.green_area,
    block: m.block,
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
    id_number: m.identification_number,
    kebele: m.kebele,
    profession: m.profession,
    wereda: m.wereda,
    citizen: m.citizen,
    phone_number_2: m.phone_number
      ? m.phone_number.replace(/^251/, "0").replace(/^\+/, "0")
      : "",
    sex: m.sex,
    marital_status: m.marital_status,
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
          width: "w-[95px]",
          printWidth: "print:w-[100px]",
        },
        {
          label: "Full Name",
          accessor: "Full Name",
          width: "w-auto",

          printWidth: "print:w-[300px]",
        },
        {
          label: "Title",
          accessor: "title",
          width: "w-auto",
          printWidth: "print:w-[100px]",
        },
        {
          label: "job Business",
          accessor: "job_business",
          width: "w-auto",
          printWidth: "print:w-[100px]",
        },
        {
          label: "profession",
          accessor: "profession",
          width: "w-auto",
          printWidth: "print:w-[100px]",
        },
        {
          label: "Phone no 1",
          accessor: "Phone",
          width: "w-auto",
          printWidth: "print:w-[100px]",
        },
        {
          label: "phone no 2",
          accessor: "phone_number_2",
          width: "w-auto",
          printWidth: "print:w-[100px]",
        },
        {
          label: "Registerd Date",
          accessor: "Registered Date",
          width: "w-auto",
          printWidth: "print:w-[100px]",
        },
        {
          label: "Status",
          accessor: "status",
          width: "w-auto",
          printWidth: "print:w-[100px]",
        },
        {
          label: "Sex",
          accessor: "sex",
          width: "w-auto",
          printWidth: "print:w-[100px]",
        },
        {
          label: "Martial Status",
          accessor: "marital_status",
          width: "w-auto",
          printWidth: "print:w-[100px]",
        },
        {
          label: "Id No",
          accessor: "id_number",
          width: "w-auto",
          printWidth: "print:w-[100px]",
        },
        {
          label: "Member Type",
          accessor: "member_type",
          width: "w-auto",
          printWidth: "print:w-[100px]",
        },
        {
          label: "Birth Date",
          accessor: "birth_date",
          width: "w-auto",
          printWidth: "print:w-[100px]",
        },
        {
          label: "Zone/District",
          accessor: "zone_or_district",
          width: "w-auto",
        },
        {
          label: "Woreda",
          accessor: "wereda",
          width: "w-auto",
          printWidth: "print:w-[100px]",
        },
        {
          label: "Kebele",
          accessor: "kebele",
          width: "w-auto",
          printWidth: "print:w-[100px]",
        },
        {
          label: "Green Area",
          accessor: "green_area",
          width: "w-auto",
          printWidth: "print:w-[100px]",
        },
        {
          label: "Block",
          accessor: "block",
          width: "w-auto",
          printWidth: "print:w-[100px]",
        },
        {
          label: "House Number",
          accessor: "house_number",
          width: "w-auto",
          printWidth: "print:w-[100px]",
        },
        {
          label: "Citizen",
          accessor: "citizen",
          width: "w-auto",
          printWidth: "print:w-[100px]",
        },
        {
          label: "Email",
          accessor: "email",
          width: "w-auto",
          printWidth: "print:w-[100px]",
        },
        {
          label: "Email No 2",
          accessor: "email_2",
          width: "w-auto",
          printWidth: "print:w-[100px]",
        },

        {
          label: "bank Account Name",
          accessor: "bank_account_name",
          width: "w-auto",
          printWidth: "print:w-[100px]",
        },
        {
          label: "bank Account No",
          accessor: "bank_account_number",
          width: "w-auto",
          printWidth: "print:w-[100px]",
        },
        {
          label: "Bank Name",
          accessor: "bank_name",
          width: "w-auto",
          printWidth: "print:w-[100px]",
        },
        {
          label: "Remark",
          accessor: "remark",
          width: "w-auto",
          printWidth: "print:w-[100px]",
        },
      ]}
    >
      <FilterBar type="members" />
    </ReportShell>
  );
}

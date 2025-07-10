import ReportShell from "@/components/report/ReportShell";
import FilterBar from "@/components/report/FilterBar";
import { Member } from "@prisma/client";
export default function MemberReport({ members }: { members: any[] }) {
  const processedData = members.map((m: Member) => ({
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
      title="Member Report"
      filename="member_report"
      data={processedData}
      columns={[
        { label: "ID", accessor: "ID",width: "100px" },
        { label: "Full Name", accessor: "Full Name",width: "w-[100px]" },
        { label: "Title", accessor: "title",width: "w-[100px]" },
        { label: "job_business", accessor: "job_business",width: "w-[100px]" },
        { label: "profession", accessor: "profession",width: "w-[100px]" },
        { label: "Phone number 1", accessor: "Phone",width: "w-[100px]" },
        { label: "phone number 2", accessor: "phone_number_2",width: "w-[100px]" },
        { label: "Join Date", accessor: "Join Date",width: "w-[100px]" },
        { label: "Status", accessor: "status",width: "w-[100px]" },
        { label: "sex", accessor: "sex",width: "w-[100px]" },
        { label: "id_number", accessor: "id_number",width: "w-[100px]" },
        { label: "Member Type", accessor: "member_type" ,width: "w-[100px]"},
        { label: "Birth Date", accessor: "birth_date",width: "w-[100px]" },
        { label: "zone or district", accessor: "zone_or_district" ,width: "w-[150px]"},
        { label: "woreda", accessor: "wereda" ,width: "w-[150px]"},
        { label: "kebele", accessor: "kebele",width: "w-[150px]" },
        { label: "citizen", accessor: "citizen",width: "w-[150px]" },
        { label: "email", accessor: "email",width: "w-[150px]" },
        { label: "email 2", accessor: "email_2",width: "w-[150px]" },
        { label: "House Number", accessor: "house_number",width: "w-[150px]" },
        { label: "bank Account Name", accessor: "bank_account_name" ,width: "w-[150px]"},
        { label: "bank Account number", accessor: "bank_account_number",width: "w-[150px]" },
        { label: "bank Name", accessor: "bank_name",width: "w-[150px]" },
        { label: "Remark", accessor: "remark",width: "w-[150px]" },
      ]}
    >
      <FilterBar />
    </ReportShell>
  );
}

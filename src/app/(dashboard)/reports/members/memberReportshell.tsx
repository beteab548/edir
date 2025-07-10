import ReportShell from "@/components/report/ReportShell";
import FilterBar from "@/components/report/FilterBar";
import { Member } from "@prisma/client";
export default function MemberReport({ members }: { members: any[] }) {
  const processedData = members.map((m: Member) => ({
    ID: m.custom_id,
    "Full Name": `${m.first_name} ${m.second_name} ${m.last_name}`,
    Phone: m.phone_number.replace(/^251/, "0"),
    "Join Date": new Date(m.joined_date).toUTCString(),
    status: m.status,
  }));
  return (
    <ReportShell
      title="Member Report"
      filename="member_report"
      data={processedData}
      columns={[
        { label: "ID", accessor: "ID" },
        { label: "Full Name", accessor: "Full Name" },
        { label: "Phone", accessor: "Phone" },
        { label: "Join Date", accessor: "Join Date" },
        { label: "Status", accessor: "status" },
      ]}
    >
      <FilterBar />
    </ReportShell>
  );
}

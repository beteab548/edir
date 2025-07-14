import FilterBar from "@/components/report/FilterBar";
import ReportShell from "@/components/report/ReportShell";
import { getFilteredContributions } from "@/lib/report";
import { currentUser } from "@clerk/nextjs/server";
import { format } from "date-fns";
import { redirect } from "next/navigation";
interface SearchParams {
  searchParams: {
    query?: string;
    from?: string;
    to?: string;
    type?: string;
    status?: string;
    contribution_type: string;
  };
}

export default async function ContributionReportPage({
  searchParams,
}: SearchParams) {
  const user = await currentUser();
  if (!user) return redirect("/sign-in");

  const contributions = await getFilteredContributions({
    name: searchParams.query,
    from: searchParams.from,
    to: searchParams.to,
    type: searchParams.type,
    status: searchParams.status,
    contribution_type: searchParams.contribution_type,
  });

  const processed = contributions.map((c) => {
    const expected = c.ContributionSchedule.reduce(
      (sum: number, s: { expected_amount: any }) =>
        sum + Number(s.expected_amount),
      0
    );
    const paid = c.ContributionSchedule.reduce(
      (sum: number, s: { paid_amount: any }) => sum + Number(s.paid_amount),
      0
    );

    const m = c.member;
    return {
      ID: m.custom_id,
      "Full Name": `${m.first_name} ${m.second_name} ${m.last_name}`,
      Phone: m.phone_number.replace(/^251/, "0"),
      "Contribution Type": `${c.contributionType.mode} /${c.contributionType.name}`,
      "Expected Amount": expected,
      "Paid Amount": paid,
      "Remaining Amount": expected - paid,
      Status:
        expected === paid ? "Paid" : paid > 0 ? "Partially Paid" : "Unpaid",
    };
  });

  const totalExpected = processed.reduce(
    (sum, row) => sum + row["Expected Amount"],
    0
  );
  const totalPaid = processed.reduce((sum, row) => sum + row["Paid Amount"], 0);
  const totalRemaining = totalExpected - totalPaid;

  return (
    <ReportShell
    title="Contribution Report"
    filename="contribution_report"
    data={processed}
      columns={[
        { label: "ID", accessor: "ID" },
        { label: "Full Name", accessor: "Full Name" },
        { label: "Phone", accessor: "Phone" },
        { label: "Contribution Type", accessor: "Contribution Type" },
        { label: "Expected Amount", accessor: "Expected Amount" },
        { label: "Paid Amount", accessor: "Paid Amount" },
        { label: "Remaining Amount / balance", accessor: "Remaining Amount" },
        { label: "Status", accessor: "Status" },
      ]}
      summaryRow={{
        "Expected Amount": totalExpected,
        "Paid Amount": totalPaid,
        "Remaining Amount": totalRemaining,
      }}
      >
      <FilterBar type="contributions" />
    </ReportShell>
  );
}

import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getFilteredPenalties } from "@/lib/report";
import ReportShell from "@/components/report/ReportShell";
import FilterBar from "@/components/report/FilterBar";

interface SearchParams {
  searchParams: {
    query?: string;
    from?: string;
    to?: string;
    status?: string;
    waived?: string;
    penalty_type?: string;
  };
}

export default async function PenaltyReportPage({
  searchParams,
}: SearchParams) {
  //   const user = await currentUser();
  //   if (!user) return redirect("/sign-in");

  const penalties = await getFilteredPenalties({
    name: searchParams.query,
    from: searchParams.from,
    to: searchParams.to,
    status: searchParams.status,
    waived: searchParams.waived,
    penalty_type: searchParams.penalty_type,
  });
  const processed = penalties.map((p) => ({
    ID: p.member.custom_id,
    "Full Name": `${p.member.first_name} ${p.member.second_name} ${p.member.last_name}`,
    Phone: p.member.phone_number.replace(/^251/, "0"),
    Reason: p.reason,
    Expected_amount: p.expected_amount,
    Paid_amount: p.paid_amount,
    Remaining_Amount: Number(p.expected_amount) - Number(p.paid_amount),
    missed_month: p.missed_month.toLocaleDateString(),
    "Penalty Type": p.penalty_type,
    waived: p.waived ? "true" : "false",
    "Date Issued": new Date(p.applied_at).toLocaleDateString(),
    status: p.is_paid
      ? "Paid"
      : Number(p.paid_amount) > 0
      ? "partially"
      : "Unpaid",
  }));
  const totalExpected = processed.reduce(
    (sum, row) => sum + Number(row["Expected_amount"]),
    0
  );
  const totalPaid = processed.reduce(
    (sum, row) => sum + Number(row["Paid_amount"]),
    0
  );
  const totalRemaining = totalExpected - totalPaid;
  return (
    <ReportShell
      title="Penalty Report"
      filename="penalty_report"
      data={processed}
      columns={[
        { label: "ID", accessor: "ID" },
        { label: "Full Name", accessor: "Full Name" },
        { label: "Phone", accessor: "Phone" },
        { label: "Expected Amount", accessor: "Expected_amount" },
        { label: "Paid Amount", accessor: "Paid_amount" },
        { label: "Remaining Amount", accessor: "Remaining_Amount" },
        { label: "Penalty status", accessor: "status" },
        { label: "Missed Month", accessor: "missed_month" },
        { label: "Penalty Type", accessor: "Penalty Type" },
        { label: "Waived", accessor: "waived" },
        { label: "Reason", accessor: "Reason" },
        { label: "Date Issued", accessor: "Date Issued" },
      ]}
      summaryRow={{
        Expected_amount: totalExpected,
        Paid_amount: totalPaid,
        Remaining_Amount: totalRemaining,
      }}
    >
      <FilterBar type="penalty" />
    </ReportShell>
  );
}

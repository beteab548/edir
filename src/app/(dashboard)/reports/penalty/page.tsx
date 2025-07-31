export const dynamic = "force-dynamic";

import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getFilteredPenalties } from "@/lib/report";
import ReportShell from "@/components/report/ReportShell";
import FilterBar from "@/components/report/FilterBar";
import { generateContributionSchedulesForAllActiveMembers } from "@/lib/services/generateSchedulesForAllMembers";

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
  const user = await currentUser();
  if (!user) return redirect("/sign-in");
  await generateContributionSchedulesForAllActiveMembers();

  const penalties = await getFilteredPenalties({
    name: searchParams.query,
    from: searchParams.from,
    to: searchParams.to,
    status: searchParams.status,
    waived: searchParams.waived,
    penalty_type: searchParams.penalty_type,
  });
  const processed = penalties.map((p: any) => ({
    ID: p.member.custom_id,
    "Full Name": `${p.member.first_name} ${p.member.second_name} ${p.member.last_name}`,
    Phone: p.member.phone_number.replace(/^251/, "0"),
    Reason: p.reason,
    Expected_amount: p.expected_amount,
    Paid_amount: p.paid_amount,
    Remaining_Amount: Number(p.expected_amount) - Number(p.paid_amount),
    missed_month: new Date(p.missed_month).toLocaleDateString(),
    "Penalty Type": p.penalty_type,
    waived: p.waived ? "true" : "false",
    "Date Issued": new Date(p.applied_at).toLocaleDateString(),
    status: p.is_paid
      ? "Paid"
      : Number(p.paid_amount) > 0
      ? "Partially Paid"
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
      searchparams={searchParams}
      title="Penalty Report"
      filename="penalty_report"
      data={processed}
      columns={[
        {
          label: "ID",
          accessor: "ID",
          width: "w-auto",
          printWidth: "print:w-[300px]",
        },
        {
          label: "Full Name",
          accessor: "Full Name",
          width: "w-auto",
          printWidth: "print:w-[450px]",
        },
        {
          label: "Phone",
          accessor: "Phone",
          width: "w-[60px]",
          printWidth: "print:w-[95px]",
        },
        {
          label: "Expected Amount",
          accessor: "Expected_amount",
          width: "w-auto",
          printWidth: "print:w-[95px]",
        },
        {
          label: "Paid Amount",
          accessor: "Paid_amount",
          width: "w-auto",
          printWidth: "print:w-[95px]",
        },
        {
          label: "Remaining Amount",
          accessor: "Remaining_Amount",
          width: "w-[60px]",
          printWidth: "print:w-[95px]",
        },
        {
          label: "Penalty status",
          accessor: "status",
          width: "w-[70px]",
          printWidth: "print:w-[95px]",
        },
        {
          label: "Missed Month",
          accessor: "missed_month",
          width: "w-[auto]",
          printWidth: "print:w-[90px]",
        },
        {
          label: "Penalty Type",
          accessor: "Penalty Type",
          width: "w-auto",
          printWidth: "print:w-[95px]",
        },
        {
          label: "Waived",
          accessor: "waived",
          width: "w-[40px]",
          printWidth: "print:w-[90px]",
        },
        {
          label: "Reason",
          accessor: "Reason",
          width: "w-auto",
          printWidth: "print:w-[95px]",
        },
        {
          label: "Date Issued",
          accessor: "Date Issued",
          width: "w-[60px]",
          printWidth: "print:w-[95px]",
        },
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

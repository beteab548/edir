export const dynamic = "force-dynamic";

import FilterBar from "@/components/report/FilterBar";
import ReportShell from "@/components/report/ReportShell";
import { getFilteredContributions } from "@/lib/report";
import { generateContributionSchedulesForAllActiveMembers } from "@/lib/services/generateSchedulesForAllMembers";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

interface SearchParams {
  searchParams: {
    query?: string;
    from?: string;
    to?: string;
    type?: string;
    status?: string;
    contribution_type: string;
    onlyPrincipals?: string; // Added for completeness
  };
}

export default async function ContributionReportPage({
  searchParams,
}: SearchParams) {
  const user = await currentUser();
  if (!user) return redirect("/sign-in");

  await generateContributionSchedulesForAllActiveMembers();

  const contributions = await getFilteredContributions({
    name: searchParams.query,
    from: searchParams.from,
    to: searchParams.to,
    type: searchParams.type,
    status: searchParams.status,
    contribution_type: searchParams.contribution_type,
  });

  const processed = contributions.map((c: any) => {
    const expected = c.ContributionSchedule.reduce(
      (sum: number, s: { expected_amount: any }) =>
        sum + Number(s.expected_amount),
      0
    );
    const paid = c.ContributionSchedule.reduce(
      (sum: number, s: { paid_amount: any }) => sum + Number(s.paid_amount),
      0
    );

    // --- THIS IS THE FIX ---
    // 1. Access the Balance array (with a capital 'B').
    // 2. Check if the array exists and has at least one element.
    // 3. If so, get the unallocated_amount from the first element.
    // 4. Otherwise, default to 0.
    const unallocatedAmount = (c.Balance && c.Balance.length > 0)
      ? Number(c.Balance[0].unallocated_amount)
      : 0;

    const m = c.member;
    return {
      ID: m.custom_id,
      "Full Name": `${m.first_name} ${m.second_name} ${m.last_name}`,
      Phone: m.phone_number?.replace(/^251/, "0") || "-",
      "Contribution Type": `${c.contributionType.mode} / ${c.contributionType.name}`,
      "Expected Amount": expected,
      "Paid Amount": paid,
      "Remaining Amount": expected - paid,
      // Use the correctly calculated 'unallocatedAmount' variable here.
      "unallocated balance": unallocatedAmount,
      // More robust status calculation
      Status:
        expected > 0 && paid >= expected
          ? "Paid"
          : paid > 0
          ? "Partially Paid"
          : "Unpaid",
    };
  });

  // Calculate totals for the summary row
  const totalExpected = processed.reduce(
    (sum, row) => sum + row["Expected Amount"],
    0
  );
  const totalPaid = processed.reduce((sum, row) => sum + row["Paid Amount"], 0);
  const totalRemaining = totalExpected - totalPaid;
  
  // Also calculate the total unallocated balance for the summary
  const totalUnallocated = processed.reduce(
    (sum, row) => sum + row["unallocated balance"],
    0
  );

  return (
    <ReportShell
      searchparams={searchParams}
      title="Contribution Report"
      filename="contribution_report"
      data={processed}
      columns={[
        {
          label: "ID",
          accessor: "ID",
          width: "w-auto",
          printWidth: "print:w-[95px]",
        },
        {
          label: "Full Name",
          accessor: "Full Name",
          width: "w-auto",
          printWidth: "print:w-[400px]",
        },
        {
          label: "Phone",
          accessor: "Phone",
          width: "w-auto",
          printWidth: "print:w-[100px]",
        },
        {
          label: "Contribution Type",
          accessor: "Contribution Type",
          width: "w-auto",
          printWidth: "print:w-[180px]",
        },
        {
          label: "Expected Amount",
          accessor: "Expected Amount",
          width: "w-[60px]",
          printWidth: "print:w-[60px]",
        },
        {
          label: "Paid Amount",
          accessor: "Paid Amount",
          width: "w-[60px]",
          printWidth: "print:w-[60px]",
        },
        {
          label: "Remaining Amount",
          accessor: "Remaining Amount",
          width: "w-[100px]",
          printWidth: "print:w-[70px]",
        },
        {
          label: "Unallocated Balance",
          accessor: "unallocated balance",
          width: "w-[100px]",
          printWidth: "print:w-[70px]",
        },
        {
          label: "Status",
          accessor: "Status",
          width: "w-[70px]",
          printWidth: "print:w-[50px]",
        },
      ]}
      summaryRow={{
        "Expected Amount": totalExpected,
        "Paid Amount": totalPaid,
        "Remaining Amount": totalRemaining,
        // Add the new total to the summary row
        "unallocated balance": totalUnallocated,
      }}
    >
      <FilterBar type="contributions" />
    </ReportShell>
  );
}
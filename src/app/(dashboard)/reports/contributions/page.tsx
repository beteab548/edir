export const dynamic = "force-dynamic";

import FilterBar from "@/components/report/FilterBar";
import ReportShell from "@/components/report/ReportShell";
import { getFilteredContributions } from "@/lib/report";
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
    onlyPrincipals?: string;
  };
}

export default async function ContributionReportPage({
  searchParams,
}: SearchParams) {
  try {
    const user = await currentUser();
    if (!user) return redirect("/sign-in");

    // Verify user has permission to view reports
    const role = user.publicMetadata?.role;
    if (!["admin", "secretary", "chairman"].includes(role as string)) {
      return redirect("/unauthorized");
    }
    // Generate contribution schedules with error handling
   
    // Get filtered contributions with error handling
    let contributions = [];
    try {
      contributions = await getFilteredContributions({
        name: searchParams.query,
        from: searchParams.from,
        to: searchParams.to,
        type: searchParams.type,
        status: searchParams.status,
        contribution_type: searchParams.contribution_type,
      });
    } catch (fetchError) {
      console.error("Error fetching contributions:", fetchError);
      throw new Error("Failed to load contribution data. Please try again.");
    }

    // Process data with robust error handling
    const processed = contributions?.map((c: any) => {
      try {
        const expected =
          c.ContributionSchedule?.reduce(
            (sum: number, s: { expected_amount: any }) =>
              sum + Number(s.expected_amount || 0),
            0
          ) || 0;

        const paid =
          c.ContributionSchedule?.reduce(
            (sum: number, s: { paid_amount: any }) =>
              sum + Number(s.paid_amount || 0),
            0
          ) || 0;

        const unallocatedAmount = c.Balance?.[0]?.unallocated_amount
          ? Number(c.Balance[0].unallocated_amount)
          : 0;

        const m = c.member || {};
        return {
          ID: m.custom_id || "-",
          "Full Name":
            `${m.first_name || ""} ${m.second_name || ""} ${
              m.last_name || ""
            }`.trim() || "-",
          Phone: m.phone_number?.replace(/^251/, "0") || "-",
          "Contribution Type": `${c.contributionType?.mode || "Unknown"} / ${
            c.contributionType?.name || "Unknown"
          }`,
          "Expected Amount": expected,
          "Paid Amount": paid,
          "Remaining Amount": expected - paid,
          "unallocated balance": unallocatedAmount,
          Status:
            expected > 0 && paid >= expected
              ? "Paid"
              : paid > 0
              ? "Partially Paid"
              : "Unpaid",
        };
      } catch (processError) {
        console.error("Error processing contribution record:", processError);
        return {
          ID: "ERROR",
          "Full Name": "Error processing record",
          Phone: "-",
          "Contribution Type": "Error",
          "Expected Amount": 0,
          "Paid Amount": 0,
          "Remaining Amount": 0,
          "unallocated balance": 0,
          Status: "Error",
        };
      }
    });

    // Calculate totals with fallbacks
    const totalExpected = processed.reduce(
      (sum, row) => sum + (row["Expected Amount"] || 0),
      0
    );
    const totalPaid = processed.reduce(
      (sum, row) => sum + (row["Paid Amount"] || 0),
      0
    );
    const totalRemaining = totalExpected - totalPaid;
    const totalUnallocated = processed.reduce(
      (sum, row) => sum + (row["unallocated balance"] || 0),
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
            label: "Excess/Unallocated Balance",
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
          "unallocated balance": totalUnallocated,
        }}
      >
        <FilterBar type="contributions" />
      </ReportShell>
    );
  } catch (error) {
    console.error("Error in ContributionReportPage:", error);
    return (
      <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Contribution Report
        </h1>
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error loading contribution report
              </h3>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

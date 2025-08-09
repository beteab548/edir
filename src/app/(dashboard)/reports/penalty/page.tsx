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
function formatMonthYear(date: Date | string): string {
  const d = new Date(date);
  return `${d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
  })}`;
}

export default async function PenaltyReportPage({
  searchParams,
}: SearchParams) {
  try {
    const user = await currentUser();
    if (!user) return redirect("/sign-in");

    // Check user permissions
    const role = user.publicMetadata?.role;
    if (!["admin", "secretary", "chairman"].includes(role as string)) {
      return redirect("/unauthorized");
    }

    // Generate schedules with error handling
    try {
       generateContributionSchedulesForAllActiveMembers();
    } catch (scheduleError) {
      console.error("Error generating schedules:", scheduleError);
      // Continue execution even if schedule generation fails
    }

    let penalties = [];
    try {
      penalties = await getFilteredPenalties({
        name: searchParams.query,
        from: searchParams.from,
        to: searchParams.to,
        status: searchParams.status,
        waived: searchParams.waived,
        penalty_type: searchParams.penalty_type,
      });
    } catch (error) {
      console.error("Error fetching penalties:", error);
      throw new Error("Failed to load penalty data. Please try again later.");
    }

    const processed = penalties?.map((p: any) => {
      try {
        const formatPhone = (phone: string | undefined) => {
          if (!phone) return "N/A";
          return phone.replace(/^251/, "0").replace(/^\+/, "0");
        };

        const formatDate = (date: Date | string | null | undefined) => {
          if (!date) return "N/A";
          try {
            return new Date(date).toLocaleDateString();
          } catch {
            return "Invalid Date";
          }
        };

        const expectedAmount = Number(p.expected_amount) || 0;
        const paidAmount = Number(p.paid_amount) || 0;
        const remainingAmount = expectedAmount - paidAmount;

        return {
          ID: p.member?.custom_id || "N/A",
          "Full Name": p.member
            ? `${p.member.first_name || ""} ${p.member.second_name || ""} ${
                p.member.last_name || ""
              }`.trim()
            : "Member data missing",
          Phone: formatPhone(p.member?.phone_number),
          Reason: p.reason || "N/A",
          Expected_amount: expectedAmount,
          Paid_amount: paidAmount,
          Remaining_Amount: remainingAmount,
          missed_month: formatMonthYear(p.missed_month),
          "Penalty Type": p.penalty_type || "N/A",
          waived: p.waived ? "Yes" : "No",
          "Date Issued": formatDate(p.applied_at),
          status: p.is_paid
            ? "Paid"
            : paidAmount > 0
            ? "Partially Paid"
            : "Unpaid",
        };
      } catch (error) {
        console.error("Error processing penalty record:", error, p);
        return {
          ID: "ERROR",
          "Full Name": "Error processing record",
          Phone: "N/A",
          Reason: "N/A",
          Expected_amount: 0,
          Paid_amount: 0,
          Remaining_Amount: 0,
          missed_month: "N/A",
          "Penalty Type": "N/A",
          waived: "N/A",
          "Date Issued": "N/A",
          status: "Error",
        };
      }
    });

    const totalExpected = processed.reduce(
      (sum, row) => sum + (row["Expected_amount"] || 0),
      0
    );
    const totalPaid = processed.reduce(
      (sum, row) => sum + (row["Paid_amount"] || 0),
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
  } catch (error) {
    console.error("Error in PenaltyReportPage:", error);
    return (
      <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Penalty Report
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
                Error loading penalty report
              </h3>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

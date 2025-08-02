"use client";

import { useState } from "react";
import useSWR from "swr";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { WaivePenaltyButton } from "../../../../../../../components/WaivePenaltyButton";
import { ViewWaiverModal } from "../../../../../../../components/ViewWaiverModal";

interface MemberPenaltiesPageProps {
  params: {
    id: string;
    name: string;
  };
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());
const ErrorFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
    <div className="text-center space-y-6 max-w-md">
      <h1 className="text-3xl font-bold text-red-600">
        Connection Issue Detected
      </h1>
      <p className="text-gray-700">
        We were unable to load the members Penalty List due to a network or server
        error. Please try the following:
      </p>
      <ul className="text-left text-sm text-gray-600 list-disc list-inside space-y-1">
        <li>Check your internet connection</li>
        <li>Refresh the page</li>
        <li>Try again in a few minutes</li>
      </ul>
    </div>
  </div>
);
export default function MemberPenaltiesPage({
  params,
}: MemberPenaltiesPageProps) {
  try {
    const { user, isSignedIn } = useUser();
    const router = useRouter();
    const [viewingPenalty, setViewingPenalty] = useState<any>(null);

    // Redirect if not signed in or role mismatch
    if (!isSignedIn) {
      router.push("/sign-in");
    }
    if (user && user.publicMetadata?.role !== "chairman") {
      router.push("/dashboard");
    }

    const { data, error, isLoading, mutate } = useSWR(
      `/api/member-penalties?memberId=${
        params.id
      }&contributionTypeName=${encodeURIComponent(params.name)}`,
      fetcher
    );

    if (error) {
      return (
        <div className="container mx-auto px-4 py-8 text-red-600">
          Failed to load data: {error.message || "Unknown error"}
        </div>
      );
    }

    if (isLoading || !data) {
      return (
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      );
    }

    if (!data.member) {
      return (
        <div className="container mx-auto px-4 py-8">
          <div className="p-4 text-center text-red-500">Member not found</div>
        </div>
      );
    }

    const { member, penalties } = data;

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Penalty Records</h1>
          <div className="mt-2 flex items-center gap-4">
            <p className="text-gray-600">
              Member: {member.first_name} {member.last_name}
            </p>
            <p className="text-gray-600">Phone: {member.phone_number}</p>
          </div>
        </div>

        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contribution Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Missed Month
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Paid Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Applied At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {penalties.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    No penalty records found for this member
                  </td>
                </tr>
              ) : (
                penalties.map((penalty: any) => (
                  <tr
                    key={penalty.id}
                    className={`hover:bg-gray-50 ${
                      penalty.waived ? "bg-purple-50 cursor-pointer" : ""
                    }`}
                    onClick={() => penalty.waived && setViewingPenalty(penalty)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {penalty.contribution?.type_name || penalty.penalty_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(penalty.missed_month).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "long",
                        }
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {penalty.expected_amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {penalty.paid_amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          penalty.waived
                            ? "bg-purple-100 text-purple-800"
                            : penalty.is_paid
                            ? "bg-green-100 text-green-800"
                            : Number(penalty.paid_amount) > 0
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {penalty.waived
                          ? "Waived"
                          : penalty.is_paid
                          ? "Paid"
                          : Number(penalty.paid_amount) > 0
                          ? "Partially Paid"
                          : "Unpaid"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(penalty.applied_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {!penalty.is_paid && !penalty.waived && (
                        <WaivePenaltyButton
                          penaltyId={penalty.id}
                          memberId={penalty.member_id}
                          memberCustomId={penalty.member.custom_id}
                          memberName={penalty.member.first_name}
                          missedMonth={penalty.missed_month}
                          amount={Number(penalty.expected_amount)}
                          onSuccess={() => mutate()}
                        />
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {viewingPenalty && (
          <ViewWaiverModal
            penalty={viewingPenalty}
            onClose={() => setViewingPenalty(null)}
          />
        )}
      </div>
    );
  } catch (error) {
    console.error("MemberListPage Error:", error);
    return <ErrorFallback />;
  }
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { ContributionMode, Member, Penalty } from "@prisma/client";
// import { generateContributionSchedulesForAllActiveMembers } from "@/lib/services/generateSchedulesForAllMembers";

interface PenaltiesOverviewPageProps {
  initialMembers: (Member & {
    Penalty: (Penalty & {
      contribution: {
        contributionType: {
          mode: ContributionMode;
          name: string;
        };
      };
    })[];
  })[];
}
// generateContributionSchedulesForAllActiveMembers()
export default function SystemPenaltyManagement({
  initialMembers,
}: PenaltiesOverviewPageProps) {
  const [selectedType, setSelectedType] = useState<ContributionMode | "all">(
    "all"
  );
  const [members, setMembers] = useState(initialMembers);

  const filteredMembers = members.filter((member) => {
    if (selectedType === "all") return true;
    return member.Penalty.some(
      (penalty) => penalty.contribution.contributionType.mode === selectedType
    );
  });

  const getPenaltiesByType = (member: (typeof members)[0]) => {
    return member.Penalty.reduce((acc, penalty) => {
      const type = penalty.contribution.contributionType;
      if (!acc[type.mode]) {
        acc[type.mode] = {
          count: 0,
          totalAmount: 0,
          typeName: type.name,
        };
      }
      acc[type.mode].count++;
      acc[type.mode].totalAmount +=
        Number(penalty.expected_amount) - Number(penalty.paid_amount);
      return acc;
    }, {} as Record<string, { count: number; totalAmount: number; typeName: string }>);
  };

  return (
    <div className="container mx-auto px-4 py-8  rounded-lg border-x border-b border-gray-200">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Members with Penalties
      </h1>

      {/* Filter buttons */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setSelectedType("all")}
          className={`px-4 py-2 rounded-full text-sm font-medium ${
            selectedType === "all"
              ? "bg-indigo-100 text-indigo-800"
              : "bg-gray-100 text-gray-800 hover:bg-gray-200"
          }`}
        >
          All Types
        </button>
        {Object.values(ContributionMode).map((mode) => (
          <button
            key={mode}
            onClick={() => setSelectedType(mode)}
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              selectedType === mode
                ? "bg-indigo-100 text-indigo-800"
                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
            }`}
          >
            {formatContributionMode(mode)}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg  overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Member
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contribution Types
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Penalty Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                All Penalty Paid
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredMembers.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-8 text-center text-gray-500 text-lg"
                >
                  No member with a penalty for this contribution type exists.
                </td>
              </tr>
            ) : (
              filteredMembers.map((member) => {
                const penaltiesByType = getPenaltiesByType(member);
                const allPenaltiesPaid = member.Penalty.every((p) => p.is_paid);

                return (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {member.first_name} {member.last_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {member.phone_number}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(penaltiesByType).map(
                          ([mode, details]) => (
                            <span
                              key={mode}
                              className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800"
                              title={`${details.typeName} (${mode})`}
                            >
                              {details.typeName}
                            </span>
                          )
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {Object.entries(penaltiesByType).map(
                          ([mode, details]) => (
                            <div key={mode} className="text-sm">
                              <span className="font-medium">
                                {details.count}
                              </span>{" "}
                              penalties •{" "}
                              <span
                                className={
                                  details.totalAmount > 0
                                    ? "text-red-600"
                                    : "text-green-600"
                                }
                              >
                                {details.totalAmount.toFixed(2)} unpaid
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {allPenaltiesPaid ? (
                        <span className="text-green-600 font-medium">True</span>
                      ) : (
                        <span className="text-red-600 font-medium">False</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/list/members/${member.id}/penalties`}
                        className={`${
                          allPenaltiesPaid
                            ? "text-gray-400 cursor-not-allowed pointer-events-none"
                            : "text-indigo-600 hover:text-indigo-900"
                        }`}
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatContributionMode(mode: ContributionMode): string {
  return mode
    .split(/(?=[A-Z])/)
    .join(" ")
    .replace("Winow", "Window");
}

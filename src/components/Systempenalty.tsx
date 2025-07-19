"use client";

import { useState } from "react";
import Link from "next/link";
import { Penalty, Member } from "@prisma/client";

interface Props {
  members: (Member & {
    Penalty: (Penalty & {
      contribution: {
        contributionType: {
          name: string;
          mode: string;
        };
      };
    })[];
  })[];
}

const TABS = [
  { label: "All Types", value: "all" },
  { label: "Recurring", value: "Recurring" },
  { label: "Open Ended Recurrring", value: "OpenEndedRecurring" },
  { label: "One Time Window", value: "OneTimeWindow" },
];

export default function PenaltiesOverviewPage({ members }: Props) {
  const [selectedType, setSelectedType] = useState("all");

  const filteredMembers = members.filter((member) => {
    if (selectedType === "all") return member.Penalty.length > 0;
    return member.Penalty.some(
      (penalty) => penalty.contribution.contributionType.mode === selectedType
    );
  });

  const getPenaltiesByType = (member: (typeof members)[0]) => {
    return member.Penalty.filter((penalty) =>
      selectedType === "all"
        ? true
        : penalty.contribution.contributionType.mode === selectedType
    ).reduce((acc, penalty) => {
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

  const getPenaltyStatus = (penalties: Props["members"][0]["Penalty"]) => {
    if (penalties.every((p) => p.is_paid)) return "Paid";
    if (penalties.some((p) => !p.is_paid && Number(p.paid_amount) > 0))
      return "Partially Paid";
    return "Unpaid";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Paid":
        return "bg-green-100 text-green-800";
      case "Partially Paid":
        return "bg-yellow-100 text-yellow-800";
      case "Unpaid":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Penalties Overview</h1>
        <p className="text-gray-600">
          View and manage member penalties by contribution type
        </p>
      </div>

      <div className="mb-6 flex space-x-2 overflow-x-auto pb-2">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setSelectedType(tab.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
              selectedType === tab.value
                ? "bg-indigo-600 text-white shadow-md"
                : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Penalty Summary
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMembers.map((member, index) => {
                const penaltySummaries = getPenaltiesByType(member);
                const penalties = member.Penalty.filter(
                  (penalty) =>
                    selectedType === "all" ||
                    penalty.contribution.contributionType.mode === selectedType
                );
                const status = getPenaltyStatus(penalties);

                return (
                  <tr
                    key={member.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {index + 1}
                    </td>
                    <td className="py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          <span className="text-indigo-600 font-medium">
                            {member.first_name.charAt(0)}
                            {member.last_name.charAt(0)}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {member.first_name} {member.second_name}{" "}
                            {member.last_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            Member ID: {member.custom_id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {member.phone_number || "N/A"}
                    </td>
                    <td className=" py-4">
                      <div className="text-sm text-gray-900 space-y-1">
                        {Object.entries(penaltySummaries).map(
                          ([mode, summary]) => (
                            <div key={mode} className="flex items-center">
                              <span className="inline-block h-2 w-2 rounded-full bg-indigo-400 mr-2"></span>
                              <span>
                                <span className="font-medium">
                                  {summary.typeName}
                                </span>{" "}
                                - {summary.count}{" "}
                                {summary.count === 1 ? "penalty" : "penalties"}{" "}
                                •{" "}
                                <span className="font-semibold">
                                  {summary.totalAmount.toLocaleString()} birr
                                </span>
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                          status
                        )}`}
                      >
                        {status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {Object.entries(penaltySummaries).map(
                        ([mode, summary]) => (
                          <Link
                            key={mode}
                            href={`/list/members/${
                              member.id
                            }${encodeURIComponent(summary.typeName)}/penalties`}
                            className="text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 px-3 py-1 rounded-md transition-colors block mt-1"
                          >
                            Manage {summary.typeName} →
                          </Link>
                        )
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredMembers.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <svg
                        className="h-12 w-12 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1}
                          d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <p className="mt-4 text-lg font-medium">
                        No members with{" "}
                        {selectedType === "all"
                          ? "any"
                          : selectedType.toLowerCase()}{" "}
                        Contribution penalty found
                      </p>
                      <p className="mt-1 text-sm max-w-md">
                        Try selecting a different Contribution penalty type.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

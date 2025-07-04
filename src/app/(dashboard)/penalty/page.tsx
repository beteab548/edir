"use client";

import { useEffect, useState } from "react";
import ManualPenaltyManagement from "../../../components/manualPenalty";
import SystemPenaltyManagement from "@/components/Systempenalty";

type Tab = "System Generated" | "Admin Generated";

export default function TabSwitcher() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<{ message: string } | null>(null);
  const [memberWithPenalty, setMemberWithPenalty] = useState([]);
  const [activeTab, setActiveTab] = useState<Tab>("System Generated");

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        setError(null);
        const res = await fetch("/api/fetchSettingDatas");
        if (!res.ok) throw new Error("Failed to fetch data");
        const { MembersWithPenalities } = await res.json();
        setMemberWithPenalty(MembersWithPenalities);
      } catch (err: unknown) {
        setError({
          message: err instanceof Error ? err.message : "Unknown error",
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  return (
    <div className="mt-1 bg-gray-50 rounded-xl p-8">
      <div className="flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          View and manage Penalty details
        </h2>
      </div>

      <div className="border-b">
        <nav className="-mb-px flex space-x-8 justify-center">
          {(["System Generated", "Admin Generated"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === tab
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-800 hover:text-gray-900 hover:border-gray-300"
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

<div className="mt-2 p-4 rounded-lg min-h-[200px] transition-all duration-300 overflow-x-visible w-full max-w-full">
        {isLoading ? (
          <div className="container mx-auto px-4 py-8 animate-pulse">
            <h1 className="text-2xl font-bold text-gray-300 mb-6 bg-gray-200 w-64 h-6 rounded"></h1>

            {/* Filter buttons skeleton */}
            <div className="flex gap-2 mb-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-8 w-28 rounded-full bg-gray-200"
                ></div>
              ))}
            </div>

            <div className="bg-white rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {[
                      "Member",
                      "Phone",
                      "Contribution Types",
                      "Penalty Details",
                      "All Penalty Paid",
                      "Actions",
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-6 py-4 whitespace-nowrap">
                          <div className="h-4 bg-gray-200 rounded w-full max-w-[160px]"></div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : error ? (
          <div className="text-center text-red-500 text-sm">
            {error.message}
          </div>
        ) : activeTab === "System Generated" ? (
          <SystemPenaltyManagement initialMembers={memberWithPenalty} />
        ) : (
          <ManualPenaltyManagement />
        )}
      </div>
    </div>
  );
}

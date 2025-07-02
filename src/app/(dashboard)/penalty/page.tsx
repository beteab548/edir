// components/TabSwitcher.tsx
"use client";

import { useEffect, useState } from "react";
import ManualPenaltyManagement from "./penalty";
import SystemPenaltyManagement from "@/components/penalties";

type Tab = "System Generated" | "Admin Generated";

export default function TabSwitcher() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<{ message: string } | null>(null);
  const [memberWithPenalty, setMemberWithPenalty] = useState([]);
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
        if (err instanceof Error) {
          setError({ message: err.message });
        } else {
          setError({
            message: "An unknown error occurred while fetching data.",
          });
        }
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);
  const tabs = [
    {
      id: "System Generated",
      label: "System Generated",
      component: <SystemPenaltyManagement initialMembers={memberWithPenalty} />,
    },
    {
      id: "Admin Generated",
      label: "Admin Generated",
      component: <ManualPenaltyManagement />,
    },
  ];
  const [activeTab, setActiveTab] = useState<Tab>(
    (tabs[0]?.id as Tab) || "System Generated"
  );
  return (
    <div className="mt-1 bg-gray-50 rounded-xl p-8">
      <div className="flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          View and manage Penalty details
        </h2>
      </div>

      <div className="border-b">
        <nav className="-mb-px flex space-x-8 justify-center">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-800 hover:text-gray-900 hover:border-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-2 p-4 rounded-lg min-h-[200px] transition-all duration-300">
        {tabs.find((tab) => tab.id === activeTab)?.component}
      </div>
    </div>
  );
}

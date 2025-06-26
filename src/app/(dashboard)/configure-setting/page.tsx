"use client";

import { useEffect, useState } from "react";
import ContributionTab from "../../../components/contribution/contributionPage";
import ContributionPenaltyTab from "@/components/penalties";
import Penalty from "./penalty";
import { useUser } from "@clerk/nextjs";

type Tab = "contribution" | "contributionPenalty" | "penalty";

interface TabData {
  id: Tab;
  label: string;
  component: JSX.Element;
}

export default function ContributionTabs() {
  const [activeTab, setActiveTab] = useState<Tab>("contribution");
  const { user } = useUser();
  const [initialMembers, setInitialMembers] = useState([]);
  const [penaltiesWithNumberAmount, setPenaltiesWithNumberAmount] = useState(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<{ message: string }>({ message: "" });

  // Load data on component mount
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const res = await fetch("/api/fetchSettingDatas");
        if (!res.ok) throw new Error("Failed to fetch data");

        const { initialMembers, penalties } = await res.json();
        setInitialMembers(initialMembers);
        setPenaltiesWithNumberAmount(penalties);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError({ message: err.message });
        } else {
          setError({ message: "An unknown error occurred." });
        }
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-md">
        <div className="text-center py-10">
          <h3 className="text-lg font-medium text-gray-900">Please sign in</h3>
        </div>
      </div>
    );
  }
  const role = user.publicMetadata.role as string;
  const isChairman = role && role.includes("chairman");
  if (!isChairman) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-md">
        <div className="text-center py-10">
          <h3 className="text-lg font-medium text-gray-900">Access Denied</h3>
          <p className="mt-2 text-sm text-gray-500">
            Only a chairman can access this section.
          </p>
        </div>
      </div>
    );
  }
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-md">
        <div className="text-center py-10">
          <h3 className="text-lg font-medium text-gray-900">Loading...</h3>
        </div>
      </div>
    );
  }
  if (error.message !== "") {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-md">
        <div className="text-center py-10">
          <h3 className="text-lg font-medium text-gray-900">
            Error loading data
          </h3>
          <p className="mt-2 text-sm text-red-500">{error.message}</p>
        </div>
      </div>
    );
  }
  const allTabs: TabData[] = [
    {
      id: "contribution",
      label: "Contribution",
      component: <ContributionTab />,
    },
    {
      id: "contributionPenalty",
      label: "Contribution Penalty",
      component: <ContributionPenaltyTab initialMembers={initialMembers} />,
    },
    {
      id: "penalty",
      label: "Penalty",
      component: (
        <Penalty
          members={initialMembers}
          penalties={penaltiesWithNumberAmount}
        />
      ),
    },
  ];
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-md">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Contribution Management
        </h2>
        <p className="text-gray-600">View and manage contribution details</p>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {allTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="mt-6 p-4 bg-gray-50 rounded-lg min-h-[200px]">
        {allTabs.find((tab) => tab.id === activeTab)?.component}
      </div>
    </div>
  );
}

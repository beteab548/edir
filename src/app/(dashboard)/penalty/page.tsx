
"use client";

import { useEffect, useState } from "react";
import ManualPenaltyManagement from "../../../components/manualPenalty";
import SystemPenaltyManagement from "@/components/Systempenalty";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

type Tab = "System Generated" | "Admin Generated";

export default function TabSwitcher() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<{ message: string } | null>(null);
  const [memberWithPenalty, setMemberWithPenalty] = useState([]);
  const [activeTab, setActiveTab] = useState<Tab>("System Generated");
  const [isClient, setIsClient] = useState(false);
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();

  // Track when component mounts (client-side)
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }

    const role = user?.publicMetadata?.role;
    if (role !== "chairman") {
      router.push("/dashboard");
    }
  }, [isLoaded, isSignedIn, user, router]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const res = await fetch("/api/fetchSettingDatas");
      if (!res.ok) throw new Error("Failed to fetch data");

      const { MembersWithPenalities } = await res.json();
      setMemberWithPenalty(MembersWithPenalities);
    } catch (err: unknown) {
      setError({
        message: err instanceof Error ? err.message : "Connection Timeout",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded && isSignedIn && user?.publicMetadata?.role === "chairman") {
      fetchData();
    }
  }, [isLoaded, isSignedIn, user]);

  // Don't render anything until we're on the client side
  if (!isClient) {
    return null;
  }

  // Auth checks - now only happens client-side
  if (!isLoaded || !isSignedIn || user?.publicMetadata?.role !== "chairman") {
    return null;
  }

  return (
    <div className="mt-1 bg-gray-50 rounded-xl p-1">
      <div className="flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          View and manage Penalty details
        </h2>
      </div>

      {/* Tab Buttons */}
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

      <div className="mt-2  rounded-lg min-h-[200px] transition-all duration-300 overflow-x-visible w-full max-w-full ">
        {/* Loading State */}
        {isLoading ? (
          <div className="container mx-auto px-4 py-8 animate-pulse">
            <h1 className="text-2xl font-bold text-gray-300 mb-6 bg-gray-200 w-64 h-6 rounded"></h1>
            <div className="flex gap-2 mb-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-8 w-28 rounded-full bg-gray-200" />
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
                          <div className="h-4 bg-gray-200 rounded w-full max-w-[160px]" />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : error ? (
          <div className="min-h-[300px] flex items-center justify-center text-center p-6 bg-red-50 border border-red-200 rounded-lg">
            <div className="space-y-4">
              <h1 className="text-xl font-semibold text-red-600">
                Connection Timeout
              </h1>
              <p className="text-gray-600">
                {error.message || "Something went wrong. Please try again."}
              </p>
              <button
                onClick={fetchData}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
              >
                Retry
              </button>
            </div>
          </div>
        ) : activeTab === "System Generated" ? (
          <SystemPenaltyManagement members={memberWithPenalty} />
        ) : (
          <ManualPenaltyManagement />
        )}
      </div>
    </div>
  );
}

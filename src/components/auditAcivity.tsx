// In src/components/activity.tsx

"use client";

import useSWR from "swr";
import { formatDistanceToNow } from "date-fns";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiInfo,
  FiShield,
  FiUserPlus,
} from "react-icons/fi";
import { ActionType } from "@prisma/client";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const ActionIcon = ({ actionType }: { actionType: ActionType }) => {
  switch (actionType) {
    case "FAMILY_CREATE":
      return <FiUserPlus className="text-green-500" />;
    case "PENALTY_WAIVE":
      return <FiShield className="text-blue-500" />;
    default:
      return <FiInfo className="text-gray-500" />;
  }
};

export default function AuditActivity({ type }: { type?: string }) {
  const {
    data: logs,
    error,
    isLoading,
  } = useSWR("/api/audit-logs", fetcher, {
    refreshInterval: 30000,
    fallbackData: [],
  });
  if (isLoading) {
    return <div className="p-4 text-center">Loading activity...</div>;
  }
  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        Failed to load activity.
      </div>
    );
  }
  if (!logs || logs.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        No recent activity found.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-xs p-5 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Recent Activity
      </h3>
      <div className="space-y-4">
        {Array.isArray(logs) &&
          logs?.slice(0, 5).map((log: any) => (
            <div key={log.id} className="flex items-start gap-3">
              <div>
                {log.status === "SUCCESS" ? (
                  <FiCheckCircle className="w-5 h-5 text-green-500 mt-1" />
                ) : (
                  <FiAlertCircle className="w-5 h-5 text-red-500 mt-1" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-800">
                  <span className="font-semibold">{log.userFullName}</span>{" "}
                  {log.details}
                </p>
                <p className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(log.timestamp))} ago
                </p>
                {log.status === "FAILURE" && log.error && (
                  <p className="text-xs text-red-600 mt-1">
                    Error: {log.error}
                  </p>
                )}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

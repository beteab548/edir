"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { format } from "date-fns";
import { FiSearch, FiAlertCircle, FiCheckCircle } from "react-icons/fi";
import LinkButtonWithProgress from "@/components/ui/LinkButtonWithProgress";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface AuditLogTarget {
  name: string;
  customId: string;
  link: string;
}

interface AuditLogEntry {
  id: number;
  timestamp: string;
  userFullName: string;
  actionType: string;
  details: string;
  status: "SUCCESS" | "FAILURE";
  targetId: string | null;
  error: string | null;
}

interface UserFilterOption {
  userId: string;
  userFullName: string;
}

interface ApiResponse {
  logs: AuditLogEntry[];
  users: UserFilterOption[];
  total: number;
  totalPages: number;
  currentPage: number;
}

const actionTypeOptions = [
  "MEMBER_CREATE",
  "MEMBER_UPDATE",
  "MEMBER_DELETE",
  "MEMBER_STATUS_UPDATE",
  "MEMBER_ROLE_TRANSFER",
  "FAMILY_CREATE",
  "FAMILY_UPDATE",
  "PENALTY_WAIVE",
  "PAYMENT_CREATE",
  "USER_LOGIN",
];
const statusOptions = ["SUCCESS", "FAILURE"];

export default function AuditLog({
  userRole,
  userId,
}: {
  userRole: string;
  userId: string;
}) {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    searchQuery: "",
    userId: userId, // set userId
    actionType: "",
    status: "",
    startDate: "",
    endDate: "",
  });

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    if (filters.searchQuery) params.append("searchQuery", filters.searchQuery);
    params.append("userId", filters.userId);
    if (filters.actionType) params.append("actionType", filters.actionType);
    if (filters.status) params.append("status", filters.status);
    if (filters.startDate) params.append("startDate", filters.startDate);
    if (filters.endDate) params.append("endDate", filters.endDate);
    if (userRole) params.append("userRole", userRole); // Add the userRole
    return params.toString();
  }, [page, filters, userRole]);

  const { data, error, isLoading } = useSWR<ApiResponse>(
    `/api/detailed-audit-logs?${queryString}`,
    fetcher,
    { keepPreviousData: true }
  );
  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({
      searchQuery: "",
      userId: userId, // set userId
      actionType: "",
      status: "",
      startDate: "",
      endDate: "",
    });
    setPage(1);
  };
  data?.logs.map((log) => {
    console.log("log target:", log.targetId);
  });
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <header className="mb-6">
        {/* <h1 className="text-3xl font-bold text-gray-700">Audit Log</h1> */}
        <p className="text-sm text-gray-500 mt-1">
          Review all significant actions performed in the system.
        </p>
      </header>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          <div className="xl:col-span-2">
            <label
              htmlFor="searchQuery"
              className="text-sm font-medium text-gray-700 block mb-1"
            >
              Search
            </label>
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                name="searchQuery"
                id="searchQuery"
                placeholder="Search details, user, or ID..."
                value={filters.searchQuery}
                onChange={handleFilterChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          {userRole === "admin" && (
            <div>
              <label
                htmlFor="userId"
                className="text-sm font-medium text-gray-700 block mb-1"
              >
                User
              </label>
              <select
                name="userId"
                id="userId"
                value={filters.userId}
                onChange={handleFilterChange}
                className="w-full py-2 px-3 border border-gray-300 rounded-md"
              >
                <option value="">All Users</option>
                {data?.users?.map((user) => (
                  <option key={user.userId} value={user.userId}>
                    {user.userFullName}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label
              htmlFor="actionType"
              className="text-sm font-medium text-gray-700 block mb-1"
            >
              Action Type
            </label>
            <select
              name="actionType"
              id="actionType"
              value={filters.actionType}
              onChange={handleFilterChange}
              className="w-full py-2 px-3 border border-gray-300 rounded-md"
            >
              <option value="">All Actions</option>
              {actionTypeOptions.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="status"
              className="text-sm font-medium text-gray-700 block mb-1"
            >
              Status
            </label>
            <select
              name="status"
              id="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full py-2 px-3 border border-gray-300 rounded-md"
            >
              <option value="">All Statuses</option>
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="w-full py-2 px-4 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Clear
            </button>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto bg-white rounded-lg shadow-sm border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 table-fixed">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Timestamp
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Action
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-full">
                Details
              </th>

              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Target
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading && (
              <tr>
                <td colSpan={6} className="py-10">
                  <div className="flex justify-center">Loading...</div>
                </td>
              </tr>
            )}
            {error && (
              <tr>
                <td colSpan={6} className="text-center py-10 text-red-500">
                  Failed to load data.
                </td>
              </tr>
            )}
            {!isLoading && data?.logs?.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-10 text-gray-500">
                  No logs found.
                </td>
              </tr>
            )}
            {data?.logs?.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {format(new Date(log.timestamp), "MMM d, yyyy, h:mm:ss a")}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-medium">
                  {log.userFullName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {log.actionType}
                </td>

                <td
                  className="px-6 py-4 text-sm text-gray-700 min-w-[300px] whitespace-pre-wrap break-words"
                  style={{
                    display: "-webkit-box",
                    WebkitLineClamp: 4,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    wordBreak: "break-word",
                  }}
                >
                  {log.details.replace(/(.{30})/g, "$1\n")}{" "}
                  {/* break every ~50 chars */}
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {log.targetId ? (
                    <LinkButtonWithProgress
                      href={`/list/members?search=${log.targetId}` || "#"}
                    >
                      <span className="text-blue-600 hover:underline hover:text-blue-800">
                        {log.targetId}
                      </span>
                    </LinkButtonWithProgress>
                  ) : (
                    <span className="text-gray-400">N/A</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {log.status === "SUCCESS" ? (
                    <span className="flex items-center gap-2 text-green-700">
                      <FiCheckCircle /> Success
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 text-red-700">
                      <FiAlertCircle /> Failure
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center mt-4">
        <span className="text-sm text-gray-700">
          Page {data?.currentPage || 1} of {data?.totalPages || 1}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || isLoading}
            className="py-1 px-3 border rounded-md bg-white disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= (data?.totalPages || 1) || isLoading}
            className="py-1 px-3 border rounded-md bg-white disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

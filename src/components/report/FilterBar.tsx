"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";

function getStartOfMonthISO() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];
}

function getEndOfMonthISO() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0];
}

export default function FilterBar({
  type,
}: {
  type: "members" | "penalty" | "contributions";
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const hasMounted = useRef(false); // To skip first render

  const [filters, setFilters] = useState({
    query: searchParams.get("query") || "",
    from: searchParams.get("from") || getStartOfMonthISO(),
    to: searchParams.get("to") || getEndOfMonthISO(),
    status: searchParams.get("status") || "",
    profession: searchParams.get("profession") || "",
    member_type: searchParams.get("member_type") || "",
    house_number: searchParams.get("house_number") || "",
    title: searchParams.get("title") || "",
    waived: searchParams.get("waived") || "",
    penalty_type: searchParams.get("penalty_type") || "",
    contribution_type: searchParams.get("contribution_type") || "",
    type:searchParams.get("type") || "",
  });

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }

    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });

    router.push(`/reports/${type}?${params.toString()}`);
  }, [filters]);

  const handleChange = (key: keyof typeof filters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <div className="flex gap-2 flex-wrap print:hidden">
      {/* Common Filters */}
      <input
        type="text"
        placeholder="name, ID, phone..."
        value={filters.query}
        onChange={(e) => handleChange("query", e.target.value)}
        className="border p-2 rounded"
      />
      <input
        type="text"
        placeholder={
          type === "members"
            ? "status (Active, Inactive...)"
            : "status (Paid, Partially...)"
        }
        value={filters.status}
        onChange={(e) => handleChange("status", e.target.value)}
        className="border p-2 rounded"
      />

      {/* Member-only filters */}
      {type === "members" && (
        <>
          <input
            type="text"
            placeholder="profession (Dr...)"
            value={filters.profession}
            onChange={(e) => handleChange("profession", e.target.value)}
            className="border p-2 rounded"
          />
          <input
            type="text"
            placeholder="title (Mr, Mrs...)"
            value={filters.title}
            onChange={(e) => handleChange("title", e.target.value)}
            className="border p-2 rounded"
          />
          <input
            type="text"
            placeholder="member type (New, Existing)"
            value={filters.member_type}
            onChange={(e) => handleChange("member_type", e.target.value)}
            className="border p-2 rounded"
          />
          <input
            type="text"
            placeholder="house number"
            value={filters.house_number}
            onChange={(e) => handleChange("house_number", e.target.value)}
            className="border p-2 rounded"
          />
        </>
      )}

      {/* Penalty-only filters */}
      {type === "penalty" && (
        <>
          <input
            type="text"
            placeholder="waived (true/false)"
            value={filters.waived}
            onChange={(e) => handleChange("waived", e.target.value)}
            className="border p-2 rounded"
          />
          <input
            type="text"
            placeholder="penalty type (monthly, registration...)"
            value={filters.penalty_type}
            onChange={(e) => handleChange("penalty_type", e.target.value)}
            className="border p-2 rounded"
          />
        </>
      )}
      {type === "contributions" && (
        <>
          <input
            type="text"
            placeholder="type (Monthly, Registration...)"
            value={filters.contribution_type}
            onChange={(e) => handleChange("contribution_type", e.target.value)}
            className="border p-2 rounded"
          />
          <input
            type="text"
            placeholder="contribution type (Reccuring, oneTimeWindow...)"
            value={filters.type}
            onChange={(e) => handleChange("type", e.target.value)}
            className="border p-2 rounded"
          />
        </>
      )}

      {/* Date filters - common for all */}
      <input
        type="date"
        value={filters.from}
        onChange={(e) => handleChange("from", e.target.value)}
        className="border p-2 rounded"
      />
      <input
        type="date"
        value={filters.to}
        onChange={(e) => handleChange("to", e.target.value)}
        className="border p-2 rounded"
      />
    </div>
  );
}

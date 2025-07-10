"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

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

export default function FilterBar() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [filters, setFilters] = useState({
    query: searchParams.get("query") || "",
    from: searchParams.get("from") || getStartOfMonthISO(),
    to: searchParams.get("to") || getEndOfMonthISO(),
    status: searchParams.get("status") || "",
    profession: searchParams.get("profession") || "",
    member_type: searchParams.get("member_type") || "",
    house_number: searchParams.get("house_number") || "",
    title: searchParams.get("title") || "",
  });

  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    router.push(`/reports/members?${params.toString()}`);
  }, [filters]);

  const handleChange = (key: keyof typeof filters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <div className="flex gap-2 flex-wrap">
      <input
        type="text"
        placeholder="name, ID, phone..."
        value={filters.query}
        onChange={(e) => handleChange("query", e.target.value)}
        className="border p-2 rounded"
      />
      <input
        type="text"
        placeholder="profession (dr..)"
        value={filters.profession}
        onChange={(e) => handleChange("profession", e.target.value)}
        className="border p-2 rounded"
      />
      <input
        type="text"
        placeholder="title (Dr, Mr, Mrs...)"
        value={filters.title}
        onChange={(e) => handleChange("title", e.target.value)}
        className="border p-2 rounded"
      />
      <input
        type="text"
        placeholder="status (Active, Inactive...)"
        value={filters.status}
        onChange={(e) => handleChange("status", e.target.value)}
        className="border p-2 rounded"
      />
      <input
        type="text"
        placeholder="member type (new, existing...)"
        value={filters.member_type}
        onChange={(e) => handleChange("member_type", e.target.value)}
        className="border p-2 rounded"
      />
      <input
        type="text"
        placeholder="house number (1/7...)"
        value={filters.house_number}
        onChange={(e) => handleChange("house_number", e.target.value)}
        className="border p-2 rounded"
      />
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

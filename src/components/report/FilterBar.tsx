"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function FilterBar() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [query, setQuery] = useState(searchParams.get("query") || "");
  const [year, setYear] = useState(searchParams.get("year") || "");
  const [month, setMonth] = useState(searchParams.get("month") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "");

  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set("query", query);
    if (year) params.set("year", year);
    if (month) params.set("month", month);
    if (status) params.set("status", status);
    router.push(`/reports/members?${params.toString()}`);
  }, [query, year, month, status]);
  return (
    <div className="flex gap-2 flex-wrap">
      <input
        type="text"
        placeholder="name, ID, phone..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="border p-2 rounded"
      />
      <input
        type="number"
        placeholder="Year ( 2025)"
        value={year}
        onChange={(e) => setYear(e.target.value)}
        className="border p-2 rounded"
      />
      <input
        type="text"
        placeholder="status ( Active, Inactive)"
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="border p-2 rounded"
      />
      <select
        value={month}
        onChange={(e) => setMonth(e.target.value)}
        className="border p-2 rounded"
      >
        <option value="">All Months</option>
        {Array.from({ length: 12 }).map((_, i) => (
          <option key={i} value={String(i + 1).padStart(2, "0")}>
            {new Date(0, i).toLocaleString("default", { month: "long" })}
          </option>
        ))}
      </select>
    </div>
  );
}

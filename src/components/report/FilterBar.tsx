"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

function getStartOfMonthISO() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return start.toISOString().split("T")[0]; 
}

function getEndOfMonthISO() {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return end.toISOString().split("T")[0]; 
}

export default function FilterBar() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [query, setQuery] = useState(searchParams.get("query") || "");
  const [fromDate, setFromDate] = useState(
    searchParams.get("from") || getStartOfMonthISO()
  );
  const [toDate, setToDate] = useState(
    searchParams.get("to") || getEndOfMonthISO()
  );
  const [status, setStatus] = useState(searchParams.get("status") || "");

  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set("query", query);
    if (fromDate) params.set("from", fromDate);
    if (toDate) params.set("to", toDate);
    if (status) params.set("status", status);
    router.push(`/reports/members?${params.toString()}`);
  }, [query, fromDate, toDate, status]);

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
        type="date"
        value={fromDate}
        onChange={(e) => setFromDate(e.target.value)}
        className="border p-2 rounded"
      />
      <input
        type="date"
        value={toDate}
        onChange={(e) => setToDate(e.target.value)}
        className="border p-2 rounded"
      />
      <input
        type="text"
        placeholder="status (Active, Inactive)"
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="border p-2 rounded"
      />
    </div>
  );
}

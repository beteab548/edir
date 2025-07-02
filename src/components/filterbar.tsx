// components/payment/FilterBar.tsx
"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export default function FilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [year, setYear] = useState(searchParams.get("year") || "");
  const [month, setMonth] = useState(searchParams.get("month") || "");
  const [query, setQuery] = useState(searchParams.get("query") || "");

  useEffect(() => {
    setYear(searchParams.get("year") || "");
    setMonth(searchParams.get("month") || "");
    setQuery(searchParams.get("query") || "");
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const params = new URLSearchParams();
    if (year) params.set("year", year);
    if (month) params.set("month", month);
    if (query) params.set("query", query);

    router.push(`${pathname}?${params.toString()}`);
  };

  const handleReset = () => {
    setYear("");
    setMonth("");
    setQuery("");
    router.push(pathname);
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6 flex flex-wrap gap-4">
      <input
        type="text"
        placeholder="Filter by Id , name or phone"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-md shadow-sm w-64"
      />
      <select
        value={year}
        onChange={(e) => setYear(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-md"
      >
        <option value="">All Years</option>
        {[2023, 2024, 2025].map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
      <select
        value={month}
        onChange={(e) => setMonth(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-md"
      >
        <option value="">All Months</option>
        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
          <option key={m} value={String(m).padStart(2, "0")}>
            {new Date(0, m - 1).toLocaleString("default", { month: "long" })}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
      >
        Filter
      </button>
      <button
        type="button"
        onClick={handleReset}
        className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 transition"
      >
        Reset
      </button>
    </form>
  );
}

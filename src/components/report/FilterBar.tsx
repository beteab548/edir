"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { ContributionMode } from "@prisma/client";
import SmallCheckbox from "../ui/checkbox";

// Enums
enum Status {
  Active = "Active",
  Inactive = "Inactive",
  Left = "Left",
  Deceased = "Deceased",
}
enum paymentStatus {
  Paid = "Paid",
  Unpaid = "Unpaid",
  Partialpaid = "Partially Paid",
}
enum MemberType {
  New = "New",
  Existing = "Existing",
}

export function getStartOfMonthISO(date: Date = new Date()) {
  return format(startOfMonth(date), "yyyy-MM-dd");
}
export function getEndOfMonthISO(date: Date = new Date()) {
  return format(endOfMonth(date), "yyyy-MM-dd");
}

export default function FilterBar({
  type,
}: {
  type: "members" | "penalty" | "contributions";
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const hasMounted = useRef(false);

  const [contributionTypes, setContributionTypes] = useState<
    { id: string; name: string }[]
  >([]);
  const [penaltyTypes, setPenaltyTypes] = useState<
    { id: string; penalty_type: string }[]
  >([]);

  const [filters, setFilters] = useState({
    query: searchParams.get("query") || "",
    from: searchParams.get("from") || getStartOfMonthISO(),
    to: searchParams.get("to") || getEndOfMonthISO(),
    status: searchParams.get("status") || "",
    profession: searchParams.get("profession") || "",
    member_type: searchParams.get("member_type") || "",
    green_area: searchParams.get("green_area") || "",
    block: searchParams.get("block") || "",
    marital_status: searchParams.get("marital_status") || "",
    house_number: searchParams.get("house_number") || "",
    title: searchParams.get("title") || "",
    waived: searchParams.get("waived") || "",
    penalty_type: searchParams.get("penalty_type") || "",
    contribution_type: searchParams.get("contribution_type") || "",
    type: searchParams.get("type") || "",
     onlyPrincipals: searchParams.get("onlyPrincipals") === "true",
  });

  useEffect(() => {
    async function fetchContributionTypes() {
      try {
        const res = await fetch("/api/contributions/contributionTypes");
        const { contributionTypes, penaltyTypes } = await res.json();
        setContributionTypes(contributionTypes);
        setPenaltyTypes(penaltyTypes);
      } catch (error) {
        console.error("Failed to fetch contribution types", error);
      }
    }

    fetchContributionTypes();
  }, [type]);

  useEffect(() => {
    // This effect runs only once on the initial mount to set default URL params
    // if none exist.
    if (!hasMounted.current) {
      hasMounted.current = true;

      const currentParams = new URLSearchParams(window.location.search);
      const hasParams = Array.from(currentParams.keys()).length > 0;

      // If the URL has no search parameters, we build them from our initial state.
      if (!hasParams) {
        const params = new URLSearchParams();

        // Loop through the initial filters state
        Object.entries(filters).forEach(([key, value]) => {
          
          // --- THIS IS THE FIX, IDENTICAL TO THE OTHER useEffect ---
          
          // Handle the boolean 'onlyPrincipals' case separately
          if (key === 'onlyPrincipals') {
            // Only add the param to the URL if the checkbox is checked (true)
            if (value === true) {
              params.set(key, 'true');
            }
          } else if (value) { // Handle all other non-boolean, truthy values
            // Safely convert to a string before setting
            params.set(key, String(value));
          }
        });
        
        // Now, update the URL with the correctly formatted initial parameters
        router.replace(`/reports/${type}?${params.toString()}`);
      }

      return;
    }

    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (key === 'onlyPrincipals') {
        if (value === true) {
          params.set(key, 'true');
        }
      } else if (value) {
        params.set(key, String(value));
      }
    });
    router.push(`/reports/${type}?${params.toString()}`);

}, [filters, router, type]);

    const handleChange = (
    key: keyof typeof filters,
    value: string | boolean // <-- `value` can now be a string OR a boolean
  ) => {
    setFilters((prev) => {
      // Your existing date logic is still correct.
      if (key === "to" && typeof value === 'string' && value < prev.from) {
        return { ...prev, to: prev.from };
      }
      if (key === "from" && typeof value === 'string' && value > prev.to) {
        return { ...prev, from: value, to: value };
      }
      // This will now correctly handle setting both string and boolean values in the state.
      return { ...prev, [key]: value };
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 print:hidden m-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Search input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Search
        </label>
        <input
          type="text"
          placeholder="Name, ID, Phone..."
          value={filters.query}
          onChange={(e) => handleChange("query", e.target.value)}
          className="w-full border border-gray-300 p-2 rounded-md focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Status */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Status
        </label>
        <select
          value={filters.status}
          onChange={(e) => handleChange("status", e.target.value)}
          className="w-full border border-gray-300 p-2 rounded-md focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Statuses</option>
          {(type === "members"
            ? Object.values(Status)
            : Object.values(paymentStatus)
          ).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Members only */}
      {type === "members" && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Member Type
            </label>
            <select
              value={filters.member_type}
              onChange={(e) => handleChange("member_type", e.target.value)}
              className="w-full border border-gray-300 p-2 rounded-md"
            >
              <option value="">All Types</option>
              {Object.values(MemberType).map((mt) => (
                <option key={mt} value={mt}>
                  {mt}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Profession
            </label>
            <input
              type="text"
              value={filters.profession}
              onChange={(e) => handleChange("profession", e.target.value)}
              placeholder="e.g. Dr."
              className="w-full border border-gray-300 p-2 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={filters.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="e.g. Mr., Mrs."
              className="w-full border border-gray-300 p-2 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Green Area
            </label>
            <input
              type="text"
              value={filters.green_area}
              placeholder="e.g. 4,7"
              onChange={(e) => handleChange("green_area", e.target.value)}
              className="w-full border border-gray-300 p-2 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Block
            </label>
            <input
              type="text"
              value={filters.block}
              placeholder="e.g. 2,5"
              onChange={(e) => handleChange("block", e.target.value)}
              className="w-full border border-gray-300 p-2 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              House Number
            </label>
            <input
              type="text"
              value={filters.house_number}
              placeholder="e.g. 8,9"
              onChange={(e) => handleChange("house_number", e.target.value)}
              className="w-full border border-gray-300 p-2 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Martial Status
            </label>
            <select
              name="marital_status"
              value={filters.marital_status}
              onChange={(e) => handleChange("marital_status", e.target.value)}
              className="w-full border border-gray-300 p-2 rounded-md"
            >
              <option value="">All Martial Status</option>
              <option value="married">Married</option>
              <option value="single">Single</option>
              <option value="divorced">Divorced</option>
              <option value="widowed">Widowed</option>
            </select>
          </div>
                <div className="flex items-end pb-2">
          <SmallCheckbox
            name="onlyPrincipals"
            label="Principals Only"
            checked={filters.onlyPrincipals}
            onChange={(e) => handleChange("onlyPrincipals", e.target.checked)}
          />
        </div>


          {/* Dates */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From
            </label>
            <input
              type="date"
              value={filters.from}
              onChange={(e) => handleChange("from", e.target.value)}
              className="w-full border border-gray-300 p-2 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To
            </label>
            <input
              type="date"
              value={filters.to}
              onChange={(e) => handleChange("to", e.target.value)}
              className="w-full border border-gray-300 p-2 rounded-md"
            />
          </div>
        </>
      )}

      {/* Penalty only */}
      {type === "penalty" && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Waived
            </label>
            <select
              value={filters.waived}
              onChange={(e) => handleChange("waived", e.target.value)}
              className="w-full border border-gray-300 p-2 rounded-md"
            >
              <option value="">All</option>
              <option value="true">Waived</option>
              <option value="false">Unwaived</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Penalty Type
            </label>
            <select
              value={filters.penalty_type}
              onChange={(e) => handleChange("penalty_type", e.target.value)}
              className="w-full border border-gray-300 p-2 rounded-md"
            >
              <option value="">All Penalty Types</option>
              {penaltyTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.penalty_type}
                </option>
              ))}
            </select>
          </div>
          {/* Dates */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From
            </label>
            <input
              type="date"
              value={filters.from}
              onChange={(e) => handleChange("from", e.target.value)}
              className="w-full border border-gray-300 p-2 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To
            </label>
            <input
              type="date"
              value={filters.to}
              onChange={(e) => handleChange("to", e.target.value)}
              className="w-full border border-gray-300 p-2 rounded-md"
            />
          </div>
        </>
      )}

      {/* Contributions only */}
      {type === "contributions" && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contribution Type
            </label>
            <select
              value={filters.contribution_type}
              onChange={(e) =>
                handleChange("contribution_type", e.target.value)
              }
              className="w-full border border-gray-300 p-2 rounded-md"
            >
              <option value="">All Contributions</option>
              {contributionTypes.map((type) => (
                <option key={type.id} value={type.name}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contribution Mode
            </label>
            <select
              value={filters.type}
              onChange={(e) => handleChange("type", e.target.value)}
              className="w-full border border-gray-300 p-2 rounded-md"
            >
              <option value="">All Modes</option>
              {Object.values(ContributionMode).map((mt) => (
                <option key={mt} value={mt}>
                  {mt}
                </option>
              ))}
            </select>
          </div>
          {/* Dates */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From
            </label>
            <input
              type="date"
              value={filters.from}
              onChange={(e) => handleChange("from", e.target.value)}
              className="w-full border border-gray-300 p-2 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To
            </label>
            <input
              type="date"
              value={filters.to}
              onChange={(e) => handleChange("to", e.target.value)}
              className="w-full border border-gray-300 p-2 rounded-md"
            />
          </div>
        </>
      )}
    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import { Skeleton } from "./ui/skeleton";
import Decimal from "decimal.js";
import { $Enums } from "@prisma/client";

type Member = {
  id: number;
  first_name: string;
  created_at: string;
};

type PaymentRecord = {
  id: number;
  member_id: number;
  contribution_Type_id: number | null;
  payment_date: Date;
  payment_method: string;
  document_reference: string;
  total_paid_amount: Decimal;
  remaining_balance: Decimal | null;
  penalty_type_payed_for: $Enums.PenaltyType | null;
  created_at: Date;
  member: Member;
};

function formatTimeAgo(timestamp: string) {
  const diffMs = Date.now() - new Date(timestamp).getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60)
    return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24)
    return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
}

export default function Activity({ type }: { type: string }) {
  const [data, setData] = useState<Member[] | PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRecent() {
      try {
        setLoading(true);
        const url =
          type === "secretary"
            ? "/api/dashboard/members/recent"
            : "/api/dashboard/members/payment";
        const res = await fetch(url, {
          cache: "no-store",
          next: { revalidate: 0 },
        });
        if (!res.ok) throw new Error(`Error: ${res.status}`);
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchRecent();
  }, [type]);

  const isSecretary = type === "secretary";

  if (loading) {
    return (
      <div className="max-w-md mx-auto p-6  bg-white rounded-xl shadow border border-gray-200 animate-pulse">
        <div className="h-8 bg-gray-300 rounded w-3/4 mb-6"></div>
        <div className="space-y-5">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-10 bg-gray-300 rounded w-3/3"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto p-6 bg-red-50 border border-red-300 rounded text-red-700 font-semibold">
        Error: {error}
      </div>
    );
  }

  return (
    <section className="max-w-md mx-auto p-6 bg-white rounded-xl shadow border border-gray-200">
      <h3 className="text-md font-semibold text-gray-900 mb-5 border-b pb-2">
        {isSecretary ? "🧾 Recent Members" : "💵 Recent Payments"}
      </h3>

      {data.length === 0 ? (
        <p className="text-gray-500 italic">No recent data found.</p>
      ) : (
        <ul className="space-y-4">
          {isSecretary
            ? (data as Member[]).map(({ id, first_name, created_at }) => (
                <li
                  key={id}
                  className="flex items-center gap-4 p-3 border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition"
                >
                  <div className="flex items-center justify-center w-10 h-10 bg-blue-100 text-blue-600 rounded-full font-bold text-lg">
                    {first_name[0]}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {first_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      Joined {formatTimeAgo(created_at)}
                    </p>
                  </div>
                </li>
              ))
            : (data as PaymentRecord[]).map(
                ({
                  id,
                  payment_method,
                  total_paid_amount,
                  payment_date,
                  member,
                }) => (
                  <li
                    key={id}
                    className="p-2 border border-gray-200 rounded-lg shadow-sm bg-gray-50 hover:bg-gray-100 transition"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-sm text-gray-800">
                        {member.first_name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTimeAgo(payment_date.toString())}
                      </span>
                    </div>
                    <div className="text-sm text-gray-700">
                      Paid{" "}
                      <span className="font-medium text-green-600">
                        {total_paid_amount.toString()} Birr
                      </span>{" "}
                      via{" "}
                      <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                        {payment_method}
                      </span>
                    </div>
                  </li>
                )
              )}
        </ul>
      )}
    </section>
  );
}

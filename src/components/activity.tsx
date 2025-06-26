"use client";

import React, { useEffect, useState } from "react";
import { Skeleton } from "./ui/skeleton";

type Member = {
  id: number;
  first_name: string;
  created_at: string;
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

export default function Activity() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRecent() {
      try {
        setLoading(true);
        const res = await fetch("/api/reports/members/recent");
        if (!res.ok) throw new Error(`Error: ${res.status}`);

        const data: Member[] = await res.json();
        setMembers(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchRecent();
  }, []);

  if (loading) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow border border-gray-200 animate-pulse">
        <div className="h-8 bg-gray-300 rounded w-3/4 mb-6"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-6 bg-gray-300 rounded w-2/3"
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
      <h3 className="text-xl font-semibold text-gray-900 mb-5 border-b pb-2">
        Recent Members
      </h3>

      {members.length === 0 ? (
        <p className="text-gray-500 italic">No recent members found.</p>
      ) : (
        <ul className="space-y-4">
          {members.map(({ id, first_name, created_at }) => (
            <li
              key={id}
              className="flex items-center justify-between text-gray-800"
            >
              <span className="font-medium">{first_name}</span>
              <time
                dateTime={created_at}
                className="text-sm text-gray-500 whitespace-nowrap"
                title={new Date(created_at).toLocaleString()}
              >
                Joined {formatTimeAgo(created_at)}
              </time>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

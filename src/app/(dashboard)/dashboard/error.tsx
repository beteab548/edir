"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center text-center p-8">
      <div className="space-y-4 max-w-md">
        <h1 className="text-2xl font-bold text-red-600">Connection Timeout</h1>
        <p className="text-gray-600">
          Something went wrong while loading the dashboard.
          Please check your internet connection or try refreshing.
        </p>
        <button
          onClick={reset}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Refresh Page
        </button>
      </div>
    </div>
  );
}

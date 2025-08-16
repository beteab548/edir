"use client";

import { useState, useEffect } from "react";
import { mutate } from "swr";

export default function RefreshButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [timer, setTimer] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");

  const ESTIMATED_TIME = 90;

  // Messages to rotate through
  const progressMessages = [
    "🔄 Fetching active members…",
    "📅 Generating missing contribution schedules…",
    "💰 Updating member balances…",
    "⚠️ Calculating penalties for overdue contributions…",
    "📝 Committing new schedules, balances, and penalties…",
    "💳 Applying unallocated balances to penalties and contributions…",
    "✅ Almost done! Finalizing updates…",
  ];

  useEffect(() => {
    if (!loading) return;

    setTimer(ESTIMATED_TIME);
    let messageIndex = 0;

    // Countdown timer
    const timerInterval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Message rotation
    const messageInterval = setInterval(() => {
      setProgressMessage(progressMessages[messageIndex]);
      if (messageIndex < progressMessages.length - 1) {
        messageIndex += 1; // move to next message
      } else {
        clearInterval(messageInterval); // stop on last message
      }
    }, 10000); // rotate every ~13 seconds

    return () => {
      clearInterval(timerInterval);
      clearInterval(messageInterval);
    };
  }, [loading]);

  const handleRefresh = async () => {
    setLoading(true);
    setMessage("");
    setProgressMessage(progressMessages[0]);

    try {
      const res = await fetch("/api/refresh", { method: "POST" });
      const data = await res.json();

      if (res.ok) {
        setMessage("✅ " + data.message);
        mutate("/api/contributions");
        mutate("/api/penalties");
        mutate("/api/members");
      } else {
        setMessage("❌ " + data.message);
      }
    } catch (error) {
      setMessage("❌ Something went wrong");
    } finally {
      setLoading(false);
      // Keep the last progress message visible instead of clearing it
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleRefresh}
        disabled={loading}
        className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 
                1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            {progressMessage || "Refreshing..."}
          </>
        ) : (
          "Refresh Schedules & Penalties"
        )}
      </button>

      {loading && (
        <p className="text-sm text-gray-600">
          Estimated time remaining: {Math.floor(timer / 60)}m {timer % 60}s
        </p>
      )}

      {message && <p className="text-sm text-gray-600">{message}</p>}
    </div>
  );
}

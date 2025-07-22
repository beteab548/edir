"use client";
import { useEffect, useState } from "react";

export default function DateTimeDisplay({ text }: { text?: string }) {
  const [dateStr, setDateStr] = useState("");
  const [timeStr, setTimeStr] = useState("");

  useEffect(() => {
    const now = new Date();
    setDateStr(
      now.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    );
    setTimeStr(now.toLocaleTimeString());
  }, []);

  return (
    <>
      {text === "showall" ? (
      
        <div className="text-xs text-gray-500 flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span>Last Updated At: {timeStr}</span>
        </div>
      ) : (
        <p className="text-gray-500 mt-1 text-sm md:text-base">{dateStr}</p>
      )}
    </>
  );
}

"use client";
import { useState, useEffect } from "react";

interface CardData {
  value: number;
  percentageChange?: number;
}

const UserCard = ({ type }: { type: string }) => {
  const [cardData, setCardData] = useState<CardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cardVariants = {
    odd: "bg-gradient-to-br from-purple-100 to-purple-50 border border-purple-200",
    even: "bg-gradient-to-br from-amber-100 to-amber-50 border border-amber-200",
  };

  const badgeVariants = {
    odd: "bg-purple-100 text-purple-800",
    even: "bg-amber-100 text-amber-800",
  };

  const isOdd = type.length % 2 === 1;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `/api/dashboard/userCards?type=${type.toLowerCase()}`,
          {
            cache: "no-store",
            next: { revalidate: 0 },
          }
        );
        if (!res.ok) throw new Error("Failed to fetch");
        const data: CardData = await res.json();
        setCardData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [type]);

  return (
    <div
      className={`rounded-xl shadow-sm hover:shadow-md transition-all ${
        isOdd ? cardVariants.odd : cardVariants.even
      } p-5 flex-1 min-w-[160px] max-w-[200px] relative`}
    >
      <div className="flex justify-between items-start">
        <span
          className={`text-xs font-medium ${
            isOdd ? badgeVariants.odd : badgeVariants.even
          }  py-1 rounded-full`}
        >
          {type}
        </span>
      </div>

      {loading ? (
        <div className="h-16 flex items-center justify-center">
          <div className="h-6 w-6 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div className="h-16 flex items-center justify-center text-red-500 text-xs">
          {error}
        </div>
      ) : cardData ? (
        <>
          <h1 className="text-3xl font-bold my-4 text-gray-800">
            {cardData.value.toLocaleString()}
          </h1>
          <div className="flex items-center justify-between">
            {cardData.percentageChange !== undefined && (
              <span
                className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  cardData.percentageChange > 0
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {cardData.percentageChange > 0
                  ? `+${cardData.percentageChange}%`
                  : `${cardData.percentageChange}%`}
              </span>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
};

export default UserCard;

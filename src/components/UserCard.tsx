'use client';
import { useState, useEffect } from "react";

interface CardData {
  value: number;
  percentageChange?: number;
}

const UserCard = ({ type }: { type: string }) => {
  const [showDateSelector, setShowDateSelector] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
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

  const isOdd = Math.random() > 0.5;
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const yearOptions = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          type: type.toLowerCase(),
          year: selectedYear.toString(),
          month: (selectedMonth + 1).toString(),
        });

        const res = await fetch(`/api/reports/metrics?${params}`);
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
  }, [type, selectedYear, selectedMonth]);

  const toggleDateSelector = () => setShowDateSelector(!showDateSelector);
  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    setShowDateSelector(false);
  };
  const handleMonthChange = (month: number) => {
    setSelectedMonth(month);
    setShowDateSelector(false);
  };

  return (
    <div
      className={`rounded-xl shadow-sm hover:shadow-md transition-all ${
        isOdd ? cardVariants.odd : cardVariants.even
      } p-5 flex-1 min-w-[160px] max-w-[200px] relative`}
    >
      <div className="flex justify-between items-start">
        <div className="relative">
          <button
            onClick={toggleDateSelector}
            className={`text-xs font-medium ${
              isOdd ? badgeVariants.odd : badgeVariants.even
            } px-2.5 py-1 rounded-full hover:bg-opacity-80 transition-colors flex items-center`}
            disabled={loading}
          >
            {monthNames[selectedMonth]} {selectedYear}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="ml-1"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {showDateSelector && (
            <div className="absolute z-10 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 p-2 w-[180px]">
              <div className="flex justify-between items-center mb-2">
                <select
                  value={selectedYear}
                  onChange={(e) => handleYearChange(parseInt(e.target.value))}
                  className="text-xs bg-gray-50 border border-gray-200 rounded px-2 py-1 focus:outline-none"
                >
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-1">
                {monthNames.map((month, index) => (
                  <button
                    key={month}
                    onClick={() => handleMonthChange(index)}
                    className={`text-xs p-1 rounded hover:bg-gray-100 ${
                      selectedMonth === index ? 'bg-purple-100 text-purple-800' : ''
                    }`}
                  >
                    {month}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <button className="text-gray-400 hover:text-gray-600 transition-colors">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="1" />
            <circle cx="12" cy="5" r="1" />
            <circle cx="12" cy="19" r="1" />
          </svg>
        </button>
      </div>

      {loading ? (
        <div className="h-16 flex items-center justify-center">
          <div className="animate-pulse text-gray-400">Loading...</div>
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
            <h2 className="capitalize text-sm font-medium text-gray-500 tracking-wide">
              {type}
            </h2>
            {cardData.percentageChange !== undefined && (
              <span
                className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  cardData.percentageChange > 0
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
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

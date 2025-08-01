"use client";
import { useState, useEffect } from "react";
import { FiUsers, FiAlertCircle, FiDollarSign, FiUserCheck, FiUserX, FiUserPlus, FiLogOut, FiShieldOff, FiHeart, FiRepeat, FiTrendingUp, FiAlertOctagon, FiCheckCircle, FiAlertTriangle } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

// --- Types and Interfaces ---
interface CardData {
  value: number;
  percentageChange?: number;
}

// --- Helper to select an icon based on the card type ---
const getIconForType = (type: string) => {
  switch (type.toLowerCase()) {
   case "total members":
      return <FiUsers className="text-indigo-500" size={24} />;
    case "active members":
      return <FiUserCheck className="text-green-500" size={24} />;
    case "inactive members":
      return <FiUserX className="text-orange-500" size={24} />;
    case "new members":
      return <FiUserPlus className="text-blue-500" size={24} />;
    case "left members":
      return <FiLogOut className="text-gray-500" size={24} />;

    // --- Sensitive & Special Cases ---
    case "deceased members":
      return <FiShieldOff className="text-slate-600" size={24} />;
    case "deceased relative":
      return <FiHeart className="text-red-500" size={24} />;
    case "role transfer pending":
      return <FiRepeat className="text-teal-500" size={24} />;
 case "inactivated members": // Same icon for consistency, different color for subtlety
      return <FiUserX className="text-slate-600" size={24} />;

    // --- Financial & Penalty Status ---
    case "penalized members":
      return <FiAlertOctagon className="text-red-600" size={24} />;
    case "paid members":
      return <FiCheckCircle className="text-teal-500" size={24} />;
    case "unpaid members":
      return <FiAlertTriangle className="text-amber-500" size={24} />;
    // --- Fallback Icon ---
    default:
      return <FiTrendingUp className="text-purple-500" size={24} />;
  }
};

// --- The Improved UserCard Component ---
const UserCard = ({ type }: { type: string }) => {
  const [cardData, setCardData] = useState<CardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetching logic remains unchanged
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

  const cardAnimation = {
    initial: { opacity: 0, y: 20, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: { duration: 0.4, ease: "easeOut" },
  }as const;

  return (
    <motion.div
      {...cardAnimation}
      className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6 flex flex-col justify-between min-h-[160px] min-w-[180px]"
    >
      {/* --- Card Header --- */}
      <div className="flex justify-between items-center">
        <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 capitalize">
          {type}
        </span>
        <div className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full">
          {getIconForType(type)}
        </div>
      </div>

      {/* --- Card Body (Loading, Error, Data) --- */}
      <div className="flex-grow flex flex-col justify-center items-start mt-4">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full flex items-center justify-center"
            >
              <div className="h-8 w-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full flex items-center justify-center text-red-500 text-center text-xs"
            >
              <FiAlertCircle className="mr-2" />
              {error}
            </motion.div>
          ) : cardData ? (
            <motion.div
              key="data"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full"
            >
              <h2 className="text-4xl font-bold text-gray-800 dark:text-gray-800">
                {cardData.value.toLocaleString()}
              </h2>
              {cardData.percentageChange !== undefined && (
                <div className="flex items-center mt-2">
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      cardData.percentageChange >= 0
                        ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
                        : "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300"
                    }`}
                  >
                    {cardData.percentageChange >= 0 ? "+" : ""}
                    {cardData.percentageChange}%
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                    vs last month
                  </span>
                </div>
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default UserCard;
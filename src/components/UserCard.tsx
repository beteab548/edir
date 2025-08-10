"use client";
import {
  FiUsers,
  FiAlertCircle,
  FiDollarSign,
  FiUserCheck,
  FiUserX,
  FiUserPlus,
  FiLogOut,
  FiShieldOff,
  FiHeart,
  FiRepeat,
  FiTrendingUp,
  FiAlertOctagon,
  FiCheckCircle,
  FiAlertTriangle,
} from "react-icons/fi";
import { motion } from "framer-motion";

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
    case "deceased members":
      return <FiShieldOff className="text-slate-600" size={24} />;
    case "deceased relative":
      return <FiHeart className="text-red-500" size={24} />;
    case "role transfer pending":
      return <FiRepeat className="text-teal-500" size={24} />;
    case "inactivated members":
      return <FiUserX className="text-slate-600" size={24} />;
    case "penalized members":
      return <FiAlertOctagon className="text-red-600" size={24} />;
    case "paid members":
      return <FiCheckCircle className="text-teal-500" size={24} />;
    case "unpaid members":
      return <FiAlertTriangle className="text-amber-500" size={24} />;
    default:
      return <FiTrendingUp className="text-purple-500" size={24} />;
  }
};

interface UserCardProps {
  type: string;
  counts?: number;
}

const UserCard = ({ type, counts }: UserCardProps) => {
  const cardAnimation = {
    initial: { opacity: 0, y: 20, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: { duration: 0.4, ease: "easeOut" },
  } as const;

  return (
    <motion.div
      {...cardAnimation}
      className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6 flex flex-col justify-between min-h-[160px] min-w-[180px]"
    >
      <div className="flex justify-between items-center">
        <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 capitalize">
          {type}
        </span>
        <div className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full">
          {getIconForType(type)}
        </div>
      </div>

      <div className="flex-grow flex flex-col justify-center items-start mt-4">
        {counts !== undefined ? (
          <h2 className="text-4xl font-bold text-gray-800 dark:text-gray-800">
            {counts}
          </h2>
        ) : (
          <div className="h-8 w-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
        )}
      </div>
    </motion.div>
  );
};

export default UserCard;

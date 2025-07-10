"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { usePathname } from "next/navigation";
import { FiAlertCircle } from "react-icons/fi";
import { LuBanknote } from "react-icons/lu";
import { MdGroups } from "react-icons/md";

type reportDropDownType = {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  isHovered?: boolean;
  iconSrc?: string;
};

const reportType = [
  {
    label: "members",
    href: "/reports/members",
    icon: <MdGroups />,
  },
  {
    label: "contribution",
    href: "/reports/contributions",
    icon: <LuBanknote />,
  },
  {
    label: "penalty",
    href: "/reports/penalty",
    icon: <FiAlertCircle />,
  },
];

export default function ReportDropdown({
  icon,
  label,
  isActive,
  isHovered = false,
}: reportDropDownType) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const isAnyPenaltyActive = reportType.some((item) => pathname === item.href);
  return (
    <motion.div
      className={`relative flex flex-col w-full rounded-lg ${
        isActive || isAnyPenaltyActive ? "bg-lamaSkyLight/30" : ""
      }`}
      whileHover={{ backgroundColor: "rgba(209, 233, 255, 0.3)" }}
      transition={{ duration: 0.2 }}
    >
      <motion.button
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center justify-between gap-4 py-3 px-3 rounded-lg w-full transition-colors
          ${
            isActive || isAnyPenaltyActive
              ? "text-lama font-medium"
              : "text-gray-600 hover:text-gray-800"
          }
        `}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-center gap-4">
          <motion.div
            animate={{
              scale: isActive || isHovered || isAnyPenaltyActive ? 1.1 : 1,
              transition: { type: "spring", stiffness: 400, damping: 10 },
            }}
          >
            {icon}
          </motion.div>
          <span className="hidden md:block text-sm">{label}</span>
        </div>
        <motion.div
          animate={{
            rotate: isOpen ? 180 : 0,
            transition: { type: "spring", stiffness: 300, damping: 15 },
          }}
        >
          <ChevronDownIcon className="w-4 h-4 text-current" />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{
              height: "auto",
              opacity: 1,
              transition: {
                height: { duration: 0.3 },
                opacity: { duration: 0.2, delay: 0.1 },
              },
            }}
            exit={{
              height: 0,
              opacity: 0,
              transition: {
                height: { duration: 0.2 },
                opacity: { duration: 0.1 },
              },
            }}
            className="overflow-hidden"
          >
            <div className="mt-1 ml-4 flex flex-col bg-white/80 backdrop-blur-sm rounded-md shadow-sm w-[90%] border border-gray-200 px-2 py-2 gap-1">
              {reportType.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm px-3 py-2 rounded-md flex items-center gap-2 transition-colors
      ${
        pathname === item.href
          ? "bg-lamaSkyLight/40 text-lama font-medium"
          : "text-gray-600 hover:bg-gray-100"
      }
    `}
                >
                  <span className="text-lg text-gray-600">{item.icon}</span>
                  <motion.span
                    whileHover={{ x: 2 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    {item.label}
                  </motion.span>
                  {pathname === item.href && (
                    <motion.span
                      className="w-1.5 h-1.5 bg-lama rounded-full"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.1 }}
                    />
                  )}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

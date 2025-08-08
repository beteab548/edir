"use client";

import { FiAlertCircle } from "react-icons/fi";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { usePathname } from "next/navigation";
import { FiSettings } from "react-icons/fi";
import nProgress from "nprogress";
type PenaltyDropdownProps = {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  isHovered?: boolean;
  iconSrc?: string; // Add this prop for image URL before each penalty item
};

const penaltyItems = [{ label: "Payment", href: "/penalty/payment" }];

export default function PenaltyDropdown({
  icon,
  label,
  isActive,
  isHovered = false,
  iconSrc = "/default-penalty-icon.png", // default image path
}: PenaltyDropdownProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const isAnyPenaltyActive = pathname.startsWith("/penalty");

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
              {penaltyItems?.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => nProgress.start()}
                  className={`text-sm px-3 py-2 rounded-md flex items-center gap-2 transition-colors
                    ${
                      pathname === item.href
                        ? "bg-lamaSkyLight/40 text-lama font-medium"
                        : "text-gray-600 hover:bg-gray-100"
                    }
                  `}
                >
                  <Image
                    src={iconSrc}
                    alt="penalty icon"
                    width={28}
                    height={28}
                    className="rounded-sm"
                    priority={false}
                    unoptimized
                  />
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
              <Link
                key={"penalty managment"}
                href={"/penalty"}
                onClick={() => nProgress.start()}
                className={`text-sm px-3 py-2 rounded-md flex items-center gap-2 transition-colors
                    ${
                      pathname === "/penalty"
                        ? "bg-lamaSkyLight/40 text-lama font-medium"
                        : "text-gray-600 hover:bg-gray-100"
                    }
                  `}
              >
                <FiAlertCircle className="text-red-500 w-5 h-5 mr-2" />

                <motion.span
                  whileHover={{ x: 2 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {"penalty managment"}
                </motion.span>
                {pathname === "/penalty" && (
                  <motion.span
                    className="w-1.5 h-1.5 bg-lama rounded-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  />
                )}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

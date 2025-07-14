"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { usePathname } from "next/navigation";
import { GiPayMoney } from "react-icons/gi";

type ContributionDropdownProps = {
  label: string;
  contributionTypes: { id: number; name: string }[];
  isActive: boolean;
  isHovered?: boolean;
  iconSrc?: string;
};

export default function ContributionDropdown({
  label,
  contributionTypes,
  isActive,
  isHovered = false,
  iconSrc = "/default-icon.png",
}: ContributionDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Check if any contribution type matches the current pathname, using encoded names
  const isAnyTypeActive = contributionTypes.some(
    (type) => pathname === `/contribution/${encodeURIComponent(type.name)}`
  );

  return (
    <motion.div
      className={`relative flex flex-col w-full rounded-lg ${
        isActive || isAnyTypeActive ? "bg-lamaSkyLight/30" : ""
      }`}
      whileHover={{ backgroundColor: "rgba(209, 233, 255, 0.3)" }}
      transition={{ duration: 0.2 }}
    >
      <motion.button
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center justify-between gap-4 py-3 px-3 rounded-lg w-full transition-colors
          ${
            isActive || isAnyTypeActive
              ? "text-lama font-medium"
              : "text-gray-600 hover:text-gray-800"
          }
        `}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-center gap-4">
          <motion.div
            animate={{
              scale: isActive || isHovered || isAnyTypeActive ? 1.1 : 1,
              transition: { type: "spring", stiffness: 400, damping: 10 },
            }}
          >
            <GiPayMoney
              size={20}
              style={{
                fill: "none",
                stroke: "currentColor",
                strokeWidth: 30,
                color: isAnyTypeActive ? "rgb(11, 126, 183) " : "gray",
              }}
            />
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
                height: { duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] },
                opacity: { duration: 0.2, delay: 0.1 },
              },
            }}
            exit={{
              height: 0,
              opacity: 0,
              transition: {
                height: { duration: 0.2, ease: [0.04, 0.62, 0.23, 0.98] },
                opacity: { duration: 0.1 },
              },
            }}
            className="overflow-hidden"
          >
            <div className="mt-1 ml-4 flex flex-col bg-white/80 backdrop-blur-sm rounded-md shadow-sm w-[90%] border border-gray-200 px-2 py-2 gap-1">
              {contributionTypes.map((type) => {
                const encodedName = encodeURIComponent(type.name);
                const isActiveLink =
                  pathname === `/contribution/${encodedName}`;

                return (
                  <Link
                    key={type.id}
                    href={`/contribution/${encodedName}`}
                    className={`text-sm px-1 py-2 rounded-md flex items-center gap-2 transition-colors
                      ${
                        isActiveLink
                          ? "bg-lamaSkyLight/40 text-lama font-medium"
                          : "text-gray-600 hover:bg-gray-100"
                      }
                    `}
                  >
                    <Image
                      src={iconSrc}
                      alt="contribution icon"
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
                      {type.name}
                    </motion.span>
                    {isActiveLink && (
                      <motion.span
                        className="w-1.5 h-1.5 bg-lama rounded-full"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

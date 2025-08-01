"use client";
import NProgress from "nprogress";
import "nprogress/nprogress.css";

import React, { useEffect, useState } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import ContributionDropdown from "./ContributionDropdown";
import PenaltyDropdown from "./penaltyDropdown";
import ReportDropdown from "./reportDropDown";
import { ContributionType } from "@prisma/client";
import { usePathname } from "next/navigation";
import {
  FiHome,
  FiDollarSign,
  FiAlertCircle,
  FiSettings,
  FiLogOut,
  FiMenu,
  FiFileText,
} from "react-icons/fi";
import { LuUsers } from "react-icons/lu";

const menuItems = [
  {
    title: "MENU",
    icon: <FiMenu size={16} className="inline-block mr-1" />,
    items: [
      {
        icon: <FiHome size={20} />,
        label: "Dashboard",
        href: "/dashboard",
        visible: ["admin", "secretary", "chairman"],
      },
      {
        icon: <LuUsers size={20} />,
        label: "Members",
        href: "/list/members",
        visible: ["admin", "secretary"],
      },
      {
        icon: <FiDollarSign size={20} />,
        label: "Contribution",
        href: "/contribution",
        visible: ["admin", "chairman"],
        hasDropdown: true,
      },
      {
        icon: <FiAlertCircle size={20} />,
        label: "Penalty",
        href: "/penalty/payment",
        visible: ["admin", "chairman"],
        hasDropdown: true,
      },
      {
        icon: <FiAlertCircle size={20} />,
        label: "Transfer Role",
        href: "/transferRole",
        visible: ["admin", "secretary"],
        hasDropdown: false,
      },
      {
        icon: <FiFileText size={20} />,
        label: "Report",
        href: "/reports",
        visible: ["admin", "chairman", "secretary"],
        hasDropdown: true,
      },
      {
        icon: <FiSettings size={20} />,
        label: "Settings",
        href: "/configure-setting",
        visible: ["admin", "chairman"],
      },
      {
        icon: <FiLogOut size={20} />,
        label: "Logout",
        href: "/logout",
        visible: ["admin", "chairman", "secretary"],
      },
    ],
  },
];

const Menu = ({ pendingTransfers }: { pendingTransfers: number }) => {
  const { user } = useUser();
  const role = user?.publicMetadata.role as string;
  const pathname = usePathname();
  const { signOut } = useClerk();

  const [contributionTypes, setContributionTypes] = useState<
    ContributionType[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false); // 👈 hydration-safe

  useEffect(() => {
    setMounted(true); // Prevent hydration error

    const fetchTypes = async () => {
      try {
        const res = await fetch("/api/contributions/contributionTypes", {
          cache: "no-store",
          next: { revalidate: 0 },
        });
        const { contributionTypes } = await res.json();
        setContributionTypes(contributionTypes);
      } catch (err) {
        console.error("Error fetching types:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (role) fetchTypes();
  }, [role]);

  if (!user || !role || !mounted) return null;

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href);

  if (isLoading) {
    return (
      <div className="h-[550px] p-4 mt-10 space-y-8 animate-pulse">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-10 bg-gray-300 rounded-md dark:bg-gray-300/20"
          />
        ))}
      </div>
    );
  }

  if (loggingOut) {
    return (
      <div className="flex items-center justify-center h-[550px]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-8 h-8 border-4 border-lamaSky border-t-transparent rounded-full"
        />
        <span className="ml-3 text-gray-600 font-medium animate-pulse">
          Logging out...
        </span>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto h-[550px] overflow-x-hidden pb-6 custom-scrollbar">
      <div className="mt-4 text-sm space-y-6">
        <AnimatePresence mode="wait">
          {menuItems.map(({ title, icon, items }) => {
            const visibleItems = items.filter((item) =>
              item.visible.includes(role)
            );
            if (!visibleItems.length) return null;

            return (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <span className="hidden lg:flex items-center uppercase text-xs font-bold tracking-wide text-gray-500 pl-2 mt-6 font-serif">
                  {icon}
                  {title}
                </span>

                {visibleItems.map((item, index) => {
                  const isItemActive = isActive(item.href);
                  const isItemHovered = hoveredItem === item.label;

                  const sharedProps = {
                    isActive: isItemActive,
                    isHovered: isItemHovered,
                    label: item.label,
                  };

                  const dropdownMotion = {
                    initial: { opacity: 0, x: -10 },
                    animate: { opacity: 1, x: 0 },
                    transition: { delay: 0.05 * index },
                    onHoverStart: () => setHoveredItem(item.label),
                    onHoverEnd: () => setHoveredItem(null),
                  };

                  if (item.hasDropdown) {
                    if (item.label === "Contribution") {
                      return (
                        <motion.div key={item.label} {...dropdownMotion}>
                          <ContributionDropdown
                            {...sharedProps}
                            contributionTypes={contributionTypes}
                            iconSrc="/contributionIcon.png"
                          />
                        </motion.div>
                      );
                    }

                    if (item.label === "Penalty") {
                      return (
                        <motion.div key={item.label} {...dropdownMotion}>
                          <PenaltyDropdown
                            {...sharedProps}
                            icon={<FiAlertCircle size={20} />}
                            iconSrc="/contributionIcon.png"
                          />
                        </motion.div>
                      );
                    }

                    if (item.label === "Report") {
                      return (
                        <motion.div key={item.label} {...dropdownMotion}>
                          <ReportDropdown
                            {...sharedProps}
                            icon={<FiFileText size={20} />}
                            iconSrc="/contributionIcon.png"
                          />
                        </motion.div>
                      );
                    }
                  }

                  const logoutItem = item.label === "Logout";
                  if (item.label === "Transfer Role") {
                    return (
                      <motion.div key={item.label} /* ... motion props ... */>
                        <Link
                          href={item.href} // Your menuItems object already has the correct href
                          onClick={() => NProgress.start()}
                          // Apply the same styling as your other links
                          className={`relative flex items-center justify-between gap-4 rounded-lg px-3 py-3 transition-all duration-300 ${
                            isActive(item.href)
                              ? "bg-lamaSkyLight/80 text-lama font-medium shadow"
                              : "text-gray-600 hover:bg-lamaSkyLight/60 hover:text-gray-800"
                          }`}
                        >
                          {/* Left side content (icon and label) */}
                          <div className="flex items-center gap-4">
                            {React.cloneElement(item.icon, {
                              className: `opacity-90 ${
                                isActive(item.href)
                                  ? "text-lama"
                                  : "text-current"
                              }`,
                            })}
                            <span className="hidden md:block text-sm">
                              {item.label}
                            </span>
                          </div>

                          {/* --- THE NOTIFICATION BADGE --- */}
                          {/* It's wrapped in a div to help with positioning */}
                          <div>
                            {pendingTransfers > 0 && (
                              <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="flex items-center justify-center w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full"
                              >
                                {pendingTransfers}
                              </motion.span>
                            )}
                          </div>
                        </Link>
                      </motion.div>
                    );
                  }
                  return (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * index }}
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.97 }}
                      onHoverStart={() => setHoveredItem(item.label)}
                      onHoverEnd={() => setHoveredItem(null)}
                    >
                      {logoutItem ? (
                        <div
                          onClick={async () => {
                            setLoggingOut(true);
                            await signOut();
                          }}
                          className={`cursor-pointer relative flex items-center gap-4 rounded-lg px-3 py-3 transition-all duration-300
                            ${
                              isItemActive
                                ? "bg-lamaSkyLight/80 text-lama font-medium shadow"
                                : "text-gray-600 hover:bg-lamaSkyLight/60 hover:text-gray-800"
                            }`}
                        >
                          {isItemActive && (
                            <motion.span
                              layoutId="active-indicator"
                              className="absolute left-0 h-8 w-1.5 bg-lama rounded-r-md"
                              initial={{ opacity: 0, scaleY: 0.5 }}
                              animate={{ opacity: 1, scaleY: 1 }}
                              transition={{
                                type: "spring",
                                stiffness: 500,
                                damping: 30,
                              }}
                            />
                          )}

                          <motion.div
                            animate={{
                              scale: isItemActive || isItemHovered ? 1.1 : 1,
                            }}
                            transition={{
                              type: "spring",
                              stiffness: 300,
                              damping: 20,
                            }}
                          >
                            {React.cloneElement(item.icon, {
                              className: `opacity-90 ${
                                isItemActive ? "text-lama" : "text-current"
                              }`,
                            })}
                          </motion.div>

                          <span className="hidden md:block text-sm">
                            {item.label}
                          </span>

                          {(isItemActive || isItemHovered) && (
                            <motion.div
                              className="absolute right-4 w-1.5 h-1.5 bg-lama rounded-full"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.1 }}
                            />
                          )}
                        </div>
                      ) : (
                        <Link
                          href={item.href}
                          onClick={() => {
                            NProgress.start();
                          }}
                          className={`relative flex items-center gap-4 rounded-lg px-3 py-3 transition-all duration-300
                            ${
                              isItemActive
                                ? "bg-lamaSkyLight/80 text-lama font-medium shadow"
                                : "text-gray-600 hover:bg-lamaSkyLight/60 hover:text-gray-800"
                            }`}
                        >
                          {isItemActive && (
                            <motion.span
                              layoutId="active-indicator"
                              className="absolute left-0 h-8 w-1.5 bg-lama rounded-r-md"
                              initial={{ opacity: 0, scaleY: 0.5 }}
                              animate={{ opacity: 1, scaleY: 1 }}
                              transition={{
                                type: "spring",
                                stiffness: 500,
                                damping: 30,
                              }}
                            />
                          )}

                          <motion.div
                            animate={{
                              scale: isItemActive || isItemHovered ? 1.1 : 1,
                            }}
                            transition={{
                              type: "spring",
                              stiffness: 300,
                              damping: 20,
                            }}
                          >
                            {React.cloneElement(item.icon, {
                              className: `opacity-90 ${
                                isItemActive ? "text-lama" : "text-current"
                              }`,
                            })}
                          </motion.div>

                          <span className="hidden md:block text-sm">
                            {item.label}
                          </span>

                          {(isItemActive || isItemHovered) && (
                            <motion.div
                              className="absolute right-4 w-1.5 h-1.5 bg-lama rounded-full"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.1 }}
                            />
                          )}
                        </Link>
                      )}
                    </motion.div>
                  );
                })}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Menu;

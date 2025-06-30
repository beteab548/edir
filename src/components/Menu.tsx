"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import ContributionDropdown from "./ContributionDropdown";
import PenaltyDropdown from "./penaltyDropdown";
import { ContributionType } from "@prisma/client";
import { usePathname } from "next/navigation";
import {
  FiHome,
  FiUsers,
  FiDollarSign,
  FiAlertCircle,
  FiSettings,
  FiLogOut,
  FiMenu,
  FiMoreHorizontal,
} from "react-icons/fi";

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
        icon: <FiUsers size={20} />,
        label: "Members",
        href: "/list/members",
        visible: ["admin", "secretary"],
      },
      {
        icon: <FiDollarSign size={20} />,
        label: "Contribution",
        href: "/Contribution",
        visible: ["admin", "chairman"],
        hasDropdown: true,
      },
      {
        icon: <FiAlertCircle size={20} />,
        label: "Penalty",
        href: "/penalty",
        visible: ["admin", "chairman"],
        hasDropdown: true,
      },
    ],
  },
  {
    title: "OTHER",
    icon: <FiMoreHorizontal size={16} className="inline-block mr-1 " />,
    items: [
      {
        icon: <FiSettings size={20} />,
        label: "Settings",
        href: "/configure-setting",
        visible: ["admin", "chairman", "secretary"],
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

const Menu = () => {
  const { user } = useUser();
  const role = user?.publicMetadata.role as string;
  const pathname = usePathname();

  const [contributionTypes, setContributionTypes] = useState<ContributionType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const res = await fetch("/api/contributions/contributionTypes");
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

  if (!user || !role) return null;

  const isActive = (href: string) => pathname === href || pathname.startsWith(href);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[550px]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-8 h-8 border-4 border-lamaSky border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="overflow-y-auto h-[550px] overflow-x-hidden pb-6 custom-scrollbar">
      <div className="mt-4 text-sm space-y-6">
        <AnimatePresence mode="wait">
          {menuItems.map(({ title, icon, items }) => {
            const visibleItems = items.filter((item) => item.visible.includes(role));
            if (!visibleItems.length) return null;

            return (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <span className="hidden lg:flex items-center uppercase text-xs font-bold tracking-wide text-gray-700 pl-2 mt-6 font-serif">
                  {icon}
                  {title}
                </span>

                {visibleItems.map((item, index) => {
                  const isItemActive = isActive(item.href);
                  const isItemHovered = hoveredItem === item.label;

                  if (item.hasDropdown && item.label === "Contribution") {
                    return (
                      <motion.div
                        key={item.label}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 * index }}
                        onHoverStart={() => setHoveredItem(item.label)}
                        onHoverEnd={() => setHoveredItem(null)}
                      >
                        <ContributionDropdown
                          iconSrc="/contributionIcon.png"
                          icon={<FiDollarSign size={20} />}
                          label={item.label}
                          contributionTypes={contributionTypes}
                          isActive={isItemActive}
                          isHovered={isItemHovered}
                        />
                      </motion.div>
                    );
                  }

                  if (item.hasDropdown && item.label === "Penalty") {
                    return (
                      <motion.div
                        key={item.label}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 * index }}
                        onHoverStart={() => setHoveredItem(item.label)}
                        onHoverEnd={() => setHoveredItem(null)}
                      >
                        <PenaltyDropdown
                          iconSrc="/contributionIcon.png"
                          icon={<FiAlertCircle size={20} />}
                          label={item.label}
                          isActive={isItemActive}
                          isHovered={isItemHovered}
                        />
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
                      <Link
                        href={item.href}
                        className={`relative flex items-center gap-4 rounded-lg px-3 py-3 transition-all duration-300
                          ${
                            isItemActive
                              ? "bg-lamaSkyLight/80 text-lama font-medium shadow"
                              : "text-gray-600 hover:bg-lamaSkyLight/60 hover:text-gray-800"
                          }
                        `}
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

                        <span className="hidden md:block text-sm">{item.label}</span>

                        {(isItemActive || isItemHovered) && (
                          <motion.div
                            className="absolute right-4 w-1.5 h-1.5 bg-lama rounded-full"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.1 }}
                          />
                        )}
                      </Link>
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

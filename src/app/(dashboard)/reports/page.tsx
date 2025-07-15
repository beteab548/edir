export const dynamic = "force-dynamic";

"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FiUsers, FiFileText, FiAlertCircle } from "react-icons/fi";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const reports = [
  {
    title: "Member Report",
    description:
      "View and export member details and statuses by dates and filters.",
    icon: <FiUsers className="text-blue-600 text-3xl" />,
    href: "/reports/members",
  },
  {
    title: "Contribution Report",
    description: "Analyze member contributions by type or date range.",
    icon: <FiFileText className="text-green-600 text-3xl" />,
    href: "/reports/contributions",
  },
  {
    title: "Penalty Report",
    description:
      "Check penalties applied and payment status, and apply filters. ",
    icon: <FiAlertCircle className="text-red-600 text-3xl" />,
    href: "/reports/penalty",
  },
];

export default function ReportsPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();

  const [hasError, setHasError] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        if (!isLoaded) return; // wait for clerk to load

        if (!isSignedIn) {
          router.push("/sign-in");
          return;
        }

        setHasError(false);
      } catch (e) {
        setHasError(true);
      } finally {
        setCheckingAuth(false);
      }
    }
    checkAuth();
  }, [isLoaded, isSignedIn, user, router]);

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-start justify-start p-8">
        <div className="space-y-8 max-w-6xl w-full">
          {/* Header skeleton - now left-aligned */}
          <div className="space-y-4 text-left">
            <div className="h-10 bg-gray-200 rounded w-64 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-96 animate-pulse" />
          </div>

          {/* Cards skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((item) => (
              <div key={item} className="bg-white rounded-lg shadow-md p-6">
                <div className="h-8  bg-gray-200 rounded w-1/6 mb-4 animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-full mb-2 animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-5/6 mb-2 animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-6 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-6">
        <h1 className="text-2xl font-bold text-red-600 mb-4">
          Connection Lost
        </h1>
        <p className="text-gray-600 mb-6">
          Something went wrong while loading reports. Please check your internet
          connection and try again.
        </p>
        <button
          onClick={() => {
            setHasError(false);
            setCheckingAuth(true);
          }}
          className="px-5 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Reports</h1>
      <p className="m-4">Choose Reports to View or To Export</p>
      <div className="grid md:grid-cols-3 gap-6">
        {reports.map((report, idx) => (
          <Link href={report.href} key={idx}>
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="cursor-pointer border border-gray-200 rounded-2xl p-5 shadow-sm bg-white hover:shadow-lg transition-all"
            >
              <div className="mb-4">{report.icon}</div>
              <h2 className="text-xl font-semibold mb-1">{report.title}</h2>
              <p className="text-gray-600 text-sm">{report.description}</p>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}

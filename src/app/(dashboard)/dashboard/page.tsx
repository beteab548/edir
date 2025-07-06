import { currentUser } from "@clerk/nextjs/server";
import { generateContributionSchedulesForAllActiveMembers } from "@/lib/services/generateSchedulesForAllMembers";
import PenaltyChart from "@/components/penaltyBarChart";
import MemberDistribution from "@/components/CountChart";
import FinanceChart from "@/components/ContributionChart";
import UserCard from "@/components/UserCard";
import prisma from "@/lib/prisma";
import RelativeRelationsChart from "@/components/relativesChart";
import {
  FiUsers,
  FiPieChart,
  FiUserCheck,
  FiClock,
  FiActivity,
} from "react-icons/fi";
import Link from "next/link";
import Activity from "@/components/activity";
generateContributionSchedulesForAllActiveMembers();
const AdminPage = async ({}: {}) => {
  const user = await currentUser();
  const role = user?.publicMetadata?.role as string;
  const contributionTypes = await prisma.contributionType.findMany({
    select: { name: true },
  });
  const penalties = await prisma.penalty.findMany();
  const penaltyTypes = Array.from(new Set(penalties.map((p) => p.penalty_type)))
    .filter((name): name is string => typeof name === "string" && name !== null)
    .map((name) => ({ name }));
  const penalty = await prisma.penalty.findMany();
  const newMembers = await prisma.member.count({
    where: {
      member_type: "New",
      joined_date: {
        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      },
    },
  });
  const isSecretary = role === "secretary";
  const isChairman = role === "chairman";

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                Welcome back, {user?.firstName}!
              </h1>
              <p className="text-gray-500 mt-1 text-sm md:text-base">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-xs p-3 border border-gray-200 w-full md:w-auto">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                </div>
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  <FiClock className="w-3 h-3" />
                  Last Updated At: {new Date().toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
        </header>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-6">
            {isSecretary && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <UserCard type="New Members" />
                  <UserCard type="Left Members" />
                  <UserCard type="Total Members" />
                  <UserCard type="Deceased Members" />
                  <UserCard type="Active Members" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg shadow-xs p-5 border border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                          <FiUsers className="w-5 h-5" />
                        </div>
                        <div>
                          <h2 className="text-lg font-semibold text-gray-800">
                            Member Distribution
                          </h2>
                          <p className="text-sm text-gray-500">
                            Breakdown by gender type
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="px-3 py-1 text-xs bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors">
                          All Active Members
                        </button>
                      </div>
                    </div>
                    <div className="h-72">
                      <MemberDistribution />
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-xs p-5 border border-gray-200">
                    <div className="h-72">
                      <RelativeRelationsChart apiUrl="/api/reports/relatives" />
                    </div>
                  </div>
                </div>
              </>
            )}
            <div className="grid grid-cols-1 gap-6">
              {isChairman && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-4">
                    <UserCard type="Penalized Members" />
                    <UserCard type="Paid Members" />
                    <UserCard type="unpaid Members" />
                    <UserCard type="Members set to inactivation" />
                  </div>
                  <div className="bg-white rounded-lg mb-16">
                    <div className="h-[500px] ">
                      <FinanceChart contributionTypes={contributionTypes} />
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-2 shadow-md mb-4  ">
                    <div>
                      <PenaltyChart penaltyTypes={penaltyTypes} />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-lg shadow-xs p-5 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                  <FiActivity className="w-5 h-5" />
                </div>
                Quick Actions
              </h3>
              <div className="space-y-2">
                <Link
                  href={isSecretary ? "/list/addNewMember" : "/contribution"}
                  className="block w-full"
                >
                  <button className="w-full flex items-center justify-between p-3 bg-indigo-50 text-indigo-700 rounded-md hover:bg-indigo-100 transition-colors text-sm font-medium">
                    <span>
                      {isSecretary ? "Add New Member" : "Check Contribution"}
                    </span>
                    <FiUserCheck className="w-4 h-4" />
                  </button>
                </Link>
                <Link
                  href={isSecretary ? "/list/members" : "/penalty"}
                  className="block w-full"
                >
                  <button className="w-full flex items-center justify-between p-3 bg-green-50 text-green-700 rounded-md hover:bg-green-100 transition-colors text-sm font-medium">
                    <span>{isSecretary ? "Members" : "Check Penalty"}</span>
                    <FiUsers className="w-4 h-4" />
                  </button>
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-lg ">
              {isChairman ? (
                <Activity type="chairman" />
              ) : (
                <Activity type="secretary" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;

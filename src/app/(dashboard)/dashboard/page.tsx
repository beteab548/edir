import { currentUser } from "@clerk/nextjs/server";
import { generateContributionSchedulesForAllActiveMembers } from "@/lib/services/generateSchedulesForAllMembers";
import PenaltyChart from "@/components/penaltyBarChart";
import MemberDistribution from "@/components/CountChart";
import FinanceChart from "@/components/ContributionChart";
import UserCard from "@/components/UserCard";
import prisma from "@/lib/prisma";
import RelativeRelationsChart from "@/components/relativesChart";
import { FiUsers, FiPieChart, FiBarChart2, FiUserCheck } from "react-icons/fi";
import Link from "next/link";
import Activity from "@/components/activity";

const AdminPage = async ({}: {}) => {
  const user = await currentUser();
  const role = user?.publicMetadata?.role as string;

  const contributionTypes = await prisma.contributionType.findMany({
    select: { name: true },
  });
  const newMembers = await prisma.member.count({
    where: {
      member_type: "New",
      joined_date: {
        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      },
    },
  });
  const total = await prisma.member.count();
  const active = await prisma.member.count({ where: { status: "Active" } });

  const summary = `${active} / ${total}`;
  const isSecretary = role === "secretary";
  const isChairman = role === "chairman";
  generateContributionSchedulesForAllActiveMembers();
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      {/* Dashboard Header */}
      <header className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Dashboard Overview
            </h1>
            <p className="text-gray-500 mt-2">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Status Bar */}
        <div className="mt-6 bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-sm font-medium text-gray-700">
                System Operational
              </span>
            </div>
            <div className="text-sm text-gray-500">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      </header>
      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column - Stats and Charts */}
        <div className="lg:col-span-3 space-y-6">
          {/* Stats Cards Row */}
          {isSecretary && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:shadow-md transition-all duration-300">
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-blue-100 text-blue-600 mr-4">
                    <FiUsers className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      New Members
                    </p>
                    <p className="text-2xl font-semibold text-gray-800">
                      {newMembers}
                    </p>
                  </div>
                </div>
              </div>

              <UserCard type="Left Members" />

              <UserCard type="Total Members" />

              <UserCard type="Deceased Members" />

              <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:shadow-md transition-all duration-300">
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-green-100 text-green-600 mr-4">
                    <FiPieChart className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Active Members</p>
                    <p className="text-sm font-semibold pr-1 text-gray-800">
                      {summary}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* Charts Section */}
          <div className="grid grid-cols-1 gap-6">
            {isSecretary && (
              <>
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all duration-300">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                        <div className="p-2 mr-3 rounded-lg bg-indigo-100 text-indigo-600">
                          <FiUsers className="w-5 h-5" />
                        </div>
                        Member Distribution
                      </h2>
                      <p className="text-sm text-gray-500 mt-1">
                        Breakdown by Gender type
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                        All Time
                      </button>
                    </div>
                  </div>
                  <div className="h-80">
                    <MemberDistribution />
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all duration-300">
                  <div className="h-96">
                    <RelativeRelationsChart apiUrl="/api/reports/relatives" />
                  </div>
                </div>
              </>
            )}
            {isChairman && (
              <>
                <div className=" rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all duration-300">
                  <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-all duration-300 mb-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                          <div className="p-2 mr-3 rounded-lg bg-green-100 text-green-600"></div>
                          Financial Contributions
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                          Monthly performance
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {/* <button className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200">
                          <FiCalendar className="w-4 h-4 text-gray-600" />
                        </button> */}
                        {/* <button className="px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                          Export Report
                        </button> */}
                      </div>
                    </div>
                    <div className="h-[500px]">
                      <FinanceChart contributionTypes={contributionTypes} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-6 bg-white">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                        <div className="p-2 mr-3 rounded-lg bg-amber-100 text-amber-600">
                          <FiBarChart2 className="w-5 h-5" />
                        </div>
                        Penalty Analysis
                      </h2>
                      <p className="text-sm text-gray-500 mt-1">
                        Months Overview
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">Filter:</span>
                      <select className="bg-gray-100 border-0 rounded-lg px-3 py-1 focus:ring-2 focus:ring-indigo-500">
                        <option>This Month</option>
                        <option>Last Month</option>
                        <option>This Quarter</option>
                      </select>
                    </div>
                  </div>
                  <div className="h-96">
                    <PenaltyChart />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <div className="p-2 mr-2 rounded-lg bg-blue-100 text-blue-600">
                <FiUserCheck className="w-5 h-5" />
              </div>
              Quick Actions
            </h3>
            <div className="space-y-3">
              <button className="w-full flex items-center justify-between p-3 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors">
                <Link
                  href={isSecretary ? "/list/addNewMember" : "/contribution"}
                >
                  {isSecretary ? "Add New Member" : "Check Contribution"}
                </Link>
                <FiUserCheck className="w-4 h-4" />
              </button>
              <button className="w-full flex items-center justify-between p-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors">
                <Link href={isSecretary ? "/list/members" : "/penalty"}>
                  {isSecretary ? "Members" : "Check Penalty"}
                </Link>
                <FiUsers className="w-4 h-4" />
              </button>
            </div>
          </div>
          {isChairman ? (
            <Activity type="chairman" />
          ) : (
            <Activity type="secretary" />
          )}
        </div>
      </div>
    </div>
  );
};
export default AdminPage;

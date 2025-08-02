export const dynamic = "force-dynamic";

import { currentUser } from "@clerk/nextjs/server";
import { generateContributionSchedulesForAllActiveMembers } from "@/lib/services/generateSchedulesForAllMembers";
import PenaltyChart from "@/components/penaltyBarChart";
import MemberDistribution from "@/components/MembersCountChart";
import FinanceChart from "@/components/ContributionChart";
import UserCard from "@/components/UserCard";
import prisma from "@/lib/prisma";
import RelativeRelationsChart from "@/components/relativesChart";
import { FiUsers, FiUserCheck, FiFileText, FiActivity } from "react-icons/fi";
import Activity from "@/components/activity";
import { redirect } from "next/navigation";
import LinkButtonWithProgress from "@/components/ui/LinkButtonWithProgress";
import DateTimeDisplay from "@/components/ui/datetimeshower";

const AdminPage = async () => {
  try {
    // This is a long-running task, consider moving it to a cron job or webhook if it causes timeouts.
    await generateContributionSchedulesForAllActiveMembers();

    const user = await currentUser();
    if (!user) redirect("/sign-in");

    const role = user?.publicMetadata?.role as string;

    // --- 1. DEFINE ALL ROLE FLAGS ---
    const isSecretary = role === "secretary";
    const isChairman = role === "chairman";
    const isAdmin = role === "admin"; // The new flag for the admin role

    // Fetch data needed for all roles
    const [contributionTypes, penalties] = await Promise.all([
      prisma.contributionType.findMany({ select: { name: true } }),
      prisma.penalty.findMany(),
    ]);

    const penaltyTypes = Array.from(
      new Set(penalties.map((p: any) => p.penalty_type))
    )
      .filter(
        (name): name is string => typeof name === "string" && name !== null
      )
      .map((name: any) => ({ name }));

    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <header className="mb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-600">
                  Welcome back, {user?.firstName}
                </h1>
                <DateTimeDisplay />
              </div>
              <div className="bg-white rounded-lg shadow-xs p-3 border border-gray-200 w-full md:w-auto">
                <DateTimeDisplay text="showall" />
              </div>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3 space-y-6">
              {/* --- 2. SECRETARY & ADMIN SECTION --- */}
              {/* This section will now render if the role is 'secretary' OR 'admin' */}
              {(isSecretary || isAdmin) && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
                    <UserCard type="Total Members" />
                    <UserCard type="Active Members" />
                    <UserCard type="Inactive Members" />
                    <UserCard type="New Members" />
                    <UserCard type="Deceased Members" />
                    <UserCard type="Deceased Relative" />
                    <UserCard type="Role Transfer Pending" />
                    <UserCard type="Left Members" />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg shadow-xs p-5 border border-gray-200 lg:col-span-1">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                          <FiUsers className="w-5 h-5" />
                        </div>
                        <div>
                          <h2 className="text-sm font-semibold text-gray-800">
                            Member Distribution
                          </h2>
                          <p className="text-xs text-gray-500">By gender</p>
                        </div>
                      </div>
                      <div className="h-72">
                        <MemberDistribution />
                      </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-xs p-5 border border-gray-200 lg:col-span-2">
                      <div className="h-72">
                        <RelativeRelationsChart apiUrl="/api/dashboard/relatives" />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* --- 3. CHAIRMAN & ADMIN SECTION --- */}
              {/* This section will now render if the role is 'chairman' OR 'admin' */}
              {(isChairman || isAdmin) && (
                <div className="mb-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                    <UserCard type="Penalized Members" />
                    <UserCard type="Paid Members" />
                    <UserCard type="Unpaid Members" />
                    <UserCard type="Inactivated Members" />
                  </div>

                  <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-xs">
                    <div className="h-[530px]">
                      <FinanceChart contributionTypes={contributionTypes} />
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow-xs p-4 border border-gray-200 mt-10">
                    <PenaltyChart penaltyTypes={penaltyTypes} />
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-1 space-y-8">
              <div className="bg-white rounded-lg shadow-xs p-5 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                    <FiActivity className="w-5 h-5" />
                  </div>
                  Quick Actions
                </h3>
                <div className="space-y-2">
                  {/* --- 4. QUICK ACTIONS LOGIC FOR ADMIN --- */}
                  {/* Admin will see "Add New Member" */}
                  <LinkButtonWithProgress
                    href={
                      isSecretary || isAdmin
                        ? "/list/addNewMember"
                        : "/contribution"
                    }
                  >
                    <button className="w-full flex items-center justify-between p-3 mb-2 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 text-sm font-medium">
                      <span>
                        {isSecretary || isAdmin
                          ? "Add New Member"
                          : "Check Contribution"}
                      </span>
                      <FiUserCheck className="w-4 h-4" />
                    </button>
                  </LinkButtonWithProgress>

                  {/* Admin will see "Members List" */}
                  <LinkButtonWithProgress
                    href={isSecretary || isAdmin ? "/list/members" : "/penalty"}
                  >
                    <button className="w-full flex items-center justify-between p-3 mb-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 text-sm font-medium">
                      <span>
                        {isSecretary || isAdmin
                          ? "Members List"
                          : "Check Penalty"}
                      </span>
                      <FiUsers className="w-4 h-4" />
                    </button>
                  </LinkButtonWithProgress>

                  <LinkButtonWithProgress href="/reports">
                    <button className="w-full flex items-center justify-between p-3 mb-2 bg-green-50 text-green-700 rounded-md hover:bg-green-100 text-sm font-medium">
                      <span>Check Reports</span>
                      <FiFileText className="w-4 h-4" />
                    </button>
                  </LinkButtonWithProgress>
                </div>
              </div>

              <div className="bg-white rounded-lg">
                <Activity type={role} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("AdminPage error:", error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center space-y-6 max-w-md">
          <h1 className="text-3xl font-bold text-red-600">
            Connection Issue Detected
          </h1>
          <p className="text-gray-700">
            We were unable to load your dashboard due to a network or server
            error. Please try the following:
          </p>
          <ul className="text-left text-sm text-gray-600 list-disc list-inside space-y-1">
            <li>Check your internet connection.</li>
            <li>Refresh the page.</li>
            <li>Try again in a few minutes.</li>
            <li>Contact support if the issue persists.</li>
            <li>too Many requests .</li>
          </ul>
        </div>{" "}
      </div>
    );
  }
};

export default AdminPage;

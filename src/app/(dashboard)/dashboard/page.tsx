export const dynamic = "force-dynamic";

import { currentUser } from "@clerk/nextjs/server";
import { generateContributionSchedulesForAllActiveMembers } from "@/lib/services/generateSchedulesForAllMembers";
import PenaltyChart from "@/components/penaltyBarChart";
import MemberDistribution from "@/components/MembersCountChart";
import FinanceChart from "@/components/ContributionChart";
import UserCard from "@/components/UserCard";
import prisma from "@/lib/prisma";
import RelativeRelationsChart from "@/components/relativesChart";
import {
  FiUsers,
  FiUserCheck,
  FiFileText,
  FiActivity,
  FiTrendingDown,
  FiDollarSign,
  FiUserPlus,
} from "react-icons/fi";
import Activity from "@/components/activity";
import { redirect } from "next/navigation";
import LinkButtonWithProgress from "@/components/ui/LinkButtonWithProgress";
import DateTimeDisplay from "@/components/ui/datetimeshower";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import AuditActivity from "@/components/auditAcivity";

// --- NEW COMPONENT: Recently Joined Members ---
async function RecentMembers() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/dashboard/recent-members`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch recent members data");
    }

    const members: {
      id: number;
      first_name: string;
      last_name: string;
      image_url?: string | null;
      created_at: string;
    }[] = await response.json();

    return (
      <div className="bg-white rounded-lg shadow-xs p-5 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-50 text-green-600">
            <FiUserPlus className="w-5 h-5" />
          </div>
          Recently Joined Members
        </h3>
        <div className="space-y-4">
          {members.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              No new members in the last 30 days.
            </p>
          ) : (
            members.map((member) => (
              <div key={member.id} className="flex items-center gap-3">
                <div className="relative w-10 h-10">
                  {member.image_url ? (
                    <Image
                      src={member.image_url}
                      alt={`${member.first_name}'s profile`}
                      layout="fill"
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="font-bold text-gray-500">
                        {member.first_name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm text-gray-800">
                    {member.first_name} {member.last_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    Joined {formatDistanceToNow(new Date(member.created_at))}{" "}
                    ago
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error fetching recent members:", error);
    return (
      <div className="bg-white rounded-lg shadow-xs p-5 border border-red-200">
        <h3 className="text-lg font-semibold text-red-700 mb-2">
          Could not load recent members.
        </h3>
        <p className="text-sm text-red-600">
          Please check the server connection.
        </p>
      </div>
    );
  }
}

const AdminPage = async () => {
  try {
    await generateContributionSchedulesForAllActiveMembers();

    const user = await currentUser();
    if (!user) redirect("/sign-in");

    const role = user?.publicMetadata?.role as string;

    const isSecretary = role === "secretary";
    const isChairman = role === "chairman";
    const isAdmin = role === "admin";

    const [contributionTypes, penalties] = await Promise.all([
      prisma.contributionType.findMany({ select: { name: true } }),
      prisma.penalty.findMany(),
    ]);

    const penaltyTypes = Array.from(
      new Set(penalties.map((p: any) => p.penalty_type))
    )
      .filter((name): name is string => name != null)
      .map((name: any) => ({ name }));

    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <header className="mb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-700">
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
              {/* --- SECRETARY-ONLY VIEW --- */}
              {isSecretary && (
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

              {/* --- CHAIRMAN-ONLY VIEW --- */}
              {isChairman && (
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

              {/* --- ADMIN-ONLY VIEW --- */}
              {isAdmin && (
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
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
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
                    <div className="bg-white rounded-lg shadow-xs p-5 border border-gray-200 lg:col-span-1">
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
                  {isSecretary && (
                    <>
                      <LinkButtonWithProgress href="/list/addNewMember">
                        <button className="w-full flex items-center justify-between p-3 m-2 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 text-sm font-medium">
                          <span>Add New Member</span>
                          <FiUserCheck className="w-4 h-4" />
                        </button>
                      </LinkButtonWithProgress>
                      <LinkButtonWithProgress href="/list/members">
                        <button className="w-full flex items-center justify-between p-3 m-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 text-sm font-medium">
                          <span>Members List</span>
                          <FiUsers className="w-4 h-4" />
                        </button>
                      </LinkButtonWithProgress>
                      <LinkButtonWithProgress href="/reports">
                        <button className="w-full flex items-center justify-between p-3 m-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm font-medium">
                          <span>Check Reports</span>
                          <FiFileText className="w-4 h-4" />
                        </button>
                      </LinkButtonWithProgress>
                    </>
                  )}
                  {isChairman && (
                    <>
                      <LinkButtonWithProgress href="/contribution">
                        <button className="w-full flex items-center justify-between p-3 m-2 bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200 text-sm font-medium">
                          <span>Check Contribution</span>
                          <FiDollarSign className="w-4 h-4" />
                        </button>
                      </LinkButtonWithProgress>
                      <LinkButtonWithProgress href="/penalty">
                        <button className="w-full flex items-center justify-between p-3 m-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 text-sm font-medium">
                          <span>Check Penalty</span>
                          <FiTrendingDown className="w-4 h-4" />
                        </button>
                      </LinkButtonWithProgress>
                      <LinkButtonWithProgress href="/reports">
                        <button className="w-full flex items-center justify-between p-3 m-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm font-medium">
                          <span>Check Reports</span>
                          <FiFileText className="w-4 h-4" />
                        </button>
                      </LinkButtonWithProgress>
                    </>
                  )}
                  {isAdmin && (
                    <>
                      <LinkButtonWithProgress href="/list/addNewMember">
                        <button className="w-full flex items-center justify-between p-3 m-2 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 text-sm font-medium">
                          <span>Add New Member</span>
                          <FiUserCheck className="w-4 h-4" />
                        </button>
                      </LinkButtonWithProgress>
                      <LinkButtonWithProgress href="/list/members">
                        <button className="w-full flex items-center justify-between p-3 m-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 text-sm font-medium">
                          <span>Members List</span>
                          <FiUsers className="w-4 h-4" />
                        </button>
                      </LinkButtonWithProgress>
                      <LinkButtonWithProgress href="/contribution">
                        <button className="w-full flex items-center justify-between p-3 m-2 bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200 text-sm font-medium">
                          <span>Check Contribution</span>
                          <FiDollarSign className="w-4 h-4" />
                        </button>
                      </LinkButtonWithProgress>
                      <LinkButtonWithProgress href="/penalty">
                        <button className="w-full flex items-center justify-between p-3 m-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 text-sm font-medium">
                          <span>Check Penalty</span>
                          <FiTrendingDown className="w-4 h-4" />
                        </button>
                      </LinkButtonWithProgress>
                      <LinkButtonWithProgress href="/reports">
                        <button className="w-full flex items-center justify-between p-3 m-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm font-medium">
                          <span>Check Reports</span>
                          <FiFileText className="w-4 h-4" />
                        </button>
                      </LinkButtonWithProgress>
                    </>
                  )}
                </div>
              </div>

              {/* --- ACTIVITY & RECENT MEMBERS SECTION --- */}
              <div className="bg-white rounded-lg">
              {isSecretary && <Activity type="secretary" />}
              {isChairman && <Activity type="chairman" />}
              </div>
              {isAdmin && <Activity type="secretary" />}
              {isAdmin && <Activity type="chairman" />}
              {isAdmin && <AuditActivity  />}
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
            <li>Too many requests.</li>
          </ul>
        </div>
      </div>
    );
  }
};

export default AdminPage;

import { currentUser } from "@clerk/nextjs/server";
import Announcements from "@/components/Announcements";
import PenaltyChart from "@/components/penaltyBarChart";
import MemberDistribution from "@/components/CountChart";
import EventCalendar from "@/components/EventCalendar";
import FinanceChart from "@/components/ContributionChart";
import UserCard from "@/components/UserCard";
import prisma from "@/lib/prisma";

const AdminPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
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
  const isSecretary = role === "secretary";
  const isChairman = role === "chairman";

  return (
    <div className="p-4 flex gap-4 flex-col md:flex-row">
      {/* LEFT SECTION */}
      <div className="w-full lg:w-2/3 flex flex-col gap-8">
        {/* USER CARDS (SECRETARY ONLY) */}
        {isSecretary && (
          <>
            <div className="flex gap-4 justify-between flex-wrap">
              <UserCard type="New Members" />
              <UserCard type="Left Members" />
              <UserCard type="total members" />
              <UserCard type="Deceased members" />
            </div>
            <div className="flex gap-4 flex-col lg:flex-row">
              <div className="w-full lg:w-1/3 h-[350px]">
                <MemberDistribution />
              </div>
            </div>
          </>
        )}
        {isChairman && (
          <>
            <div className="flex gap-4 flex-col lg:flex-row">
              <div className="w-full  h-[450px]">
                <PenaltyChart />
              </div>
            </div>
            <div className="w-full h-[600px]">
              <FinanceChart contributionTypes={contributionTypes} />
            </div>
          </>
        )}
      </div>

      {/* RIGHT SECTION (Shared) */}
      <div className="w-full lg:w-1/3 flex flex-col gap-6">
        <EventCalendar />
        <Announcements />
      </div>
    </div>
  );
};

export default AdminPage;

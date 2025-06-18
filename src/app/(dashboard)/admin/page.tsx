import Announcements from "@/components/Announcements";
import AttendanceChart from "@/components/penaltyBarChart";
import AttendanceChartContainer from "@/components/AttendanceChartContainer";
import CountChart from "@/components/CountChart";
import CountChartContainer from "@/components/CountChartContainer";
import EventCalendar from "@/components/EventCalendar";
import EventCalendarContainer from "@/components/EventCalendarContainer";
import FinanceChart from "@/components/ContributionChart";
import UserCard from "@/components/UserCard";
import prisma from "@/lib/prisma";

const AdminPage = async ({
  searchParams,
}: {
  searchParams: { [keys: string]: string | undefined };
}) => {
  const contributionTypes = await prisma.contributionType.findMany({
    select: { name: true },
  });
  const totalMembers = await prisma.member.count();

  const newMembers = await prisma.member.count({
    where: {
      member_type: "New",
      joined_date: {
        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // This month
      },
    },
  });

  const leavingMembers = await prisma.member.count({
    where: {
      end_date: {
        not: null,
      },
    },
  });
  const lastMonthNewMembers = await prisma.member.count({
    where: {
      joined_date: {
        gte: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
        lt: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      },
    },
  });

  const newMembersChange = lastMonthNewMembers
    ? ((newMembers - lastMonthNewMembers) / lastMonthNewMembers) * 100
    : 0;

  // const adminMembers = await prisma.member.count({
  //   where: {
  //     role: "ADMIN", // Adjust to your schema
  //   },
  // });

  return (
    <div className="p-4 flex gap-4 flex-col md:flex-row">
      {/* LEFT */}
      <div className="w-full lg:w-2/3 flex flex-col gap-8">
        {/* USER CARDS */}
        <div className="flex gap-4 justify-between flex-wrap">
          <div className="flex gap-4 justify-between flex-wrap">
            <UserCard type="New Members" />
            <UserCard type="Left Members" />
            <UserCard type="total members" />
            <UserCard type="Deceased members" />
          </div>
        </div>
        {/* MIDDLE CHARTS */}
        <div className="flex gap-4 flex-col lg:flex-row">
          {/* COUNT CHART */}
          <div className="w-full lg:w-1/3 h-[450px]">
            <CountChart />
          </div>
          {/* ATTENDANCE CHART */}
          <div className="w-full lg:w-2/3 h-[450px]">
            <AttendanceChart />
          </div>
        </div>
        {/* BOTTOM CHART */}
        <div className="w-full h-[600px]">
          <FinanceChart contributionTypes={contributionTypes} />
        </div>
      </div>
      {/* RIGHT */}
      <div className="w-full lg:w-1/3 flex flex-col gap-6">
        <EventCalendar />
        <Announcements />
      </div>
    </div>
  );
};

export default AdminPage;

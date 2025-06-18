import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const yearParam = searchParams.get("year");
  const monthParam = searchParams.get("month");
  const type = searchParams.get("type")?.toLowerCase(); // normalize to lowercase

  const year = Number(yearParam);
  const month = Number(monthParam);

  if (isNaN(year) || isNaN(month) || !type) {
    return NextResponse.json(
      { error: "Invalid query parameters" },
      { status: 400 }
    );
  }

  try {
    const currentPeriodStart = new Date(year, month - 1, 1);
    const currentPeriodEnd = new Date(year, month, 0);

    const previousPeriodStart = new Date(year, month - 2, 1);
    const previousPeriodEnd = new Date(year, month - 1, 0);

    let currentCount = 0;
    let previousCount = 0;

    switch (type) {
      case "new members":
        [currentCount, previousCount] = await Promise.all([
          prisma.member.count({
            where: {
              member_type: "New",
              joined_date: {
                gte: currentPeriodStart,
                lte: currentPeriodEnd,
              },
              status: "Active",
            },
          }),
          prisma.member.count({
            where: {
              joined_date: {
                gte: previousPeriodStart,
                lte: previousPeriodEnd,
              },
              status: "Active",
              member_type: "New",
            },
          }),
        ]);
        break;

      case "left members":
        [currentCount, previousCount] = await Promise.all([
          prisma.member.count({
            where: {
              end_date: {
                gte: currentPeriodStart,
                lte: currentPeriodEnd,
              },
              status: "Inactive",
            },
          }),
          prisma.member.count({
            where: {
              end_date: {
                gte: previousPeriodStart,
                lte: previousPeriodEnd,
              },
              status: "Inactive",
            },
          }),
        ]);
        break;

      case "total members":
        [currentCount, previousCount] = await Promise.all([
          prisma.member.count({
            where: {
              status: "Active",
            },
          }),
          prisma.member.count({
            where: {
              status: "Active",
            },
          }),
        ]);
        break;
       case "deceased members":
  const [currentRelativeCount, currentMemberCount, previousRelativeCount, previousMemberCount] = await Promise.all([
    // Relatives - Current
    prisma.relative.count({
      where: {
        status: "Deceased",
        status_updated_at: {
          gte: currentPeriodStart,
          lte: currentPeriodEnd,
        },
      },
    }),
    // Members - Current
    prisma.member.count({
      where: {
        status: "Deceased",
        status_updated_at: {
          gte: currentPeriodStart,
          lte: currentPeriodEnd,
        },
      },
    }),
    // Relatives - Previous
    prisma.relative.count({
      where: {
        status: "Deceased",
        status_updated_at: {
          gte: previousPeriodStart,
          lte: previousPeriodEnd,
        },
      },
    }),
    // Members - Previous
    prisma.member.count({
      where: {
        status: "Deceased",
        status_updated_at: {
          gte: previousPeriodStart,
          lte: previousPeriodEnd,
        },
      },
    }),
  ]);

  currentCount = currentRelativeCount + currentMemberCount;
  previousCount = previousRelativeCount + previousMemberCount;
  break;


      default:
        return NextResponse.json({ error: "Unknown type" }, { status: 400 });
    }

    let percentageChange: number | undefined;
    if (previousCount > 0) {
      percentageChange = Number(
        (((currentCount - previousCount) / previousCount) * 100).toFixed(1)
      );
    } else if (currentCount > 0) {
      percentageChange = 100;
    }
    return NextResponse.json({
      value: currentCount,
      percentageChange,
    });
  } catch (error) {
    console.error("Error in metric calculation:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

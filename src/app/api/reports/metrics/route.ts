// /app/api/metrics/route.ts

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { startOfYear, endOfYear } from "date-fns";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type")?.toLowerCase();

  if (!type) {
    return NextResponse.json(
      { error: "Missing type parameter" },
      { status: 400 }
    );
  }

  try {
    let currentCount = 0;

    switch (type) {
      case "new members":
        currentCount = await prisma.member.count({
          where: { member_type: "New", status: "Active" },
        });
        break;

      case "left members":
        currentCount = await prisma.member.count({
          where: { status: "Left" },
        });
        break;

      case "total members":
        currentCount = await prisma.member.count({
          where: { status: "Active" },
        });
        break;

      case "deceased members":
        const [relativeCount, memberCount] = await Promise.all([
          prisma.relative.count({ where: { status: "Deceased" } }),
          prisma.member.count({ where: { status: "Deceased" } }),
        ]);
        currentCount = relativeCount + memberCount;
        break;

      case "penalized members":
        const penalized = await prisma.penalty.findMany({
          where: { is_paid: false },
          select: { member_id: true },
          distinct: ["member_id"],
        });
        currentCount = penalized.length;
        break;

      // case "early contributors":
      //   const earlyContributors = await prisma.payment.findMany({
      //     where: {
      //       contributionSchedule: {
      //         isNot: null,
      //       },
      //     },
      //     select: { member_id: true },
      //     distinct: ["member_id"],
      //   });
      //   currentCount = earlyContributors.length;
      //   break;

      case "fully paid members":
        const fullyPaidMembers = await prisma.balance.findMany({
          where: { amount: 0 },
          select: { member_id: true },
          distinct: ["member_id"],
        });

        const members = await prisma.member.findMany({
          where: {
            id: { in: fullyPaidMembers.map((b) => b.member_id) },
            status: "Active",
          },
        });

        currentCount = members.length;
        break;
      default:
        return NextResponse.json({ error: "Unknown type" }, { status: 400 });
    }

    return NextResponse.json({ value: currentCount });
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

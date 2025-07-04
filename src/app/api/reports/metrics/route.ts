import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

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
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );

    let currentCount = 0;

    switch (type) {
      case "new members":
        currentCount = await prisma.member.count({
          where: {
            member_type: "New",
            status: "Active",
            created_at: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
        });
        break;

      case "left members":
        currentCount = await prisma.member.count({
          where: {
            status: "Left",
            status_updated_at: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
        });
        break;

      case "total members":
        currentCount = await prisma.member.count({
          where: {
            status: "Active",
          },
        });
        break;

      case "deceased members":
        const [relativeCount, memberCount] = await Promise.all([
          prisma.relative.count({
            where: {
              status: "Deceased",
              status_updated_at: {
                gte: startOfMonth,
                lte: endOfMonth,
              },
            },
          }),
          prisma.member.count({
            where: {
              status: "Deceased",
              status_updated_at: {
                gte: startOfMonth,
                lte: endOfMonth,
              },
            },
          }),
        ]);
        currentCount = relativeCount + memberCount;
        break;

      case "penalized members":
        const penalized = await prisma.penalty.findMany({
          where: {
            is_paid: false,
            applied_at: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
          select: { member_id: true },
          distinct: ["member_id"],
        });
        currentCount = penalized.length;
        break;

      case "paid members":
        const fullyPaidMembers = await prisma.balance.findMany({
          where: {
            amount: 0,
            updated_at: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
          select: { member_id: true },
          distinct: ["member_id"],
        });

        const paidMembers = await prisma.member.findMany({
          where: {
            id: { in: fullyPaidMembers.map((b) => b.member_id) },
            status: "Active",
          },
        });

        currentCount = paidMembers.length;
        break;

      case "unpaid members":
        const unpaidMembers = await prisma.balance.findMany({
          where: {
            amount: {
              gt: 0,
            },
            updated_at: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
          select: {
            member_id: true,
          },
          distinct: ["member_id"],
        });

        const unpaidActive = await prisma.member.count({
          where: {
            id: { in: unpaidMembers.map((b) => b.member_id) },
            status: "Active",
          },
        });

        currentCount = unpaidActive;
        break;

      case "members set to inactivation":
        currentCount = await prisma.member.count({
          where: {
            status: "Inactive",
            status_updated_at: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
        });
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

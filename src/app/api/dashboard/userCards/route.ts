// /api/dashboard/metrics/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0, 23, 59, 59, 999
    );

    const [
      activeMembers,
      inactiveMembers,
      newMembers,
      leftMembers,
      totalMembers,
      deceasedMembers,
      deceasedRelative,
      roleTransferPending,
      penalizedMembers,
      paidMembers,
      unpaidMembers,
      inactivatedMembers
    ] = await Promise.all([
      prisma.member.count({ where: { status: "Active" } }),
      prisma.member.count({ where: { status: "Inactive" } }),
      prisma.member.count({
        where: {
          member_type: "New",
          status: "Active",
          created_at: { gte: startOfMonth, lte: endOfMonth }
        }
      }),
      prisma.member.count({
        where: {
          status: "Left",
          status_updated_at: { gte: startOfMonth, lte: endOfMonth }
        }
      }),
      prisma.member.count({
        where: { status: { notIn: ["Deceased", "Left"] } }
      }),
      prisma.member.count({
        where: {
          status: "Deceased",
          status_updated_at: { gte: startOfMonth, lte: endOfMonth }
        }
      }),
      prisma.relative.count({
        where: {
          status: "Deceased",
          status_updated_at: { gte: startOfMonth, lte: endOfMonth }
        }
      }),
      prisma.member.count({
        where: {
          isPrincipal: true,
          status: { in: ["Deceased", "Left"] },
          spouseId: { not: null },
          spouse: { status: "Active" }
        }
      }),
      (async () => {
        const penalized = await prisma.penalty.findMany({
          where: {
            is_paid: false,
            applied_at: { gte: startOfMonth, lte: endOfMonth }
          },
          select: { member_id: true },
          distinct: ["member_id"]
        });
        return penalized.length;
      })(),
      (async () => {
        const fullyPaid = await prisma.balance.findMany({
          where: {
            amount: 0,
            updated_at: { gte: startOfMonth, lte: endOfMonth }
          },
          select: { member_id: true },
          distinct: ["member_id"]
        });
        return prisma.member.count({
          where: { id: { in: fullyPaid.map(b => b.member_id) }, status: "Active" }
        });
      })(),
      (async () => {
        const unpaid = await prisma.balance.findMany({
          where: {
            amount: { gt: 0 },
            updated_at: { gte: startOfMonth, lte: endOfMonth }
          },
          select: { member_id: true },
          distinct: ["member_id"]
        });
        return prisma.member.count({
          where: { id: { in: unpaid.map(b => b.member_id) }, status: "Active" }
        });
      })(),
      prisma.member.count({
        where: {
          status: "Inactive",
          status_updated_at: { gte: startOfMonth, lte: endOfMonth },
          remark: "Inactivated due to missed contributions"
        }
      })
    ]);

    return NextResponse.json({
      activeMembers,
      inactiveMembers,
      newMembers,
      leftMembers,
      totalMembers,
      deceasedMembers,
      deceasedRelative,
      roleTransferPending,
      penalizedMembers,
      paidMembers,
      unpaidMembers,
      inactivatedMembers
    });
  } catch (error) {
    console.error("Error fetching dashboard metrics:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

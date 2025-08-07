export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/prisma";

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
      case "active members":
        currentCount = await prisma.member.count({
          where: { status: "Active" },
        });
        break;

      case "inactive members":
        currentCount = await prisma.member.count({
          where: { status: "Inactive" },
        });
        break;

      case "new members":
        currentCount = await prisma.member.count({
          where: {
            member_type: "New",
            status: "Active",
            created_at: { gte: startOfMonth, lte: endOfMonth },
          },
        });
        break;

      case "left members":
        currentCount = await prisma.member.count({
          where: {
            status: "Left",
            status_updated_at: { gte: startOfMonth, lte: endOfMonth },
          },
        });
        break;
      case "total members":
        currentCount = await prisma.member.count({
          where: {
            status: {
              notIn: ["Deceased", "Left"],
            },
          },
        });
        break;
      case "deceased members":
        currentCount = await prisma.member.count({
          where: {
            status: "Deceased",
            status_updated_at: { gte: startOfMonth, lte: endOfMonth },
          },
        });
        break;
      case "deceased relative":
        currentCount = await prisma.relative.count({
          where: {
            status: "Deceased",
            status_updated_at: { gte: startOfMonth, lte: endOfMonth },
          },
        });
        break;

      case "role transfer pending":
        currentCount = await prisma.member.count({
          where: {
            isPrincipal: true,
            status: { in: ["Deceased", "Left"] },
            spouseId: { not: null },
            spouse: { status: "Active" },
          },
        });
        break;

      case "penalized members":
        const penalized = await prisma.penalty.findMany({
          where: {
            is_paid: false,
            applied_at: { gte: startOfMonth, lte: endOfMonth },
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
            updated_at: { gte: startOfMonth, lte: endOfMonth },
          },
          select: { member_id: true },
          distinct: ["member_id"],
        });
        currentCount = await prisma.member.count({
          where: {
            id: { in: fullyPaidMembers.map((b) => b.member_id) },
            status: "Active",
          },
        });
        break;

      case "unpaid members":
        const unpaidMembers = await prisma.balance.findMany({
          where: {
            amount: { gt: 0 },
            updated_at: { gte: startOfMonth, lte: endOfMonth },
          },
          select: { member_id: true },
          distinct: ["member_id"],
        });
        currentCount = await prisma.member.count({
          where: {
            id: { in: unpaidMembers.map((b) => b.member_id) },
            status: "Active",
          },
        });
        break;

      case "inactivated members":
        currentCount = await prisma.member.count({
          where: {
            status: "Inactive",
            status_updated_at: { gte: startOfMonth, lte: endOfMonth },
            remark: "Inactivated due to missed contributions",
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
  }
  // --- FIX #4: DELETE the entire 'finally' block ---
  // The global instance should never be disconnected.
  // finally {
  //   await prisma.$disconnect();
  // }
}

export const dynamic = "force-dynamic";
export const revalidate = 0;
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const contributionTypes = await prisma.contributionType.findMany();
    const penaltyTypes = await prisma.penalty.groupBy({
      by: ["penalty_type"],
    });
    const members = await prisma.member.findMany({
      where: { status: "Active" },
    });

    return NextResponse.json({
      contributionTypes,
      members,
      penaltyTypes,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch contribution types" },
      { status: 500 }
    );
  }
}

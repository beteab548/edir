export const dynamic = "force-dynamic";
export const revalidate = 0;

import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentMembers = await prisma.member.findMany({
      where: {
        created_at: {
          gte: thirtyDaysAgo,
        },
      },
      orderBy: {
        created_at: "desc",
      },
      take: 5,
      select: {
        id: true,
        first_name: true,
        last_name: true,
        image_url: true,
        created_at: true,
      },
    });

    const formattedMembers = recentMembers.map((member) => ({
      ...member,
      created_at: member.created_at.toISOString(),
    }));

    return NextResponse.json(formattedMembers);
  } catch (error) {
    console.error("Failed to fetch recent members", error);
    return NextResponse.json(
      { error: "Failed to fetch recent members" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

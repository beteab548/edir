export const dynamic = "force-dynamic";
export const revalidate = 0;
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const recentMembers = await prisma.member.findMany({
      orderBy: { created_at: "desc" },
      take: 5,
      select: {
        id: true,
        first_name: true,
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

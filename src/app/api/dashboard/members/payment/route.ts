
export const dynamic = "force-dynamic";
export const revalidate = 0;
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const recentPayments = await prisma.paymentRecord.findMany({
      orderBy: { created_at: "desc" },
      take: 5,
      include: { member: true },
    });

    // Format created_at to ISO string if needed
    const formattedPayments = recentPayments.map((member) => ({
      ...member,
      created_at: member.created_at.toISOString(),
    }));

    return NextResponse.json(formattedPayments);
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

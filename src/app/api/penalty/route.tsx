import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const memberId = searchParams.get("memberId");

  if (!memberId) {
    return NextResponse.json(
      { error: "memberId is required" },
      { status: 400 }
    );
  }

  try {
    const penalties = await prisma.penalty.findMany({
      where: {
        member_id: Number(memberId),
        generated: "manually",
        is_paid: false
      },
      select: {
        missed_month: true,
        amount: true,
      },
    });

    // Return the raw DateTime without conversion
    const monthsWithAmount = penalties.map((penalty) => ({
      month: penalty.missed_month, // Keep as DateTime
      amount: penalty.amount,
    }));

    console.log(monthsWithAmount);
    return NextResponse.json({ monthsWithAmount });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch penalty months with amounts" },
      { status: 500 }
    );
  }
}
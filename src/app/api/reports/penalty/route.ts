import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const year = parseInt(searchParams.get("year") || "");
  const penaltyType = searchParams.get("penaltyType")?.toLowerCase();

  if (!year || isNaN(year)) {
    return NextResponse.json({ error: "Invalid or missing year" }, { status: 400 });
  }

  try {
    const allPenalties = await prisma.penalty.findMany({
      where: {
        missed_month: {
          gte: new Date(`${year}-01-01`),
          lte: new Date(`${year}-12-31`),
        },
        ...(penaltyType && penaltyType !== "all"
          ? {
              penalty_type: {
                equals: penaltyType,
                mode: "insensitive",
              },
            }
          : {}),
      },
      select: {
        missed_month: true,
        expected_amount: true,
        paid_amount: true,
        penalty_type: true,
      },
    });

    // Initialize months with zero totals
    const resultByMonth: Record<
      string,
      { name: string; expected: number; paid: number }
    > = {};

    for (let i = 0; i < 12; i++) {
      const monthName = new Date(year, i).toLocaleString("default", { month: "short" });
      resultByMonth[monthName] = {
        name: monthName,
        expected: 0,
        paid: 0,
      };
    }

    // Aggregate expected and paid amounts by month
    for (const p of allPenalties) {
      const monthKey = p.missed_month.toLocaleString("default", { month: "short" });
      const expected = Number(p.expected_amount || 0);
      const paid = Number(p.paid_amount || 0);

      if (!resultByMonth[monthKey]) {
        // In case penalty month is out of expected range, skip or initialize
        continue;
      }

      resultByMonth[monthKey].expected += expected;
      resultByMonth[monthKey].paid += paid;
    }

    const responseArray = Object.values(resultByMonth);

    return NextResponse.json(responseArray);
  } catch (error) {
    console.error("Error generating penalty chart data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import Decimal from "decimal.js";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const year =
      Number(req.nextUrl.searchParams.get("year")) || new Date().getFullYear();
    const typeParam = req.nextUrl.searchParams.get("type");

    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const monthlyData = new Map<string, { expected: Decimal; paid: Decimal }>();
    months.forEach((m) => {
      monthlyData.set(m, { expected: new Decimal(0), paid: new Decimal(0) });
    });

    let contributionType = null;
    if (typeParam && typeParam !== "all") {
      contributionType = await prisma.contributionType.findFirst({
        where: { name: typeParam },
        select: { id: true },
      });

      if (!contributionType) {
        return NextResponse.json(
          { error: "Contribution type not found" },
          { status: 400 }
        );
      }
    }

    const schedules = await prisma.contributionSchedule.findMany({
      where: {
        month: {
          gte: new Date(`${year}-01-01`),
          lte: new Date(`${year}-12-31`),
        },
        ...(contributionType && {
          contribution: {
            contribution_type_id: contributionType.id,
          },
        }),
      },
      include: {
        contribution: true,
      },
    });

    for (const schedule of schedules) {
      const monthName = new Date(schedule.month).toLocaleString("en-US", {
        month: "short",
      });
      const entry = monthlyData.get(monthName);
      if (!entry) continue;

      entry.expected = entry.expected.plus(
        new Decimal(schedule.expected_amount)
      );

      const paidAmount = schedule.paid_amount ?? new Decimal(0);
      entry.paid = entry.paid.plus(paidAmount);
    }

    const finalData = months.map((month) => {
      const data = monthlyData.get(month)!;
      return {
        name: month,
        expected: Number(data.expected.toFixed(2)),
        paid: Number(data.paid.toFixed(2)),
      };
    });

    return NextResponse.json(finalData);
  } catch (error) {
    console.error("Error generating monthly report:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

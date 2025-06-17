// app/api/reports/monthly/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import Decimal from "decimal.js";

export async function GET(req: NextRequest) {
  try {
    const year = Number(req.nextUrl.searchParams.get("year")) || new Date().getFullYear();
    const typeParam = req.nextUrl.searchParams.get("type");

    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    const monthlyData = new Map<string, { expected: Decimal; paid: Decimal }>();
    months.forEach((m) => {
      monthlyData.set(m, { expected: new Decimal(0), paid: new Decimal(0) });
    });

    // Find matching ContributionType
    let contributionType = null;
    if (typeParam && typeParam !== "all") {
      contributionType = await prisma.contributionType.findFirst({
        where: { name: typeParam },
        select: { id: true, name: true, mode: true }
      });

      if (!contributionType) {
        return NextResponse.json({ error: "Contribution type not found" }, { status: 400 });
      }
    }

    // Fetch contribution schedules and related data
    const schedules = await prisma.contributionSchedule.findMany({
      where: {
        month: {
          gte: new Date(`${year}-01-01`),
          lte: new Date(`${year}-12-31`),
        },
        ...(contributionType && {
          contribution: {
            contribution_type_id: contributionType.id
          }
        })
      },
      include: {
        contribution: {
          include: {
            contributionType: true,
          },
        },
        Payment: true,
      },
    });

    for (const schedule of schedules) {
      const monthName = new Date(schedule.month).toLocaleString("en-US", { month: "short" });
      const entry = monthlyData.get(monthName);
      if (!entry) continue;

      const contribution = schedule.contribution;
      const name = contribution.contributionType.name;

      // Don't count expected amount for Penalty mode
      if (name !== "Penalty") {
        entry.expected = entry.expected.plus(new Decimal(contribution.amount));
      }

      const totalPaid = schedule.Payment
        .filter(p => {
          if (name === "Penalty") return p.payment_type === "penalty";
          return p.payment_type !== "penalty";
        })
        .reduce((sum, p) => sum.plus(new Decimal(p.paid_amount)), new Decimal(0));

      entry.paid = entry.paid.plus(totalPaid);
    }

    const finalData = months.map(month => {
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
      { error: "Internal Server Error", detail: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

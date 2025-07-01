import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { startOfMonth, endOfMonth } from "date-fns";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const yearParam = searchParams.get("year");
  const year = yearParam ? parseInt(yearParam) : new Date().getFullYear();

  const months = Array.from({ length: 12 }, (_, i) => i); // Jan to Dec

  const summary = await Promise.all(
    months.map(async (month) => {
      const from = startOfMonth(new Date(year, month));
      const to = endOfMonth(new Date(year, month));

      const penalties = await prisma.penalty.findMany({
        where: {
          missed_month: {
            gte: from,
            lte: to,
          },
        },
      });

      // Filter out waived penalties before grouping
      const filteredPenalties = penalties.filter((p) => !p.waived);

      const auto = filteredPenalties.filter(
        (p) => p.generated === "automatically"
      );
      const manual = filteredPenalties.filter(
        (p) => p.generated === "manually"
      );

      const sum = (
        arr: typeof penalties,
        key: "expected_amount" | "paid_amount"
      ) => arr.reduce((total, p) => total + parseFloat(p[key].toString()), 0);

      return {
        name: from.toLocaleString("default", { month: "short" }),
        auto_expected: sum(auto, "expected_amount"),
        auto_collected: sum(auto, "paid_amount"),
        manual_expected: sum(manual, "expected_amount"),
        manual_collected: sum(manual, "paid_amount"),
      };
    })
  );

  return NextResponse.json(summary);
}

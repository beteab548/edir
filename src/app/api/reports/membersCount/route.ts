import { NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // make sure this is your prisma client path

export async function GET() {
  try {
    const malesCount = await prisma.member.count({
      where: { sex: "Male" },
    });

    const femalesCount = await prisma.member.count({
      where: { sex: "Female" },
    });
console.log("malesCount is", malesCount);
    console.log("femalesCount is", femalesCount);
    return NextResponse.json({
      males: malesCount,
      females: femalesCount,
    });
  } catch (error) {
    console.error("Error fetching student counts:", error);
    return NextResponse.json(
      { error: "Failed to fetch student counts" },
      { status: 500 }
    );
  }
}

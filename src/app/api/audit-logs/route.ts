export const dynamic = "force-dynamic";
export const revalidate = 0;
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: {
        timestamp: "desc", 
      },
      take: 5, 
    });
    return NextResponse.json(logs);
  } catch (error) {
    console.error("Failed to fetch audit logs:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

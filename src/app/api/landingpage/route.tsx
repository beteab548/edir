import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const members =await prisma.member.count({ where: { status: "Active" } });
  const activeSince = new Date("2005-07-19");
  return NextResponse.json({ members, activeSince });
}

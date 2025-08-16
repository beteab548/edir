export const dynamic = "force-dynamic";
export const revalidate = 0;
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const members = await prisma.member.count({
    where: {
      NOT: {
        status: { in: ["Deceased", "Left"] },
      },
    },
  });
  const activeSince = new Date("2005-07-19");
  return NextResponse.json({ members, activeSince });
}

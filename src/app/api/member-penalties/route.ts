export const dynamic = "force-dynamic"; 
export const revalidate = 0; 
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const memberId = Number(url.searchParams.get("memberId"));
    const contributionTypeName = url.searchParams.get("contributionTypeName");

    if (!memberId || !contributionTypeName) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const member = await prisma.member.findUnique({
      where: { id: memberId },
      select: { id: true, first_name: true, last_name: true, phone_number: true, custom_id: true, image_url: true },
    });
    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const penalties = await prisma.penalty.findMany({
      where: {
        member_id: memberId,
        generated: "automatically",
        penalty_type: contributionTypeName,
      },
      include: {
        member: true,
        contribution: {
          select: {
            type_name: true,
          },
        },
        contributionSchedule: {
          select: {
            month: true,
          },
        },
      },
      orderBy: {
        applied_at: "desc",
      },
    });

    return NextResponse.json({ member, penalties });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

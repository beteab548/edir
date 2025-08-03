// In src/app/api/member-penalties/route.ts

export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server"; // Use NextRequest for type safety
import prisma from "@/lib/prisma"; // Use the shared singleton instance

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const memberIdParam = url.searchParams.get("memberId");
    const encodedContributionTypeName = url.searchParams.get("contributionTypeName");
     const contributionTypeName = decodeURIComponent(encodedContributionTypeName!);
      if (!memberIdParam) {
      return NextResponse.json({ error: "Member ID is required" }, { status: 400 });
    }
    if (!contributionTypeName) {
      return NextResponse.json({ error: "Contribution type name is required" }, { status: 400 });
    }
    
    const memberId = Number(memberIdParam);
    if (isNaN(memberId)) {
        return NextResponse.json({ error: "Invalid Member ID format" }, { status: 400 });
    }

    // First, fetch the member's details. Your existing logic is good.
    const member = await prisma.member.findUnique({
      where: { id: memberId },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        phone_number: true,
        custom_id: true,
        image_url: true,
      },
    });

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // --- THIS IS THE CORRECTED QUERY ---
    // It now uses an OR filter to find penalties in two ways.
    const penalties = await prisma.penalty.findMany({
      where: {
        member_id: memberId,
        OR: [
          // Condition 1: Find penalties where penalty_type directly matches the name.
          // This is for manually created penalties like "Disciplinary Action".
          {
            penalty_type: {
              equals: contributionTypeName,
              mode: 'insensitive', // Makes the search case-insensitive
            },
          },
          // Condition 2: Find penalties linked to a Contribution where the contribution's
          // type_name matches. This is for automatically generated penalties from missed payments.
          {
            contribution: {
              type_name: {
                equals: contributionTypeName,
                mode: 'insensitive',
              },
            },
          },
        ],
      },
      include: {
        // Include all necessary related data for the frontend
        member: { // For member's name and custom ID in waiver modal
            select: {
                custom_id: true,
                first_name: true
            }
        },
        contribution: { // To display the contribution name if penalty_type is generic
          select: {
            type_name: true,
          },
        },
        // waiver: true, // Also include waiver info to know if it's waived
      },
      orderBy: {
        missed_month: "desc", // It's better to order by the month the penalty was for
      },
    });

    return NextResponse.json({ member, penalties });
  } catch (error) {
    console.error("Failed to fetch member penalties:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";
export const revalidate = 0;
import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { deletePenalty } from "@/lib/actions";

// app/api/penalty/route.ts
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const memberId = searchParams.get("memberId");

  if (!memberId) {
    return NextResponse.json(
      { error: "memberId is required" },
      { status: 400 }
    );
  }

  try {
    const penalties = await prisma.penalty.findMany({
      where: {
        member_id: Number(memberId),
        generated: "manually",
        is_paid: false,
        waived: false // Add this condition to exclude waived penalties
      },
      select: {
        missed_month: true,
        expected_amount: true,
        waived: true // Include waived status in the response
      },
    });

    const monthsWithAmount = penalties.map((penalty) => ({
      month: penalty.missed_month,
      amount: penalty.expected_amount,
      waived: penalty.waived
    }));

    return NextResponse.json({ monthsWithAmount });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch penalty months with amounts" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    // Extract penalty ID from request body
    const { penaltyId } = await request.json();

    if (!penaltyId || isNaN(Number(penaltyId))) {
      return NextResponse.json(
        { error: "Valid penalty ID is required" },
        { status: 400 }
      );
    }

    const updatedPenalty = await prisma.penalty.update({
      where: { id: Number(penaltyId) },
      data: {
        waived: true,
        resolved_at: new Date(),
      },
      include: {
        member: {
          select: {
            first_name: true,
            last_name: true,
          },
        },
      },
    });

    return NextResponse.json(updatedPenalty);
  } catch (error) {
    console.error("Error waiving penalty:", error);
    return NextResponse.json(
      { error: "Failed to waive penalty" },
      { status: 500 }
    );
  }
}
export async function DELETE(request: Request) {
  try {
    const { penaltyId } = await request.json();

    if (!penaltyId) {
      return NextResponse.json(
        { error: "Penalty ID is required" },
        { status: 400 }
      );
    }

    const result = await deletePenalty(penaltyId);

    if (!result.success) {
      return NextResponse.json({ error: "unable to delete" }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

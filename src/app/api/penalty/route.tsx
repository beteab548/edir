export const dynamic = "force-dynamic";
export const revalidate = 0;
import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { deletePenalty } from "@/lib/actions";
import { currentUser } from "@clerk/nextjs/server";
import { ActionStatus, ActionType } from "@prisma/client";
import { logAction } from "@/lib/audit";

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
        waived: false,
      },
      select: {
        missed_month: true,
        expected_amount: true,
        waived: true,
      },
    });

    const monthsWithAmount = penalties.map((penalty) => ({
      month: penalty.missed_month,
      amount: penalty.expected_amount,
      waived: penalty.waived,
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
  const user = await currentUser();

  if (!user) {
    console.error(
      "CRITICAL: updateFamily action called without authenticated user."
    );
    return NextResponse.json(
      { success: false, error: true, message: "User not authenticated." },
      { status: 401 }
    ); // Use 401 for unauthorized
  }

  let penaltyId: number | undefined;
  let memberId: number | undefined;

  try {
    const {
      penaltyId: reqPenaltyId,
      reason,
      evidenceUrl,
      evidenceFileId,
      memberId: reqMemberId,
    } = await request.json();

    penaltyId = reqPenaltyId;
    memberId = reqMemberId;

    if (!penaltyId || isNaN(Number(penaltyId))) {
      return NextResponse.json(
        { error: "Valid penalty ID is required" },
        { status: 400 }
      );
    }
    if (!memberId) {
      return NextResponse.json(
        { error: "Member ID is required" },
        { status: 400 }
      );
    }

    const updatedPenalty = await prisma.penalty.update({
      where: { id: Number(penaltyId) },
      data: {
        waived: true,
        resolved_at: new Date(),
        waived_reason: reason,
        waived_reason_document: evidenceUrl,
        waived_reason_document_file_id: evidenceFileId,
      },
      include: {
        member: {
          select: {
            first_name: true,
            last_name: true,
            custom_id: true,
          },
        },
      },
    });

    await logAction({
      userId: user.id,
      userFullName: `${user.firstName} ${user.lastName}`,
      actionType: ActionType.PENALTY_WAIVE,
      status: ActionStatus.SUCCESS,
      details: `Successfully waived penalty with id ${penaltyId} for member ${updatedPenalty.member.custom_id} `,
      targetId: updatedPenalty.member.custom_id?.toString(),
    });

    return NextResponse.json(updatedPenalty);
  } catch (error) {
    const member = memberId
      ? await prisma.member.findUnique({ where: { id: memberId } })
      : null;
    console.error("Error waiving penalty:", error);
    await logAction({
      userId: user.id,
      userFullName: `${user.firstName} ${user.lastName}`,
      actionType: ActionType.PENALTY_WAIVE,
      status: ActionStatus.FAILURE,
      details: `Failed to waive penalty number ${
        penaltyId || "unknown"
      } for member ${member?.custom_id}`,
      error: (error as Error).message,
      targetId: member?.custom_id?.toString(),
    });
    return NextResponse.json(
      { error: "Failed to waive penalty" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const user = await currentUser();

  if (!user) {
    console.error(
      "CRITICAL: updateFamily action called without authenticated user."
    );
    return NextResponse.json(
      { success: false, error: true, message: "User not authenticated." },
      { status: 401 }
    ); // Use 401 for unauthorized
  }

  let penaltyId: number | undefined;
  let memberId: number | undefined;

  try {
    const { penaltyId: reqPenaltyId, memberId: reqMemberId } =
      await request.json();

    penaltyId = reqPenaltyId;
    memberId = reqMemberId;

    if (!penaltyId) {
      return NextResponse.json(
        { error: "Penalty ID is required" },
        { status: 400 }
      );
    }

    if (!memberId) {
      return NextResponse.json(
        { error: "Member ID is required" },
        { status: 400 }
      );
    }

    const result = await deletePenalty(penaltyId);

    if (!result.success) {
      return NextResponse.json({ error: "Unable to delete" }, { status: 500 });
    }

    const member = await prisma.member.findUnique({ where: { id: memberId } });

    await logAction({
      userId: user.id,
      userFullName: `${user.firstName} ${user.lastName}`,
      actionType: ActionType.PENALTY_DELETE,
      status: ActionStatus.SUCCESS,
      details: `Successfully deleted penalty with id ${penaltyId} for member ${member?.custom_id}`,
      targetId: member?.custom_id?.toString(),
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    // memberId will be available here, even if request.json() fails

    const member = memberId
      ? await prisma.member.findUnique({ where: { id: memberId } })
      : null;

    const error =
      err instanceof Error ? err : new Error("An unknown error occurred");

    await logAction({
      userId: user.id,
      userFullName: `${user.firstName} ${user.lastName}`,
      actionType: ActionType.PENALTY_DELETE, // Corrected the action type
      status: ActionStatus.FAILURE,
      details: `Failed to delete penalty number ${penaltyId || "unknown"}`, // Use penaltyId if available
      error: error.message,
      targetId: member?.custom_id?.toString(), //include the member custom_id if available
    });

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { getMembersWithPenalties } from "@/lib/actions";
import prisma from "@/lib/prisma";
export async function GET() {
  try {
    const [membersData, penaltiesData, allMembers] = await Promise.all([
      getMembersWithPenalties(),
      prisma.penalty.findMany({
        where: { generated: "manually" },
        include: {
          member: {
            select: {
              id: true,
              first_name: true,
              second_name: true,
              last_name: true,
              custom_id: true,
              image_url: true,
            },
          },
        },
        orderBy: {
          applied_at: "desc",
        },
      }),
      prisma.member.findMany({ where: { status: "Active" } }),
    ]);

    const processedMembers = membersData.map((member) => ({
      ...member,
      Penalty: member.Penalty.filter(
        (penalty) => penalty.contribution !== null
      ).map((penalty) => ({
        ...penalty,
        contribution: penalty.contribution!,
      })),
    }));

    const processedPenalties = penaltiesData.map((penalty) => ({
      ...penalty,
      amount:
        typeof penalty.expected_amount === "object" &&
        "toNumber" in penalty.expected_amount
          ? penalty.expected_amount.toNumber()
          : penalty.expected_amount,
      paid_amount:
        typeof penalty.paid_amount === "object" &&
        "toNumber" in penalty.paid_amount
          ? penalty.paid_amount.toNumber()
          : penalty.paid_amount,
      penalty_type: penalty.penalty_type ?? "",
    }));
    console.log("all members", allMembers);
    return NextResponse.json({
      MembersWithPenalities: processedMembers,
      penalties: processedPenalties,
      allMembers,
    });
  } catch (error) {
    console.error("Error in /api/contribution-data", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

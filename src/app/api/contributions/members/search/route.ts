import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
const id = searchParams.get("id");
console.log(id);
if (!id) {
  return NextResponse.json(
    { error: "Missing id parameter" },
    { status: 400 },
  );
}

const contributionTypeId = parseInt(id, 10);

    // Example: Get all member_ids for this contribution type
    const contributions = await prisma.contribution.findMany({
      where: {
        type_name: (
          await prisma.contributionType.findUnique({
            where: { id: contributionTypeId },
          })
        )?.name,
      },
      select: { member_id: true },
    });

    // Return just the member IDs as an array
    const memberIds = contributions.map((c) => c.member_id);

    return NextResponse.json(memberIds);
  } catch (error) {
    console.error("Error fetching members for contribution type:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

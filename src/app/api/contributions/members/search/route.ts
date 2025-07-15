export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
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

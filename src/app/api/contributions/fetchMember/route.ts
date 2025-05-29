import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const memberType = searchParams.get("memberType");
  const types = await prisma.contributionType.findUnique({
    where: { name: memberType ?? undefined },
  });
  console.log("contribution types are ",types);
  if (memberType) {
    const members = await prisma.member.findMany({
      where: {
        Contribution: {
          some: {
            type_name: types?.name,
          },
        },
      },
      include: {
        Contribution: true,
      },
    });
    console.log(`members with type ${types} `,members);
    return NextResponse.json({
      members: members,
      contributionTypes: types,
    });
  } else {
    return NextResponse.json({
      message: "no paramater provided or invalid input!",
    });
  }
}

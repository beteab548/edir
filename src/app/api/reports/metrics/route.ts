import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type")?.toLowerCase(); // normalize to lowercase

  if (!type) {
    return NextResponse.json(
      { error: "Missing type parameter" },
      { status: 400 }
    );
  }

  try {
    let currentCount = 0;
    let previousCount = 0;

    switch (type) {
      case "new members":
        currentCount = await prisma.member.count({
          where: {
            member_type: "New",
            status: "Active",
          },
        });
        break;

      case "left members":
        currentCount = await prisma.member.count({
          where: {
            status: "Inactive",
          },
        });
        break;

      case "total members":
        currentCount = await prisma.member.count({
          where: {
            status: "Active",
          },
        });
        break;

      case "deceased members":
        const [relativeCount, memberCount] = await Promise.all([
          prisma.relative.count({
            where: {
              status: "Deceased",
            },
          }),
          prisma.member.count({
            where: {
              status: "Deceased",
            },
          }),
        ]);
        currentCount = relativeCount + memberCount;
        break;

      default:
        return NextResponse.json({ error: "Unknown type" }, { status: 400 });
    }

    // You can optionally return `percentageChange` only for some types if needed.
    return NextResponse.json({
      value: currentCount,
    });
  } catch (error) {
    console.error("Error in metric calculation:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export const dynamic = "force-dynamic";
export const revalidate = 0;
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

enum RelativeStatus {
  Active = "Active",
  Inactive = "Inactive",
  Pending = "Pending",
}

enum RelationType {
  Mother = "Mother",
  Father = "Father",
  Daughter = "Daughter",
  Son = "Son",
  Sister = "Sister",
  Brother = "Brother",
  Spouse_Mother = "Spouse_Mother",
  Spouse_Father = "Spouse_Father",
  Spouse_Sister = "Spouse_Sister",
  Spouse_Brother = "Spouse_Brother",
  Other = "Other",
}

type RelativeResponse = {
  id: number;
  member_id: number;
  first_name: string;
  second_name: string;
  last_name: string;
  relation_type: RelationType;
  status: RelativeStatus;
  created_at: string;
  status_updated_at?: string;
};

export async function GET(req: NextRequest) {
  try {
    // Extract query parameters
    const member_id = req.nextUrl.searchParams.get("member_id");

    // Build the where clause.
    const whereClause: any = {};

    if (member_id) {
      whereClause.member_id = Number(member_id);
    }

    // Adding a filter for the related member's status.
    whereClause.member = { status: "Active" };

    const relatives = await prisma.relative.findMany({
      where: whereClause,
      select: {
        id: true,
        member_id: true,
        first_name: true,
        second_name: true,
        last_name: true,
        relation_type: true,
        status: true,
        created_at: true,
        status_updated_at: true,
      },
    });

    const formattedRelatives = relatives.map((relative) => ({
      ...relative,
      created_at: relative.created_at.toISOString(),
      status_updated_at: relative.status_updated_at?.toISOString(),
    })) as unknown as RelativeResponse[];

    return NextResponse.json(formattedRelatives);
  } catch (error) {
    console.error("Error fetching relatives:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

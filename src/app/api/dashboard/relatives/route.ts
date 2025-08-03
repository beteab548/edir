import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// Your enums can remain here or be imported.

export async function GET(req: NextRequest) {
  try {
    // --- THE NEW, POWERFUL PRISMA QUERY ---
    // This query finds all relatives...
    const relatives = await prisma.relative.findMany({
      where: {
        // ...where the related 'family'...
        family: {
          // ...has at least 'some' (one or more) members that meet these criteria:
          members: {
            some: {
              // The member must be a principal AND their status must be Active.
              isPrincipal: true,
              status: "Active",
            },
          },
        },
      },
      // The select statement remains the same.
      select: {
        id: true,
        familyId: true,
        first_name: true,
        second_name: true,
        last_name: true,
        relation_type: true,
        status: true,
        created_at: true,
        status_updated_at: true,
      },
    });

    // Formatting the response is still good practice.
    const formattedRelatives = relatives.map((relative) => ({
      ...relative,
      created_at: relative.created_at.toISOString(),
      status_updated_at: relative.status_updated_at?.toISOString(),
    }));

    return NextResponse.json(formattedRelatives);
  } catch (error) {
    console.error("Error fetching all relatives:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
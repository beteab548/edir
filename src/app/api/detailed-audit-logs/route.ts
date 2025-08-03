// In src/app/api/detailed-audit-logs/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma, ActionStatus, ActionType } from "@prisma/client";

export const dynamic = "force-dynamic";

// Define a reusable, specific type for the member data we select.
type MemberForAuditLog = Prisma.MemberGetPayload<{
  select: {
    id: true;
    first_name: true;
    last_name: true;
    custom_id: true;
  };
}>;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Pagination parameters
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "15", 10);
    const skip = (page - 1) * limit;

    // Filter parameters
    const userId = searchParams.get("userId");
    const actionType = searchParams.get("actionType") as ActionType | null;
    const status = searchParams.get("status") as ActionStatus | null;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Search query
    const searchQuery = searchParams.get("searchQuery");

    // Construct the Prisma 'where' clause dynamically
    const where: Prisma.AuditLogWhereInput = {};

    if (userId) where.userId = userId;
    if (actionType) where.actionType = actionType;
    if (status) where.status = status;
    if (startDate)
      where.timestamp = { ...where.timestamp, gte: new Date(startDate) };
    if (endDate) {
      const endOfDay = new Date(endDate);
      endOfDay.setDate(endOfDay.getDate() + 1);
      where.timestamp = { ...where.timestamp, lt: endOfDay };
    }
    if (searchQuery) {
      where.OR = [
        { details: { contains: searchQuery, mode: "insensitive" } },
        { userFullName: { contains: searchQuery, mode: "insensitive" } },
        { targetId: { contains: searchQuery, mode: "insensitive" } },
      ];
    }

    // --- STEP 1: Fetch the paginated logs and total count in a single transaction ---
    const [logs, total] = await prisma.$transaction([
      prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: "desc" },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    // --- STEP 2: HYDRATE THE TARGET DATA (Using custom_id) ---

    // 1. Get all unique targetIds that look like member custom IDs.
    const memberCustomIds = Array.from(
      new Set(
        logs
          .map((log) => log.targetId)
          .filter(
            (id): id is string =>
              typeof id === "string" && id.startsWith("EDM-")
          )
      )
    );

    // 2. Query the member table using their `custom_id` to get their details.
    let members: MemberForAuditLog[] = [];
    if (memberCustomIds.length > 0) {
      members = await prisma.member.findMany({
        where: {
          custom_id: { in: memberCustomIds },
        },
        select: {
          id: true,
          first_name: true,
          last_name: true,
          custom_id: true,
        },
      });
    }

    // 3. Create a lookup map where the KEY is the `custom_id` for fast access.
    const targetDataMap = new Map();
    for (const member of members) {
      if (member.custom_id) {
        targetDataMap.set(member.custom_id, {
          name: `${member.first_name || ""} ${member.last_name || ""}`.trim(),
          customId: member.custom_id,
          link: `/list/members?search=${member.custom_id}`,
        });
      }
    }

    // --- STEP 3: Combine the logs with the hydrated target data ---
    const hydratedLogs = logs.map((log) => ({
      ...log,
      target: log.targetId ? targetDataMap.get(log.targetId) : null,
    }));

    // --- STEP 4: Fetch unique users for the filter dropdown ---
    const users = await prisma.auditLog.findMany({
      distinct: ["userId"],
      select: { userId: true, userFullName: true },
    });
    const uniqueUsers = Array.from(
      new Map(users.map((u) => [u.userId, u])).values()
    );

    // --- STEP 5: Return the combined and paginated data ---
    return NextResponse.json({
      logs: hydratedLogs,
      total,
      users: uniqueUsers,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Failed to fetch detailed audit logs:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

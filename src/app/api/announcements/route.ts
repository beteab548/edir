// app/api/announcements/route.ts
import  prisma  from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const announcements = await prisma.announcements.findMany({
    orderBy: { created_at: "desc" },
  });

  return NextResponse.json(announcements);
}

// /app/api/imagekit/delete/route.ts
import { deleteImageFromImageKit } from "@/lib/deleteImageFile";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { fileId } = await req.json();

  if (!fileId) {
    return NextResponse.json({ error: "fileId is required" }, { status: 400 });
  }

  try {
    await deleteImageFromImageKit(fileId);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete image" }, { status: 500 });
  }
}

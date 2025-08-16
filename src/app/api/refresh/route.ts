import { generateContributionSchedulesForAllActiveMembers } from "@/lib/services/generateSchedulesForAllMembers";
import { NextResponse } from "next/server";

export async function POST() {
  try {
///simulate a delay to mimic a long-running process
    await generateContributionSchedulesForAllActiveMembers();
    return NextResponse.json({ success: true, message: "System refreshed successfully" });
  } catch (error: any) {
    console.error("Refresh failed:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

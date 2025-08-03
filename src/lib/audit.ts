// In src/lib/audit.ts

import prisma from "./prisma";
import { ActionStatus, ActionType } from "@prisma/client";

interface LogActionParams {
  userId: string;
  userFullName: string;
  actionType: ActionType;
  details: string;
  status: ActionStatus;
  targetId?: string;
  error?: string;
}

export async function logAction(params: LogActionParams) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        userFullName: params.userFullName,
        actionType: params.actionType,
        details: params.details,
        status: params.status,
        targetId: params.targetId,
        error: params.error ? String(params.error).substring(0, 500) : undefined,
      },
    });
  } catch (logError) {
    // Critical: If logging fails, it must not crash the main application.
    // We just log it to the console.
    console.error("FATAL: Failed to write to audit log:", logError);
    console.error("Original log data:", params);
  }
}
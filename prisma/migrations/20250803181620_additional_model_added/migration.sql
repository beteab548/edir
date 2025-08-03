-- CreateEnum
CREATE TYPE "public"."ActionStatus" AS ENUM ('SUCCESS', 'FAILURE');

-- CreateEnum
CREATE TYPE "public"."ActionType" AS ENUM ('MEMBER_CREATE', 'MEMBER_UPDATE', 'MEMBER_DELETE', 'FAMILY_CREATE', 'FAMILY_UPDATE', 'PENALTY_CREATE', 'PENALTY_DELETE', 'PENALTY_WAIVE', 'PAYMENT_CREATE', 'PAYMENT_DELETE', 'ROlE_TRANSFER', 'CONTRIBUTION_CREATE', 'CONTRIBUTION_UPDATE', 'CONTRIBUTION_DELETE', 'PENALTY_TYPE_CREATE', 'PENALTY_TYPE_UPDATE', 'PENALTY_TYPE_DELETE', 'USER_LOGIN');

-- CreateTable
CREATE TABLE "public"."AuditLog" (
    "id" SERIAL NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "userFullName" TEXT NOT NULL,
    "actionType" "public"."ActionType" NOT NULL,
    "details" TEXT NOT NULL,
    "status" "public"."ActionStatus" NOT NULL,
    "targetId" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "public"."AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_actionType_idx" ON "public"."AuditLog"("actionType");

-- CreateIndex
CREATE INDEX "AuditLog_timestamp_idx" ON "public"."AuditLog"("timestamp");

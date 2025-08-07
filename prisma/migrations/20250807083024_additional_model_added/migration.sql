/*
  Warnings:

  - The values [USER_LOGIN] on the enum `ActionType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."ActionType_new" AS ENUM ('MEMBER_CREATE', 'MEMBER_UPDATE', 'MEMBER_DELETE', 'FAMILY_CREATE', 'FAMILY_UPDATE', 'PENALTY_CREATE', 'PENALTY_DELETE', 'PENALTY_WAIVE', 'PAYMENT_CREATE', 'PAYMENT_DELETE', 'ROlE_TRANSFER', 'CONTRIBUTION_CREATE', 'CONTRIBUTION_UPDATE', 'CONTRIBUTION_DELETE', 'PENALTY_TYPE_CREATE', 'PENALTY_TYPE_UPDATE', 'PENALTY_TYPE_DELETE');
ALTER TABLE "public"."AuditLog" ALTER COLUMN "actionType" TYPE "public"."ActionType_new" USING ("actionType"::text::"public"."ActionType_new");
ALTER TYPE "public"."ActionType" RENAME TO "ActionType_old";
ALTER TYPE "public"."ActionType_new" RENAME TO "ActionType";
DROP TYPE "public"."ActionType_old";
COMMIT;

-- AlterTable
ALTER TABLE "public"."PaymentRecord" ADD COLUMN     "excess_balance" DECIMAL(65,30) DEFAULT 0;

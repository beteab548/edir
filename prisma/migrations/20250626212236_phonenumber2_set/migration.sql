/*
  Warnings:

  - The values [Deceased] on the enum `MemberType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "MemberType_new" AS ENUM ('New', 'Existing');
ALTER TABLE "Member" ALTER COLUMN "member_type" TYPE "MemberType_new" USING ("member_type"::text::"MemberType_new");
ALTER TYPE "MemberType" RENAME TO "MemberType_old";
ALTER TYPE "MemberType_new" RENAME TO "MemberType";
DROP TYPE "MemberType_old";
COMMIT;

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Status" ADD VALUE 'Left';
ALTER TYPE "Status" ADD VALUE 'Deceased';

-- DropIndex
DROP INDEX "Member_phone_number_2_key";

-- DropIndex
DROP INDEX "Member_phone_number_key";

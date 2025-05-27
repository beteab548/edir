/*
  Warnings:

  - Added the required column `member_type` to the `Member` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MemberType" AS ENUM ('New', 'Existing');

-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "member_type" "MemberType" NOT NULL;

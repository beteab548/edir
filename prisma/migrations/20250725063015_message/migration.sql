/*
  Warnings:

  - You are about to drop the `Announcements` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `marital_status` to the `Member` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MaritalStatus" AS ENUM ('single', 'married', 'divorced', 'widowed');

-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "block" TEXT,
ADD COLUMN     "founding_member" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "green_area" TEXT,
ADD COLUMN     "marital_status" "MaritalStatus" NOT NULL;

-- DropTable
DROP TABLE "Announcements";

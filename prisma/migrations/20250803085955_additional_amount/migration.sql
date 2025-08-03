/*
  Warnings:

  - You are about to drop the column `id_number` on the `Member` table. All the data in the column will be lost.
  - You are about to drop the column `joined_date` on the `Member` table. All the data in the column will be lost.
  - You are about to drop the column `member_id` on the `Relative` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[spouseId]` on the table `Member` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[member_id,contribution_id,missed_month]` on the table `Penalty` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `familyId` to the `Member` table without a default value. This is not possible if the table is not empty.
  - Added the required column `amount` to the `PenaltyTypeModel` table without a default value. This is not possible if the table is not empty.
  - Added the required column `familyId` to the `Relative` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "IDType" AS ENUM ('FAYDA', 'KEBELE_ID', 'PASSPORT');

-- DropForeignKey
ALTER TABLE "Relative" DROP CONSTRAINT "Relative_member_id_fkey";

-- DropIndex
DROP INDEX "Member_bank_account_number_key";

-- DropIndex
DROP INDEX "Member_email_2_key";

-- DropIndex
DROP INDEX "Member_email_key";

-- DropIndex
DROP INDEX "Member_id_number_key";

-- AlterTable
ALTER TABLE "Balance" ADD COLUMN     "unallocated_amount" DECIMAL(65,30) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Member" DROP COLUMN "id_number",
DROP COLUMN "joined_date",
ADD COLUMN     "familyId" INTEGER NOT NULL,
ADD COLUMN     "identification_file_id" TEXT,
ADD COLUMN     "identification_image" TEXT,
ADD COLUMN     "identification_number" TEXT,
ADD COLUMN     "identification_type" "IDType",
ADD COLUMN     "isPrincipal" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "registered_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "spouseId" INTEGER,
ALTER COLUMN "first_name" DROP NOT NULL,
ALTER COLUMN "second_name" DROP NOT NULL,
ALTER COLUMN "last_name" DROP NOT NULL,
ALTER COLUMN "citizen" DROP NOT NULL,
ALTER COLUMN "sex" DROP NOT NULL,
ALTER COLUMN "phone_number" DROP NOT NULL,
ALTER COLUMN "status" DROP NOT NULL,
ALTER COLUMN "member_type" DROP NOT NULL,
ALTER COLUMN "phone_number_2" DROP NOT NULL,
ALTER COLUMN "custom_id" DROP NOT NULL,
ALTER COLUMN "marital_status" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "penalty_id" INTEGER;

-- AlterTable
ALTER TABLE "Penalty" ADD COLUMN     "waived_reason" TEXT,
ADD COLUMN     "waived_reason_document" TEXT,
ADD COLUMN     "waived_reason_document_file_id" TEXT;

-- AlterTable
ALTER TABLE "PenaltyTypeModel" ADD COLUMN     "amount" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Relative" DROP COLUMN "member_id",
ADD COLUMN     "familyId" INTEGER NOT NULL,
ALTER COLUMN "second_name" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Family" (
    "id" SERIAL NOT NULL,
    "familyId" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Family_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Family_familyId_key" ON "Family"("familyId");

-- CreateIndex
CREATE UNIQUE INDEX "Member_spouseId_key" ON "Member"("spouseId");

-- CreateIndex
CREATE UNIQUE INDEX "Penalty_member_id_contribution_id_missed_month_key" ON "Penalty"("member_id", "contribution_id", "missed_month");

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_spouseId_fkey" FOREIGN KEY ("spouseId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Relative" ADD CONSTRAINT "Relative_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_penalty_id_fkey" FOREIGN KEY ("penalty_id") REFERENCES "Penalty"("id") ON DELETE SET NULL ON UPDATE CASCADE;

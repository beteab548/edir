/*
  Warnings:

  - You are about to drop the column `contribution_id` on the `PaymentRecord` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "PaymentRecord" DROP CONSTRAINT "PaymentRecord_contribution_id_fkey";

-- AlterTable
ALTER TABLE "PaymentRecord" DROP COLUMN "contribution_id",
ADD COLUMN     "contribution_Type_id" INTEGER;

-- AddForeignKey
ALTER TABLE "PaymentRecord" ADD CONSTRAINT "PaymentRecord_contribution_Type_id_fkey" FOREIGN KEY ("contribution_Type_id") REFERENCES "ContributionType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

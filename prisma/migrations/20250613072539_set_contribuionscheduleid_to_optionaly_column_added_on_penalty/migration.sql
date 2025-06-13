/*
  Warnings:

  - You are about to drop the column `payed_for_penalty_type` on the `Payment` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "PaymentRecord" DROP CONSTRAINT "PaymentRecord_contribution_id_fkey";

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "payed_for_penalty_type";

-- AlterTable
ALTER TABLE "PaymentRecord" ADD COLUMN     "penalty_type_payed_for" "PenaltyType" DEFAULT 'automatically',
ALTER COLUMN "contribution_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "PaymentRecord" ADD CONSTRAINT "PaymentRecord_contribution_id_fkey" FOREIGN KEY ("contribution_id") REFERENCES "Contribution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

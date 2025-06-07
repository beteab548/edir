/*
  Warnings:

  - You are about to drop the column `created_at` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `payment_date` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `payment_method` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `PaymentRecord` table. All the data in the column will be lost.
  - You are about to drop the column `payment_type` on the `PaymentRecord` table. All the data in the column will be lost.
  - You are about to drop the column `total_amount` on the `PaymentRecord` table. All the data in the column will be lost.
  - Added the required column `contribution_id` to the `PaymentRecord` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_contribution_id_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_contribution_schedule_id_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_member_id_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_payment_record_id_fkey";

-- DropForeignKey
ALTER TABLE "PaymentRecord" DROP CONSTRAINT "PaymentRecord_member_id_fkey";

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "created_at",
DROP COLUMN "payment_date",
DROP COLUMN "payment_method";

-- AlterTable
ALTER TABLE "PaymentRecord" DROP COLUMN "created_at",
DROP COLUMN "payment_type",
DROP COLUMN "total_amount",
ADD COLUMN     "contribution_id" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "PaymentRecord" ADD CONSTRAINT "PaymentRecord_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentRecord" ADD CONSTRAINT "PaymentRecord_contribution_id_fkey" FOREIGN KEY ("contribution_id") REFERENCES "Contribution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_payment_record_id_fkey" FOREIGN KEY ("payment_record_id") REFERENCES "PaymentRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_contribution_id_fkey" FOREIGN KEY ("contribution_id") REFERENCES "Contribution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_contribution_schedule_id_fkey" FOREIGN KEY ("contribution_schedule_id") REFERENCES "ContributionSchedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

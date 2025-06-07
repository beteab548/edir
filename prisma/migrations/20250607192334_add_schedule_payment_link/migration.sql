/*
  Warnings:

  - You are about to drop the column `document` on the `Payment` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[phone_number_2]` on the table `Member` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[bank_account_number]` on the table `Member` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `Member` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email_2]` on the table `Member` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `payment_record_id` to the `Payment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ContributionSchedule" ALTER COLUMN "paid_amount" SET DEFAULT 0.0;

-- AlterTable
ALTER TABLE "ContributionType" ADD COLUMN     "months_before_inactivation" INTEGER;

-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "bank_account_name" TEXT,
ADD COLUMN     "bank_account_number" TEXT,
ADD COLUMN     "bank_name" TEXT,
ADD COLUMN     "document_file_id" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "email_2" TEXT,
ADD COLUMN     "image_file_id" TEXT,
ADD COLUMN     "image_url" TEXT,
ADD COLUMN     "phone_number_2" TEXT NOT NULL DEFAULT 'null';

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "document",
ADD COLUMN     "contribution_schedule_id" INTEGER,
ADD COLUMN     "payment_record_id" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "PaymentRecord" (
    "id" SERIAL NOT NULL,
    "member_id" INTEGER NOT NULL,
    "total_amount" DECIMAL(65,30) NOT NULL,
    "payment_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payment_method" TEXT NOT NULL,
    "document" TEXT,
    "payment_type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Member_phone_number_2_key" ON "Member"("phone_number_2");

-- CreateIndex
CREATE UNIQUE INDEX "Member_bank_account_number_key" ON "Member"("bank_account_number");

-- CreateIndex
CREATE UNIQUE INDEX "Member_email_key" ON "Member"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Member_email_2_key" ON "Member"("email_2");

-- AddForeignKey
ALTER TABLE "PaymentRecord" ADD CONSTRAINT "PaymentRecord_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_contribution_schedule_id_fkey" FOREIGN KEY ("contribution_schedule_id") REFERENCES "ContributionSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_payment_record_id_fkey" FOREIGN KEY ("payment_record_id") REFERENCES "PaymentRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

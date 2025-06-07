/*
  Warnings:

  - You are about to drop the column `document` on the `PaymentRecord` table. All the data in the column will be lost.
  - Added the required column `total_paid_amount` to the `PaymentRecord` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PaymentRecord" DROP COLUMN "document",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "document_reference" TEXT NOT NULL DEFAULT '-',
ADD COLUMN     "total_paid_amount" DECIMAL(65,30) NOT NULL,
ALTER COLUMN "payment_date" DROP DEFAULT;

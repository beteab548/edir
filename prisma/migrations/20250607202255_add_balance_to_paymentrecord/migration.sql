/*
  Warnings:

  - Added the required column `remaining_balance` to the `PaymentRecord` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PaymentRecord" ADD COLUMN     "remaining_balance" DECIMAL(65,30) NOT NULL,
ALTER COLUMN "payment_date" SET DEFAULT CURRENT_TIMESTAMP;

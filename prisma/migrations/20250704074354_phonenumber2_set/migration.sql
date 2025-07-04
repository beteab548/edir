/*
  Warnings:

  - Added the required column `custom_id` to the `PaymentRecord` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PaymentRecord" ADD COLUMN     "custom_id" TEXT NOT NULL;

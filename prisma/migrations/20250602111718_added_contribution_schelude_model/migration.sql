/*
  Warnings:

  - Added the required column `paid_amount` to the `ContributionSchedule` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ContributionSchedule" ADD COLUMN     "paid_amount" DECIMAL(65,30) NOT NULL;

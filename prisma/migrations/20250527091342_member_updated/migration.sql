/*
  Warnings:

  - Added the required column `random` to the `Contribution` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Contribution" ADD COLUMN     "random" INTEGER NOT NULL;

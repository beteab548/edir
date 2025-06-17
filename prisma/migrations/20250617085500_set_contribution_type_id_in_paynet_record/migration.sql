/*
  Warnings:

  - You are about to drop the column `amount` on the `Penalty` table. All the data in the column will be lost.
  - Added the required column `expected_amount` to the `Penalty` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ContributionSchedule" ADD COLUMN     "expected_amount" DECIMAL(65,30) NOT NULL DEFAULT 0.0;

-- AlterTable
ALTER TABLE "Penalty" DROP COLUMN "amount",
ADD COLUMN     "expected_amount" DECIMAL(65,30) NOT NULL;

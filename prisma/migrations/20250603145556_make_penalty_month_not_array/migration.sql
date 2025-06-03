/*
  Warnings:

  - You are about to drop the `MissedMonth` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `contribution_schedule_id` to the `Penalty` table without a default value. This is not possible if the table is not empty.
  - Added the required column `is_paid` to the `Penalty` table without a default value. This is not possible if the table is not empty.
  - Added the required column `missed_month` to the `Penalty` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "MissedMonth" DROP CONSTRAINT "MissedMonth_penalty_id_fkey";

-- AlterTable
ALTER TABLE "Penalty" ADD COLUMN     "contribution_schedule_id" INTEGER NOT NULL,
ADD COLUMN     "is_paid" BOOLEAN NOT NULL,
ADD COLUMN     "missed_month" TIMESTAMP(3) NOT NULL;

-- DropTable
DROP TABLE "MissedMonth";

-- AddForeignKey
ALTER TABLE "Penalty" ADD CONSTRAINT "Penalty_contribution_schedule_id_fkey" FOREIGN KEY ("contribution_schedule_id") REFERENCES "ContributionSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

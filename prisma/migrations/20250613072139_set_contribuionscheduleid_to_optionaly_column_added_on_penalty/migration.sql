/*
  Warnings:

  - The `generated` column on the `Penalty` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Made the column `start_date` on table `ContributionType` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "PenaltyType" AS ENUM ('automatically', 'manually');

-- AlterTable
ALTER TABLE "ContributionType" ALTER COLUMN "start_date" SET NOT NULL;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "payed_for_penalty_type" "PenaltyType" DEFAULT 'automatically';

-- AlterTable
ALTER TABLE "Penalty" DROP COLUMN "generated",
ADD COLUMN     "generated" "PenaltyType" DEFAULT 'automatically';

-- DropEnum
DROP TYPE "GeneratedType";

-- CreateEnum
CREATE TYPE "ContributionMode" AS ENUM ('OneTime', 'Ongoing');

-- AlterTable
ALTER TABLE "ContributionType" ADD COLUMN     "mode" "ContributionMode" NOT NULL DEFAULT 'OneTime',
ADD COLUMN     "period_months" INTEGER;

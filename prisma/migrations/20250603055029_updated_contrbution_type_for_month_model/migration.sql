/*
  Warnings:

  - The values [OneTime,Ongoing] on the enum `ContributionMode` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ContributionMode_new" AS ENUM ('Recurring', 'OneTimeWindow');
ALTER TABLE "ContributionType" ALTER COLUMN "mode" DROP DEFAULT;
ALTER TABLE "ContributionType" ALTER COLUMN "mode" TYPE "ContributionMode_new" USING ("mode"::text::"ContributionMode_new");
ALTER TYPE "ContributionMode" RENAME TO "ContributionMode_old";
ALTER TYPE "ContributionMode_new" RENAME TO "ContributionMode";
DROP TYPE "ContributionMode_old";
ALTER TABLE "ContributionType" ALTER COLUMN "mode" SET DEFAULT 'OneTimeWindow';
COMMIT;

-- AlterTable
ALTER TABLE "ContributionType" ALTER COLUMN "mode" SET DEFAULT 'OneTimeWindow';

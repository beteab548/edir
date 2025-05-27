/*
  Warnings:

  - Added the required column `contribution_type_id` to the `Contribution` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Contribution" ADD COLUMN     "contribution_type_id" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Contribution" ADD CONSTRAINT "Contribution_contribution_type_id_fkey" FOREIGN KEY ("contribution_type_id") REFERENCES "ContributionType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

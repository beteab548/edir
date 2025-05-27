/*
  Warnings:

  - You are about to drop the column `contribution_type_id` on the `Contribution` table. All the data in the column will be lost.
  - Added the required column `type_id` to the `Contribution` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Contribution" DROP CONSTRAINT "Contribution_contribution_type_id_fkey";

-- AlterTable
ALTER TABLE "Contribution" DROP COLUMN "contribution_type_id",
ADD COLUMN     "type_id" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Contribution" ADD CONSTRAINT "Contribution_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "ContributionType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

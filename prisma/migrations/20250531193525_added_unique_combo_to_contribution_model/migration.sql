/*
  Warnings:

  - A unique constraint covering the columns `[member_id,contribution_type_id]` on the table `Contribution` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Contribution_member_id_contribution_type_id_key" ON "Contribution"("member_id", "contribution_type_id");

/*
  Warnings:

  - Added the required column `penaltyTypeId` to the `Penalty` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Penalty" ADD COLUMN     "penaltyTypeId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "PenaltyTypeModel" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "PenaltyTypeModel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PenaltyTypeModel_name_key" ON "PenaltyTypeModel"("name");

-- AddForeignKey
ALTER TABLE "Penalty" ADD CONSTRAINT "Penalty_penaltyTypeId_fkey" FOREIGN KEY ("penaltyTypeId") REFERENCES "PenaltyTypeModel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

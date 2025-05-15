/*
  Warnings:

  - You are about to drop the column `address` on the `Member` table. All the data in the column will be lost.
  - Added the required column `kebele` to the `Member` table without a default value. This is not possible if the table is not empty.
  - Added the required column `wereda` to the `Member` table without a default value. This is not possible if the table is not empty.
  - Added the required column `zone_or_district` to the `Member` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Member" DROP COLUMN "address",
ADD COLUMN     "kebele" TEXT NOT NULL,
ADD COLUMN     "wereda" TEXT NOT NULL,
ADD COLUMN     "zone_or_district" TEXT NOT NULL,
ALTER COLUMN "profession" DROP NOT NULL,
ALTER COLUMN "title" DROP NOT NULL,
ALTER COLUMN "job_business" DROP NOT NULL,
ALTER COLUMN "id_number" DROP NOT NULL,
ALTER COLUMN "end_date" DROP NOT NULL,
ALTER COLUMN "document" DROP NOT NULL,
ALTER COLUMN "remark" DROP NOT NULL;

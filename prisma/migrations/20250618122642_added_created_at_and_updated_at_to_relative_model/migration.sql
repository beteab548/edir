/*
  Warnings:

  - A unique constraint covering the columns `[custom_id]` on the table `Member` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `custom_id` to the `Member` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "custom_id" TEXT NOT NULL,
ADD COLUMN     "status_updated_at" TIMESTAMP(3),
ALTER COLUMN "phone_number_2" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Relative" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "status_updated_at" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Member_custom_id_key" ON "Member"("custom_id");

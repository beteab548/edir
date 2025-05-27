/*
  Warnings:

  - You are about to drop the `ContributionTypes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Contributions` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Balance" DROP CONSTRAINT "Balance_contribution_id_fkey";

-- DropForeignKey
ALTER TABLE "Contributions" DROP CONSTRAINT "Contributions_contribution_type_id_fkey";

-- DropForeignKey
ALTER TABLE "Contributions" DROP CONSTRAINT "Contributions_member_id_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_contribution_id_fkey";

-- DropForeignKey
ALTER TABLE "Penalty" DROP CONSTRAINT "Penalty_contribution_id_fkey";

-- DropTable
DROP TABLE "ContributionTypes";

-- DropTable
DROP TABLE "Contributions";

-- CreateTable
CREATE TABLE "Contribution" (
    "id" SERIAL NOT NULL,
    "member_id" INTEGER NOT NULL,
    "contribution_type_id" INTEGER NOT NULL,
    "random" INTEGER NOT NULL,
    "type_name" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContributionType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_for_all" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),

    CONSTRAINT "ContributionType_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ContributionType_name_key" ON "ContributionType"("name");

-- AddForeignKey
ALTER TABLE "Contribution" ADD CONSTRAINT "Contribution_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contribution" ADD CONSTRAINT "Contribution_contribution_type_id_fkey" FOREIGN KEY ("contribution_type_id") REFERENCES "ContributionType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_contribution_id_fkey" FOREIGN KEY ("contribution_id") REFERENCES "Contribution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Balance" ADD CONSTRAINT "Balance_contribution_id_fkey" FOREIGN KEY ("contribution_id") REFERENCES "Contribution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Penalty" ADD CONSTRAINT "Penalty_contribution_id_fkey" FOREIGN KEY ("contribution_id") REFERENCES "Contribution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

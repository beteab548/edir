-- CreateEnum
CREATE TYPE "Sex" AS ENUM ('Female', 'Male');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('Active', 'Inactive');

-- CreateEnum
CREATE TYPE "RelativeStatus" AS ENUM ('Alive', 'Sick', 'Deceased');

-- CreateEnum
CREATE TYPE "RelationType" AS ENUM ('Mother', 'Father', 'Daughter', 'Son', 'Sister', 'Brother', 'Spouse_Mother', 'Spouse_Father', 'Spouse_Sister', 'Spouse_Brother', 'other');

-- CreateTable
CREATE TABLE "Member" (
    "id" SERIAL NOT NULL,
    "first_name" TEXT NOT NULL,
    "second_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "profession" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "job_business" TEXT NOT NULL,
    "id_number" TEXT NOT NULL,
    "birth_date" TIMESTAMP(3) NOT NULL,
    "citizen" TEXT NOT NULL,
    "joined_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_date" TIMESTAMP(3) NOT NULL,
    "address" TEXT NOT NULL,
    "sex" "Sex" NOT NULL,
    "phone_number" TEXT NOT NULL,
    "document" TEXT NOT NULL,
    "remark" TEXT NOT NULL,
    "status" "Status" NOT NULL,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Relative" (
    "id" SERIAL NOT NULL,
    "member_id" INTEGER NOT NULL,
    "first_name" TEXT NOT NULL,
    "second_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "relation_type" TEXT NOT NULL,
    "status" "RelativeStatus" NOT NULL,

    CONSTRAINT "Relative_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contribution" (
    "id" SERIAL NOT NULL,
    "member_id" INTEGER NOT NULL,
    "type_name" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" SERIAL NOT NULL,
    "contribution_id" INTEGER NOT NULL,
    "member_id" INTEGER NOT NULL,
    "payment_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payment_month" TEXT NOT NULL,
    "paid_amount" DECIMAL(65,30) NOT NULL,
    "payment_method" TEXT NOT NULL,
    "document" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Balance" (
    "id" SERIAL NOT NULL,
    "member_id" INTEGER NOT NULL,
    "contribution_id" INTEGER NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Balance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Penalty" (
    "id" SERIAL NOT NULL,
    "member_id" INTEGER NOT NULL,
    "contribution_id" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "applied_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "Penalty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MissedMonth" (
    "id" SERIAL NOT NULL,
    "penalty_id" INTEGER NOT NULL,
    "month" TEXT NOT NULL,

    CONSTRAINT "MissedMonth_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Member_id_number_key" ON "Member"("id_number");

-- CreateIndex
CREATE UNIQUE INDEX "Member_phone_number_key" ON "Member"("phone_number");

-- CreateIndex
CREATE UNIQUE INDEX "Contribution_type_name_key" ON "Contribution"("type_name");

-- CreateIndex
CREATE UNIQUE INDEX "Balance_member_id_contribution_id_key" ON "Balance"("member_id", "contribution_id");

-- AddForeignKey
ALTER TABLE "Relative" ADD CONSTRAINT "Relative_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contribution" ADD CONSTRAINT "Contribution_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_contribution_id_fkey" FOREIGN KEY ("contribution_id") REFERENCES "Contribution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Balance" ADD CONSTRAINT "Balance_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Balance" ADD CONSTRAINT "Balance_contribution_id_fkey" FOREIGN KEY ("contribution_id") REFERENCES "Contribution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Penalty" ADD CONSTRAINT "Penalty_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Penalty" ADD CONSTRAINT "Penalty_contribution_id_fkey" FOREIGN KEY ("contribution_id") REFERENCES "Contribution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissedMonth" ADD CONSTRAINT "MissedMonth_penalty_id_fkey" FOREIGN KEY ("penalty_id") REFERENCES "Penalty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

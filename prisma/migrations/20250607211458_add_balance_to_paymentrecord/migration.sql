-- AlterTable
ALTER TABLE "Penalty" ADD COLUMN     "paid_amount" DECIMAL(65,30) NOT NULL DEFAULT 0,
ALTER COLUMN "is_paid" SET DEFAULT false;

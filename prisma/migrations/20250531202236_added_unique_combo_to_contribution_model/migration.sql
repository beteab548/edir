-- CreateTable
CREATE TABLE "ContributionSchedule" (
    "id" SERIAL NOT NULL,
    "contribution_id" INTEGER NOT NULL,
    "member_id" INTEGER NOT NULL,
    "month" TEXT NOT NULL,
    "is_paid" BOOLEAN NOT NULL DEFAULT false,
    "paid_at" TIMESTAMP(3),

    CONSTRAINT "ContributionSchedule_pkey" PRIMARY KEY ("id")
);

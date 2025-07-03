-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_payment_record_id_fkey";

-- CreateTable
CREATE TABLE "Announcements" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "Description" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "calendar" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Announcements_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_payment_record_id_fkey" FOREIGN KEY ("payment_record_id") REFERENCES "PaymentRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

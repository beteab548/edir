-- DropForeignKey
ALTER TABLE "PaymentRecord" DROP CONSTRAINT "PaymentRecord_contribution_Type_id_fkey";

-- AddForeignKey
ALTER TABLE "PaymentRecord" ADD CONSTRAINT "PaymentRecord_contribution_Type_id_fkey" FOREIGN KEY ("contribution_Type_id") REFERENCES "ContributionType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

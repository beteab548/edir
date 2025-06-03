-- AddForeignKey
ALTER TABLE "ContributionSchedule" ADD CONSTRAINT "ContributionSchedule_contribution_id_fkey" FOREIGN KEY ("contribution_id") REFERENCES "Contribution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

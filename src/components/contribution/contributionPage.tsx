import ConfigureExistingContribution from "./ConfigureExistingContribution";
import prisma from "@/lib/prisma";

export default async function ContributionPage() {
  async function fetchContributionTypes() {
    const data = await prisma.contributionType.findMany();
    const safeContributions = data.map(c => ({
  ...c,
  amount: c.amount.toNumber(), 
}));
    return safeContributions;
  }
  const data = await fetchContributionTypes();
  return (
    <div className="min-h-screen bg-base-200 p-8 space-y-8">
      <ConfigureExistingContribution
        contributionTypes={data} />
      {/* <CreateNewContribution /> */}
    </div>
  );
}

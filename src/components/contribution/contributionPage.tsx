import ConfigureExistingContribution from "./ConfigureExistingContribution";
import prisma from "@/lib/prisma";

export default async function ContributionPage() {
    const members = await prisma.member.findMany({where:{status:"Active"}});
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
        contributionTypes={data} members={members}/>
      {/* <CreateNewContribution /> */}
    </div>
  );
}

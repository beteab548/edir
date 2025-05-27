import ConfigureExistingContribution from "./ConfigureExistingContribution";
import prisma from "@/lib/prisma";
import CreateNewContribution from "./createNewContribution";

export default async function ContributionPage() {
    async function fetchContributionTypes() {
    const members = await prisma.member.findMany({where:{status:"Active"}});
    const data = await prisma.contributionType.findMany();
    const safeContributions = data.map(c => ({
  ...c,
  amount: c.amount.toNumber(), 
}));
    return {safeContributions, members}; ;
  }
  const {members,safeContributions} = await fetchContributionTypes();
  return (
    <div className="min-h-screen bg-base-200 p-8 space-y-8">
      <ConfigureExistingContribution
        contributionTypes={safeContributions} members={members}/>
      <CreateNewContribution members={members} />
    </div>
  );
}

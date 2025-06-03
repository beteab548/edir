import prisma from "@/lib/prisma";
import ContributionClientWrapper from "./ContributionClientWrapper";

export default async function ContributionPage() {
  const members = await prisma.member.findMany({ where: { status: "Active" } });
  const data = await prisma.contributionType.findMany();
  const safeContributions = data.map((c) => ({
    ...c,
    amount: c.amount.toNumber(),
  }));
const contributions=await prisma.contribution.findMany()
console.log(contributions);
  return (
    <ContributionClientWrapper
      members={members}
      contributionTypes={safeContributions}
    />
  );
}

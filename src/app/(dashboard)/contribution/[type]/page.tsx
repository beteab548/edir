
import prisma from "@/lib/prisma";
import ContributionTemplate from "../../../../components/payment/paymentTemplate";
import Penalty from "../../../../components/penalties"; // adjust the import path as needed
import { getMembersWithPenalties } from '@/lib/actions';

type PageProps = {
  params: Promise<{
    type: string;
  }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ContributionPage({ params }: PageProps) {
  const { type } = await params;
  const decodedType = decodeURIComponent(type);
  const updatedType = decodedType.replace(/%20/g, " ");

  const types = await prisma.contributionType.findUnique({
    where: { name: updatedType ?? undefined },
  });
  const members= await getMembersWithPenalties();
  console.log("members", members);
  if (updatedType.toLowerCase() === "penalties") {
    return (
      <div className="contribution-page">
        <Penalty initialMembers={
          (await getMembersWithPenalties()).map(member => ({
            ...member,
            Penalty: member.Penalty
              .filter(penalty => penalty.contribution !== null)
              .map(penalty => ({
                ...penalty,
                contribution: penalty.contribution!
              }))
          }))
        } />
      </div>
    );
  }
  const payments = await prisma.paymentRecord.findMany({
    where: { contribution_id: types?.id ?? undefined ,penalty_type_payed_for:"automatically"},
    include: { member: true, contribution: true, payments: true },
    orderBy: {
      payment_date: "desc",
    },
  });
  console.log(payments);
  if (type) {
    const members = await prisma.member.findMany({
      where: {
        Contribution: {
          some: {
            type_name: types?.name,
          },
        },
        status: "Active",
      },
      include: {
        Contribution: true,
        Balance: true,
      },
    });
    if (!types) {
      throw new Error("Contribution type not found");
    }
    const updatedTypes = { ...types, amount: Number(types.amount) };
    return (
      <div className="contribution-page">
        <ContributionTemplate
          ContributionType={updatedTypes}
          members={members}
          payments={payments.map(payment => ({
            ...payment,
            contribution: payment.contribution === null ? undefined : payment.contribution,
          }))}
          type="automatically"
        />
      </div>
    );
  }
}

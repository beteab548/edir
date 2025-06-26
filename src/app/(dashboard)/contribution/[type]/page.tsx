import prisma from "@/lib/prisma";
import ContributionTemplate from "../../../../components/payment/paymentTemplate";
import Penalty from "../../../../components/penalties"; // adjust the import path as needed
import { getMembersWithPenalties } from "@/lib/actions";

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
  console.log("type is ", updatedType);
  const types = await prisma.contributionType.findUnique({
    where: { name: updatedType ?? undefined },
  });
  if (updatedType.toLowerCase() === "penalties") {
    return (
      <div className="contribution-page">
        <Penalty
          initialMembers={(await getMembersWithPenalties()).map((member) => ({
            ...member,
            Penalty: member.Penalty.filter(
              (penalty) => penalty.contribution !== null
            ).map((penalty) => ({
              ...penalty,
              contribution: penalty.contribution!,
            })),
          }))}
        />
      </div>
    );
  }
  const paymentsRaw = await prisma.paymentRecord.findMany({
    where: {
      contribution_Type_id: types?.id ?? undefined,
      penalty_type_payed_for: "automatically",
    },
    include: { member: true, contributionType: true, payments: true },
    orderBy: {
      payment_date: "desc",
    },
  });

  // Convert Decimal fields to number in contributionType
  const payments = paymentsRaw.map((payment) => ({
    ...payment,
    contributionType: payment.contributionType
      ? {
          ...payment.contributionType,
          amount: Number(payment.contributionType.amount),
          penalty_amount:
            payment.contributionType.penalty_amount !== null
              ? Number(payment.contributionType.penalty_amount)
              : null,
        }
      : null,
  }));

  console.log("payments are", payments);
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
          payments={payments}
          type="automatically"
        />
      </div>
    );
  }
}

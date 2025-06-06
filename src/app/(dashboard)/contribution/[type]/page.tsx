// app/contribution/[type]/page.tsx

import prisma from "@/lib/prisma";
import ContributionTemplate from "../../../../components/payment/paymentTemplate";
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
  const payments = await prisma.payment.findMany({
    where: { payment_type: types?.name ?? undefined },
    include: { member: true },
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
        Balance:true
      },
    });
    if (!types) {
      //redirect to not found url
      throw new Error("Contribution type not found");
    }
    const updatedTypes = { ...types, amount: Number(types.amount) };
    return (
      <div className="contribution-page">
        <ContributionTemplate
          ContributionType={updatedTypes}
          members={members}
          payments={payments}
        />
      </div>
    );
  }
}

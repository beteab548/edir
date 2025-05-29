// app/contribution/[type]/page.tsx

import prisma from "@/lib/prisma";
import ContributionTemplate from "../../../../components/payment/paymnetTemplate";
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
  console.log("current contribution type is ", types);
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
        />
      </div>
    );
  }
}

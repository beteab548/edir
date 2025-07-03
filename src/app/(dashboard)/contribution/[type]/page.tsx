import prisma from "@/lib/prisma";
import ContributionTemplate from "../../../../components/payment/paymentTemplate";
import Penalty from "../../../../components/Systempenalty";
import { getMembersWithPenalties } from "@/lib/actions";
import { notFound } from "next/navigation";

interface PageProps {
  params: {
    type: string;
  };
  searchParams?: {
    year?: string;
    month?: string;
    query?: string;
  };
}

export default async function ContributionPage({
  params,
  searchParams = {},
}: PageProps) {
  const decodedType = decodeURIComponent(params.type).replace(/%20/g, " ");
  const { year, month, query } = searchParams;

  // Handle penalties page
  if (decodedType.toLowerCase() === "penalties") {
    const members = (await getMembersWithPenalties()).map((member) => ({
      ...member,
      Penalty: member.Penalty.filter(
        (penalty) => penalty.contribution !== null
      ).map((penalty) => ({ ...penalty, contribution: penalty.contribution! })),
    }));
    return (
      <div className="contribution-page">
        <Penalty initialMembers={members} />
      </div>
    );
  }

  const contributionType = await prisma.contributionType.findUnique({
    where: { name: decodedType },
  });

  if (!contributionType) {
     notFound();
  }

  // Build member filter
  const memberFilter: any = {
    status: "Active",
    Contribution: {
      some: { type_name: contributionType.name },
    },
  };

  // Build date range for payments
  let dateStart: Date | undefined;
  let dateEnd: Date | undefined;

  if (year && month) {
    dateStart = new Date(`${year}-${month}-01`);
    dateEnd = new Date(dateStart);
    dateEnd.setMonth(dateEnd.getMonth() + 1);
  } else if (year) {
    dateStart = new Date(`${year}-01-01`);
    dateEnd = new Date(Number(year) + 1, 0, 1);
  }

  // Build payment filter
  const paymentFilter: any = {
    contribution_Type_id: contributionType.id,
    penalty_type_payed_for: "automatically",
  };

  if (dateStart && dateEnd) {
    paymentFilter.payment_date = {
      gte: dateStart,
      lt: dateEnd,
    };
  }

  // Shared search logic for both members and payments
  if (query) {
    const filterConditions = [
      { first_name: { contains: query, mode: "insensitive" } },
      { second_name: { contains: query, mode: "insensitive" } },
      { last_name: { contains: query, mode: "insensitive" } },
      { phone_number: { contains: query, mode: "insensitive" } },
      { custom_id: { contains: query, mode: "insensitive" } },
    ];

    memberFilter.OR = filterConditions;
    paymentFilter.member = { OR: filterConditions };
  }

  // Fetch filtered members
  const members = await prisma.member.findMany({
    where: memberFilter,
    include: {
      Contribution: true,
      Balance: true,
    },
  });

  // Fetch filtered payments
  const paymentsRaw = await prisma.paymentRecord.findMany({
    where: paymentFilter,
    include: {
      member: true,
      contributionType: true,
      payments: true,
    },
    orderBy: {
      payment_date: "desc",
    },
  });

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

  const updatedContributionType = {
    ...contributionType,
    amount: Number(contributionType.amount),
  };

  return (
    <div className="contribution-page">
      <ContributionTemplate
        ContributionType={updatedContributionType}
        members={members}
        payments={payments}
        type="automatically"
      />
    </div>
  );
}

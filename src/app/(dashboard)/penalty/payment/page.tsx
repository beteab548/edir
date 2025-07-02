import PaymentComponent from "../../../../components/payment/paymentTemplate";
import prisma from "@/lib/prisma";

interface SearchParams {
  searchParams: {
    year?: string;
    month?: string;
    query?: string;
  };
}

export default async function PenaltyPage({ searchParams }: SearchParams) {
  const { year, month, query } = searchParams;

  // Build shared query filter
  const filterConditions = query
    ? [
        { first_name: { contains: query, mode: "insensitive" } },
        { second_name: { contains: query, mode: "insensitive" } },
        { last_name: { contains: query, mode: "insensitive" } },
        { phone_number: { contains: query, mode: "insensitive" } },
        { custom_id: { contains: query, mode: "insensitive" } },
      ]
    : [];

  // Member filter
  const memberFilter: any = {
    status: "Active",
    ...(query && { OR: filterConditions }),
  };

  const members = await prisma.member.findMany({
    where: memberFilter,
  });

  // Date filtering for payments
  let dateStart: Date | undefined;
  let dateEnd: Date | undefined;

  if (year && month) {
    // Month-specific range
    dateStart = new Date(`${year}-${month}-01`);
    dateEnd = new Date(dateStart);
    dateEnd.setMonth(dateEnd.getMonth() + 1);
  } else if (year) {
    // Whole year
    dateStart = new Date(`${year}-01-01`);
    dateEnd = new Date(`${Number(year) + 1}-01-01`);
  }

  // Payment filter
  const paymentFilter: any = {
    penalty_type_payed_for: "manually",
  };

  if (dateStart && dateEnd) {
    paymentFilter.created_at = {
      gte: dateStart,
      lt: dateEnd,
    };
  }

  if (query) {
    paymentFilter.member = {
      OR: filterConditions,
    };
  }

  const payments = await prisma.paymentRecord.findMany({
    where: paymentFilter,
    include: {
      member: true,
    },
    orderBy: {
      created_at: "desc",
    },
  });

  return (
    <>
      <PaymentComponent members={members} payments={payments} type="manually" />
    </>
  );
}

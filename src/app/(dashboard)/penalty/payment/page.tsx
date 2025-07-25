export const dynamic = "force-dynamic";
import { currentUser } from "@clerk/nextjs/server";
import PaymentComponent from "../../../../components/payment/paymentTemplate";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
interface SearchParams {
  searchParams: {
    year?: string;
    month?: string;
    query?: string;
  };
}
export default async function PenaltyPage({ searchParams }: SearchParams) {
  const user = await currentUser();
  if (!user) {
    return redirect("/sign-in");
  }
  const role = user.publicMetadata?.role;
  if (role !== "chairman") {
    return redirect("/dashboard");
  }
  const { year, month, query } = searchParams;
  const filterConditions = query
    ? [
        { first_name: { contains: query, mode: "insensitive" } },
        { second_name: { contains: query, mode: "insensitive" } },
        { last_name: { contains: query, mode: "insensitive" } },
        { phone_number: { contains: query, mode: "insensitive" } },
        { custom_id: { contains: query, mode: "insensitive" } },
      ]
    : [];

  const memberFilter: any = {
    status: "Active",
    ...(query && { OR: filterConditions }),
  };

  const members = await prisma.member.findMany({
    where: memberFilter,
  });

  let dateStart: Date | undefined;
  let dateEnd: Date | undefined;

  if (year && month) {
    dateStart = new Date(`${year}-${month}-01`);
    dateEnd = new Date(dateStart);
    dateEnd.setMonth(dateEnd.getMonth() + 1);
  } else if (year) {
    dateStart = new Date(`${year}-01-01`);
    dateEnd = new Date(`${Number(year) + 1}-01-01`);
  }

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

  const paymentsRaw = await prisma.paymentRecord.findMany({
    where: paymentFilter,
    include: {
      member: true,
    },
    orderBy: {
      created_at: "desc",
    },
  });
  const payments = paymentsRaw.map((payment:any) => ({
    ...payment,
    total_paid_amount: Number(payment.total_paid_amount),
    remaining_balance: Number(payment.remaining_balance),
  }));
  return (
    <>
      <PaymentComponent members={members} payments={payments} type="manually" />
    </>
  );
}

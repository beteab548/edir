import PaymentComponent from "../../../../components/payment/paymentTemplate"; // adjust the import path as needed
import PenaltyManagement from "./penalty";
import prisma from "@/lib/prisma";
type PageProps = {
  params: Promise<{
    type: string;
  }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};
export default async function PenaltyPage({ params }: PageProps) {
  const { type } = await params;
  const decodedType = decodeURIComponent(type);
  const updatedType = decodedType.replace(/%20/g, " ");
  const [members, penalties] = await Promise.all([
  prisma.member.findMany({
      where:{
        status: "Active",
      },
    }),
    prisma.penalty.findMany({
      where: { generated: "manually" },
      include: {
        member: {
          select: {
            id: true,
            first_name: true,
            second_name: true,
            last_name: true,
          },
        },
      },
      orderBy: {
        applied_at: "desc",
      },
    }),
  ]);
  const penaltiesWithNumberAmount = penalties.map((penalty) => ({
    ...penalty,
    amount:
      typeof penalty.amount === "object" && "toNumber" in penalty.amount
        ? penalty.amount.toNumber()
        : penalty.amount,
    paid_amount:
      typeof penalty.paid_amount === "object" &&
      "toNumber" in penalty.paid_amount
        ? penalty.paid_amount.toNumber()
        : penalty.paid_amount,
    penalty_type: penalty.penalty_type ?? "",
  }));
  const payments = await prisma.paymentRecord.findMany({
    where: { penalty_type_payed_for: "manually" },
    include: {
      member: true,
    },
  });
  console.log("members" , members);
  if (updatedType.toLowerCase() === "payment") {
    return (
      <PaymentComponent members={members} payments={payments} type="manually" />
    );
  }
  return (
    <PenaltyManagement
      members={members}
      penalties={penaltiesWithNumberAmount}
    />
  );
}

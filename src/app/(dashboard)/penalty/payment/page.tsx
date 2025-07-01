import PaymentComponent from "../../../../components/payment/paymentTemplate"; // adjust the import path as needed
import prisma from "@/lib/prisma";

export default async function PenaltyPage() {
  const [members] = await Promise.all([
    prisma.member.findMany({
      where: {
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
            custom_id: true,
          },
        },
      },
      orderBy: {
        applied_at: "desc",
      },
    }),
  ]);

  const payments = await prisma.paymentRecord.findMany({
    where: { penalty_type_payed_for: "manually" },
    include: {
      member: true,
    },
  });
  return (
    <PaymentComponent members={members} payments={payments} type="manually" />
  );
}

export const dynamic = "force-dynamic";
import { currentUser } from "@clerk/nextjs/server";
import ContributionTemplate from "../../../../components/payment/paymentTemplate";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";

interface SearchParams {
  searchParams: {
    year?: string;
    month?: string;
    query?: string;
  };
}

// You will need this helper function to handle Decimal types from Prisma
function convertDecimalsToNumbers(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== "object") return obj;
  if (obj instanceof Date) return obj;
  if (typeof obj.toNumber === "function") return obj.toNumber();
  if (Array.isArray(obj)) return obj.map(convertDecimalsToNumbers);
  
  const result: any = {};
  for (const key in obj) {
    result[key] = convertDecimalsToNumbers(obj[key]);
  }
  return result;
}

export default async function PenaltyPage({ searchParams }: SearchParams) {
  const user = await currentUser();
  if (!user) {
    return redirect("/sign-in");
  }
  const role = user.publicMetadata?.role;
  if (role !== "chairman"&&role!=="admin") {
    return redirect("/dashboard");
  }
  const { year, month, query } = searchParams;

  // --- Filter for the list of principals to be passed to the payment modal ---
  const principalFilter: any = {
    isPrincipal: true,
    status: "Active",
    // They must have at least one penalty that is unpaid and not waived.
    Penalty: {
      some: {
        is_paid: false,
        waived: false, // or false, depending on your schema
      },
    },
  };

  // *** CORRECTED: Filter for the table of existing penalty payments ***
  const paymentFilter: any = {
    // This is the key change, as you correctly pointed out.
    penalty_type_payed_for: "manually",
  };

  // --- Add search query to BOTH filters ---
  if (query) {
    const searchConditions = {
      OR: [
        { first_name: { contains: query, mode: "insensitive" } },
        { second_name: { contains: query, mode: "insensitive" } },
        { last_name: { contains: query, mode: "insensitive" } },
        { phone_number: { contains: query, mode: "insensitive" } },
        { custom_id: { contains: query, mode: "insensitive" } },
      ],
    };
    // The `principalFilter` needs a slightly more complex structure to search the spouse
    principalFilter.AND = [
        { OR: [ ...searchConditions.OR, { spouse: searchConditions }] }
    ];
    // The `paymentFilter` searches the direct member
    paymentFilter.member = searchConditions;
  }
  
  // --- Date filtering for the payments table ---
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
  if (dateStart && dateEnd) {
    // Use the correct date field from your PaymentRecord schema, e.g., 'payment_date'
    paymentFilter.payment_date = { gte: dateStart, lt: dateEnd };
  }

  // --- Data Fetching ---

  // Fetch principals who have outstanding penalties to populate the selection dropdown.
  const principalsRaw = await prisma.member.findMany({
    where: principalFilter,
    include: {
      spouse: true,
    },
  });

  // Fetch only payment records that are for manual penalties.
  const paymentsRaw = await prisma.paymentRecord.findMany({
    where: paymentFilter,
    include: {
      member: true,
      payments: true, // For the expandable details view
    },
    orderBy: {
      payment_date: "desc",
    },
  });

  const principals = convertDecimalsToNumbers(principalsRaw);
  const payments = convertDecimalsToNumbers(paymentsRaw);

  return (
    <>
      <ContributionTemplate
        principals={principals}
        payments={payments}
        type="manually"
      />
    </>
  );
}
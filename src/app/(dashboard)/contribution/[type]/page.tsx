export const dynamic = "force-dynamic";
import prisma from "@/lib/prisma";
import ContributionTemplate from "../../../../components/payment/paymentTemplate";
import Penalty from "../../../../components/Systempenalty"; // Assuming this is for a different route now
import { notFound, redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";

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

// Your convertDecimalsToNumbers function remains the same.
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

export default async function ContributionPage({
  params,
  searchParams = {},
}: PageProps) {
  const decodedType = decodeURIComponent(params.type).replace(/%20/g, " ");

  // Assuming the 'penalties' page is now handled by the ManualPenaltyManagement component/route.
  // This page is now solely for contribution payments.
  const isPenaltiesPage = decodedType.toLowerCase() === "penalties";
  if (isPenaltiesPage) {
    // Or handle it differently if this route can still manage penalties.
    // For now, we assume it's a separate page and redirect or show notFound.
    notFound();
  }

  const contributionType = await prisma.contributionType.findUnique({
    where: { name: decodedType },
  });

  if (!contributionType) {
    notFound();
  }

  try {
    const user = await currentUser();
    if (!user) return redirect("/sign-in");

    const role = user.publicMetadata?.role;
    if (role !== "chairman"&&role!=="admin") return redirect("/dashboard");

    const { year, month, query } = searchParams;

    // --- Base Filters ---

    // Filter for the list of principals to be passed to the payment modal
    const principalFilter: any = {
      isPrincipal: true,
      status: "Active",
      Contribution: {
        some: { type_name: contributionType.name },
      },
    };

    // Filter for the list of existing payment records to display in the table
    const paymentFilter: any = {
      contribution_Type_id: contributionType.id,
      penalty_type_payed_for: "automatically", // Assuming this is correct for your logic
    };

    // --- Date Filtering (remains the same) ---
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

    if (dateStart && dateEnd) {
      paymentFilter.payment_date = {
        gte: dateStart,
        lt: dateEnd,
      };
    }

    // --- CORRECTED: Separated Search Logic ---
    if (query) {
      const terms = query
        .split(" ")
        .map((t) => t.trim())
        .filter(Boolean);

      // Logic 1: SMART search for the PRINCIPAL list (for the modal)
      // This searches principals OR their spouses.
      const principalSearchConditions = terms.map((term) => ({
        OR: [
          { first_name: { contains: term, mode: "insensitive" } },
          { second_name: { contains: term, mode: "insensitive" } },
          { last_name: { contains: term, mode: "insensitive" } },
          { phone_number: { contains: term, mode: "insensitive" } },
          { custom_id: { contains: term, mode: "insensitive" } },
          {
            spouse: {
              OR: [
                { first_name: { contains: term, mode: "insensitive" } },
                { second_name: { contains: term, mode: "insensitive" } },
                { last_name: { contains: term, mode: "insensitive" } },
              ],
            },
          },
        ],
      }));
      principalFilter.AND = principalSearchConditions;

      // Logic 2: SIMPLE search for the PAYMENT list (for the table)
      // This only searches the direct member linked to the payment.
      const paymentSearchConditions = terms.map((term) => ({
        OR: [
          { first_name: { contains: term, mode: "insensitive" } },
          { second_name: { contains: term, mode: "insensitive" } },
          { last_name: { contains: term, mode: "insensitive" } },
          { phone_number: { contains: term, mode: "insensitive" } },
          { custom_id: { contains: term, mode: "insensitive" } },
        ],
      }));
      paymentFilter.member = {
        AND: paymentSearchConditions,
      };
    }

    // --- Data Fetching ---

    const principalsRaw = await prisma.member.findMany({
      where: principalFilter,
      include: {
        Contribution: true,
        Balance: true,
        spouse: true,
      },
    });

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

    const principals = convertDecimalsToNumbers(principalsRaw);
    const payments = convertDecimalsToNumbers(paymentsRaw);
    const updatedContributionType = convertDecimalsToNumbers(contributionType);

    return (
      <div className="contribution-page">
        <ContributionTemplate
          ContributionType={updatedContributionType}
          principals={principals}
          payments={payments}
          type="automatically"
        />
      </div>
    );
  } catch (error) {
    console.error("ContributionPage failed:", error);
    return (
      <div className="min-h-screen flex items-center justify-center text-center p-8">
        <div className="space-y-4 max-w-md bg-white p-8 rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold text-red-600">
            Error Loading Page
          </h1>
          <p className="text-gray-600">
            Something went wrong while loading the contribution data. Please try
            refreshing the page.
          </p>
        </div>
      </div>
    );
  }
}

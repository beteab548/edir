export const dynamic = "force-dynamic";
import prisma from "@/lib/prisma";
import ContributionTemplate from "../../../../components/payment/paymentTemplate";
import Penalty from "../../../../components/Systempenalty";
import { getMembersWithPenalties } from "@/lib/actions";
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
function convertDecimalsToNumbers(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== "object") return obj;

  if (obj instanceof Date) return obj;

  // Handle Decimal.js or Prisma Decimal
  if (typeof obj.toNumber === "function") return obj.toNumber();

  if (Array.isArray(obj)) {
    return obj.map(convertDecimalsToNumbers);
  }

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
  const isPenaltiesPage = decodedType.toLowerCase() === "penalties";

  const contributionType = isPenaltiesPage
    ? null
    : await prisma.contributionType.findUnique({
        where: { name: decodedType },
      });

  if (!isPenaltiesPage && !contributionType) {
    notFound();
  }

  try {
    const user = await currentUser();
    if (!user) return redirect("/sign-in");

    const role = user.publicMetadata?.role;
    if (role !== "chairman") return redirect("/dashboard");

    const { year, month, query } = searchParams;

    if (isPenaltiesPage) {
      const membersRaw = await getMembersWithPenalties();
      const members = convertDecimalsToNumbers(membersRaw);
      return (
        <div className="contribution-page">
          <Penalty members={members} />
        </div>
      );
    }

    const memberFilter: any = {
      status: "Active",
      Contribution: {
        some: { type_name: contributionType!.name },
      },
    };

    const paymentFilter: any = {
      contribution_Type_id: contributionType!.id,
      penalty_type_payed_for: "automatically",
    };

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

    if (query) {
      const terms = query
        .split(" ")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const filterConditions = terms.map((term) => ({
        OR: [
          { first_name: { contains: term, mode: "insensitive" } },
          { second_name: { contains: term, mode: "insensitive" } },
          { last_name: { contains: term, mode: "insensitive" } },
          { phone_number: { contains: term, mode: "insensitive" } },
          { custom_id: { contains: term, mode: "insensitive" } },
        ],
      }));

      memberFilter.AND = [
        { Contribution: { some: { type_name: contributionType!.name } } },
        ...filterConditions,
      ];

      paymentFilter.member = { AND: filterConditions };
    }

    const membersRaw = await prisma.member.findMany({
      where: memberFilter,
      include: {
        Contribution: true,
        Balance: true,
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

    const members = convertDecimalsToNumbers(membersRaw);
    const payments = convertDecimalsToNumbers(paymentsRaw);
    const updatedContributionType = convertDecimalsToNumbers(contributionType);

    return (
      <div className="contribution-page">
        <ContributionTemplate
          ContributionType={updatedContributionType!}
          members={members}
          payments={payments}
          type="automatically"
        />
      </div>
    );
  } catch (error) {
    console.error("ContributionPage failed:", error);
    return (
      <div className="min-h-screen flex items-center justify-center text-center p-8">
        <div className="space-y-4 max-w-md">
          <h1 className="text-2xl font-bold text-red-600">
            Connection Timeout
          </h1>
          <p className="text-gray-600">
            Something went wrong while loading the contribution page. Please
            check your internet connection or try refreshing.
          </p>
        </div>
      </div>
    );
  }
}

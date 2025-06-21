import { currentUser } from "@clerk/nextjs/server";
import ContributionTab from "../../../components/contribution/contributionPage";
import { getMembersWithPenalties } from "@/lib/actions";
import ContributionPenaltyTab from "@/components/penalties";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Penalty from "./penalty";
type Tab = "contribution" | "contributionPenalty" | "penalty";

interface TabData {
  id: Tab;
  label: string;
  component: JSX.Element;
}

interface Props {
  searchParams: { tab?: string };
}

export default async function ContributionTabs({ searchParams }: Props) {
  const tabFromParams = searchParams.tab as Tab;
  const activeTab: Tab = tabFromParams ?? "contribution";
  const user = await currentUser();

  const initialMembers = (await getMembersWithPenalties()).map((member) => ({
    ...member,
    Penalty: member.Penalty.filter(
      (penalty) => penalty.contribution !== null
    ).map((penalty) => ({
      ...penalty,
      contribution: penalty.contribution!,
    })),
  }));
  const [members, penalties] = await Promise.all([
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
  const penaltiesWithNumberAmount = penalties.map((penalty) => ({
    ...penalty,
    amount:
      typeof penalty.expected_amount === "object" &&
      "toNumber" in penalty.expected_amount
        ? penalty.expected_amount.toNumber()
        : penalty.expected_amount,
    paid_amount:
      typeof penalty.paid_amount === "object" &&
      "toNumber" in penalty.paid_amount
        ? penalty.paid_amount.toNumber()
        : penalty.paid_amount,
    penalty_type: penalty.penalty_type ?? "",
  }));

  if (!user) {
    return redirect("/sign-in");
  }
  const role = user.publicMetadata.role as string;
  console.log("role is", role);
  const isChairman = role && role.includes("chairman");
  if (!isChairman) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-md">
        <div className="text-center py-10">
          <h3 className="text-lg font-medium text-gray-900">Access Denied</h3>
          <p className="mt-2 text-sm text-gray-500">
            Only a chairman can access this section.
          </p>
        </div>
      </div>
    );
  }

  const allTabs: TabData[] = [
    {
      id: "contribution",
      label: "Contribution",
      component: <ContributionTab />,
    },
    {
      id: "contributionPenalty",
      label: "Contribution Penalty",
      component: <ContributionPenaltyTab initialMembers={initialMembers} />,
    },
    {
      id: "penalty",
      label: " Penalty",
      component: (
        <Penalty
          members={initialMembers}
          penalties={penaltiesWithNumberAmount}
        />
      ),
    },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-md">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Contribution Management
        </h2>
        <p className="text-gray-600">View and manage contribution details</p>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {allTabs.map((tab) => (
            <a
              key={tab.id}
              href={`?tab=${tab.id}`}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
            </a>
          ))}
        </nav>
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg min-h-[200px]">
        {allTabs.find((tab) => tab.id === activeTab)?.component}
      </div>
    </div>
  );
}

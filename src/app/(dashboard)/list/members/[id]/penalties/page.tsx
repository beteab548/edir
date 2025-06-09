// app/members/[id]/penalties/page.tsx
import prisma from "@/lib/prisma";
import { Penalty } from "@prisma/client";
import { WaivePenaltyButton } from "../../../../../../components/WaivePenaltyButton";

interface MemberPenaltiesPageProps {
  params: { id: string };
}

export default async function MemberPenaltiesPage({
  params,
}: MemberPenaltiesPageProps) {
  const memberId = parseInt(params.id);
  // Fetch member details
  const member = await prisma.member.findUnique({
    where: { id: memberId },
    select: {
      id: true,
      first_name: true,
      last_name: true,
      phone_number: true,
    },
  });
  // Fetch all penalties for this member
  const penalties = await prisma.penalty.findMany({
    where: { member_id: memberId },
    include: {
      contribution: {
        select: {
          type_name: true,
        },
      },
      contributionSchedule: {
        select: {
          month: true,
        },
      },
    },
    orderBy: {
      applied_at: "desc",
    },
  });

  if (!member) {
    return <div className="p-4">Member not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Penalty Records</h1>
        <div className="mt-2 flex items-center gap-4">
          <p className="text-gray-600">
            Member: {member.first_name} {member.last_name}
          </p>
          <p className="text-gray-600">Phone: {member.phone_number}</p>
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contribution Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Missed Month
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Paid Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Applied At
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {penalties.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  No penalty records found for this member
                </td>
              </tr>
            ) : (
              penalties.map((penalty) => (
                <tr key={penalty.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {penalty.contribution.type_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(penalty.missed_month).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "long",
                      }
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {penalty.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {penalty.paid_amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        penalty.is_paid
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {penalty.is_paid ? "Paid" : "Pending"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(penalty.applied_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {!penalty.is_paid && (
                      <WaivePenaltyButton
                        penaltyId={penalty.id}
                        memberId={memberId}
                      />
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

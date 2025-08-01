// app/transfers/page.tsx

import prisma from "@/lib/prisma";
import { TransferActionRow } from "@/components/TransferActionRow"; // A new client component

export default async function PendingTransfersPage() {
  // Query for all principals who are deceased/left AND have an active spouse.
  const eligiblePrincipals = await prisma.member.findMany({
    where: {
      isPrincipal: true,
      status: { in: ["Deceased", "Left"] },
      spouseId: { not: null },
      // This is a powerful Prisma feature to filter based on a relation's properties.
      spouse: {
        status: "Active",
      },
    },
    include: {
      spouse: true, // We need the spouse's name for the UI
    },
    orderBy: {
      status_updated_at: "asc", // Show the oldest cases first
    },
  });

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200 h-full">
      <h1 className="text-2xl font-bold text-gray-900">
        Pending Principal Transfers
      </h1>
      <p className="text-sm text-gray-500 mt-1">
        These families require a new principal to be assigned due to the former
        principal's status.
      </p>

      {eligiblePrincipals.length === 0 ? (
        <div className="mt-8 text-center text-gray-500">
          <p>No pending transfers found.</p>
        </div>
      ) : (
        <div className="mt-6 border-t">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Outgoing Principal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Eligible New Principal (Spouse)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {eligiblePrincipals.map((principal) => (
                <TransferActionRow key={principal.id} principal={principal} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

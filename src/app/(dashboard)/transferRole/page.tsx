// app/transfers/page.tsx
export const dynamic = "force-dynamic";

import prisma from "@/lib/prisma";
import { TransferActionRow } from "@/components/TransferActionRow";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function PendingTransfersPage() {
  try {
    const user = await currentUser();
    if (!user) return redirect("/sign-in");

    const role = user.publicMetadata?.role;
    if (role !== "secretary" && role !== "admin") return redirect("/dashboard");
    const eligiblePrincipals = await prisma.member.findMany({
      where: {
        isPrincipal: true,
        status: { in: ["Deceased", "Left"] },
        spouseId: { not: null },
        spouse: {
          status: "Active",
        },
      },
      include: {
        spouse: true,
      },
      orderBy: {
        status_updated_at: "asc",
      },
    });

    return (
      <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200 h-full">
        <h1 className="text-2xl font-bold text-gray-700">
          Pending Principal Transfers
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          These families require a new principal to be assigned due to the
          former principal&apos;s status.
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
  } catch (error) {
    console.error("Error in PendingTransfersPage:", error);
    return (
      <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200 h-full">
        <h1 className="text-2xl font-bold text-gray-900">
          Pending Principal Transfers
        </h1>
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-red-500 mr-3"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <h3 className="text-lg font-medium text-red-800">
              Error Loading Transfer Data
            </h3>
          </div>
          <div className="mt-2 text-sm text-red-700">
            <p>
              We encountered an error while loading the Role transfers Page.
              Please try again later.
            </p>
          </div>
        </div>
      </div>
    );
  }
}

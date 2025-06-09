// app/penalties/page.tsx
import  prisma  from '@/lib/prisma';
import Link from 'next/link';

export default async function PenaltiesOverviewPage() {
  // Fetch members with penalties and their penalty details
  const membersWithPenalties = await prisma.member.findMany({
    where: {
      Penalty: {
        some: {} // Only members with at least one penalty
      }
    },
    include: {
      Penalty: {
        include: {
          contribution: {
            select: {
              type_name: true
            }
          }
        }
      }
    },
    orderBy: {
      first_name: 'asc'
    }
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Members with Penalties</h1>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Penalties</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Penalty Types</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {membersWithPenalties.map((member) => {
              const totalAmount = member.Penalty.reduce(
                (sum, penalty) => sum + Number(penalty.amount) - Number(penalty.paid_amount),
                0
              );
              
              const penaltyTypes = Array.from(
                new Set(member.Penalty.map(p => p.contribution.type_name))
              ).join(', ');

              return (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {member.first_name} {member.last_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {member.phone_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {member.Penalty.length}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {penaltyTypes}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <span className={`px-2 py-1 rounded-full ${
                      totalAmount > 0 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {totalAmount.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      href={`/list/members/${member.id}/penalties`}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Manage Penalties
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
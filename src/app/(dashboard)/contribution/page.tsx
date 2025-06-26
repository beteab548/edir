// app/contribute/page.tsx
import Link from "next/link";
import prisma from "@/lib/prisma"; // Adjust according to your project setup
import Image from "next/image";

export default async function ContributionPage() {
  const contributionOptions = await prisma.contributionType.findMany({
    select: {
      id: true,
      name: true,
    },
  });
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Contribution Page
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Contributing to the Edir ensures continued support during times of
            need. Select a contribution type to help sustain and grow our
            community.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contributionOptions.map((option) => (
            <Link
              key={option.id}
              href={`/contribution/${option.name}`}
              className="bg-white rounded-xl shadow-md overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1"
            >
              <div className="p-8">
                <div className="text-4xl mb-4">
                  <Image
                    src={"/contributionIcon.png"}
                    height={70}
                    width={70}
                    alt="contribution icon"
                  />
                </div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                  {option.name}
                </h2>
               
              </div>
              <div className="px-6 py-4 bg-gray-50 text-right">
                <span className="text-blue-600 font-medium hover:text-blue-800">
                  Select &rarr;
                </span>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}

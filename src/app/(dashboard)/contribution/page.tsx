export const dynamic = "force-dynamic";
import Link from "next/link";
import prisma from "@/lib/prisma";
import Image from "next/image";
import { generateContributionSchedulesForAllActiveMembers } from "@/lib/services/generateSchedulesForAllMembers";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import ClientLink from "@/components/ui/clientnprogressWrapper";

export default async function ContributionPage() {
  try {
    const user = await currentUser();

    if (!user) {
      return redirect("/sign-in");
    }

    const role = user.publicMetadata?.role;
    if (role !== "chairman") {
      return redirect("/dashboard");
    }

    const contributionOptions = await prisma.contributionType.findMany({
      select: {
        id: true,
        name: true,
        amount: true,
      },
    });

    await generateContributionSchedulesForAllActiveMembers();

    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        <main className="container mx-auto px-4 py-12">
          {/* Hero Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-4 bg-blue-100 text-blue-800 rounded-full px-4 py-1.5">
              <span className="text-sm font-medium">Edir Community</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Community Contributions
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              contributions strengthen our community bonds and support our
              collective goals. Select a contribution type below.
            </p>
          </div>

          {contributionOptions.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-8 max-w-2xl mx-auto text-center">
              <div className="w-14 h-14 mx-auto mb-6 text-gray-300">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                No Contribution Types Found
              </h2>
              <p className="text-gray-600 mb-6">
                Currently there are no contribution types configured for your
                community.
              </p>
              <Link
                href="/configure-setting"
                className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Configure Contributions
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {contributionOptions.map((option) => (
                <ClientLink
                  key={option.id}
                  href={`/contribution/${option.name}`}
                  className="group relative bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-md hover:border-blue-200 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  {/* Card Content */}
                  <div className="p-6 flex flex-col h-full">
                    <div className="flex-shrink-0 mb-6">
                      <div className="w-16 h-16 mx-auto bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-8 w-8"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-grow">
                      <h2 className="text-xl font-semibold text-gray-800 mb-2 text-center">
                        {option.name}
                      </h2>

                      <div className="text-center mb-4">
                        <span className="inline-block bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                          {option.amount ? `${option.amount} birr` : "Variable"}
                        </span>
                      </div>
                    </div>
                    <div className="mt-auto pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-center text-blue-600 group-hover:text-blue-800 transition-colors duration-200">
                        <span className="font-medium">Contribute</span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 ml-1.5 transition-transform group-hover:translate-x-1"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </ClientLink>
              ))}
            </div>
          )}
        </main>
      </div>
    );
  } catch (error) {
    console.error("Contribution page failed:", error);

    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-8">
        <div className="bg-white rounded-xl shadow-md p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 mx-auto mb-6 text-red-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            Connection Error
          </h2>
          <p className="text-gray-600 mb-6">
            We couldn&apos;t load the contribution page. Please check your
            internet connection and try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                clipRule="evenodd"
              />
            </svg>
            Refresh Page
          </button>
        </div>
      </div>
    );
  }
}

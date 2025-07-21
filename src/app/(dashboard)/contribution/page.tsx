export const dynamic = "force-dynamic";
import Link from "next/link";
import prisma from "@/lib/prisma";
import Image from "next/image";
import { generateContributionSchedulesForAllActiveMembers } from "@/lib/services/generateSchedulesForAllMembers";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import nProgress from "nprogress";

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
      },
    });

    await generateContributionSchedulesForAllActiveMembers();

    return (
      <div className="min-h-screen bg-gray-50">
        <main className="container mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Make a Contribution
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Contributions play a vital role in supporting our Edir community.
              Please select a contribution type below to proceed.
            </p>
          </div>

          {contributionOptions.length === 0 ? (
            <div className="text-center text-gray-500 text-lg mt-12">
              No contribution types found. Please{" "}
              <Link
                href="/configure-setting"
                className="text-blue-600 underline"
              >
                add contributions
              </Link>{" "}
              to see them listed here.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {contributionOptions.map((option) => (
                <Link
                  key={option.id}
                  href={`/contribution/${option.name}`}
                  onClick={() => nProgress.start()}
                  className="bg-white rounded-2xl shadow-md overflow-hidden transition-transform duration-200 hover:shadow-lg hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <div className="p-6 flex flex-col items-center text-center">
                    <Image
                      src="/contributionIcon.png"
                      height={80}
                      width={80}
                      alt="Contribution Icon"
                      className="mb-4"
                      unoptimized
                    />
                    <h2 className="text-xl font-semibold text-gray-800 mb-1">
                      {option.name}
                    </h2>
                  </div>
                  <div className="px-6 py-4 bg-gray-100 text-right">
                    <span className="text-blue-600 font-medium group-hover:text-blue-800">
                      Contribute &rarr;
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>
    );
  } catch (error) {
    console.error("Contribution page failed:", error);

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

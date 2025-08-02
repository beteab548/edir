export const dynamic = "force-dynamic";

import MemberForm from "@/components/form/MemberForm";
import { generateContributionSchedulesForAllActiveMembers } from "@/lib/services/generateSchedulesForAllMembers";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
const AddNewMember = async () => {
  try {
    const user = await currentUser();

    if (!user) {
      return redirect("/sign-in");
    }

    const role = user.publicMetadata?.role;
    if (role !== "secretary") {
      return redirect("/dashboard");
    }
    await generateContributionSchedulesForAllActiveMembers();
  } catch (error) {
    console.error("ContributionPage failed:", error);
    return (
      <div className="min-h-screen flex items-center justify-center text-center p-8">
        <div className="space-y-4 max-w-md bg-white p-8 rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold text-red-600">
            Error Loading Page
          </h1>
          <p className="text-gray-600">
            Something went wrong while loading the Member Form. Please try
            refreshing the page.
          </p>
        </div>
      </div>
    );
  }
  return <MemberForm type="create" />;
};
export default AddNewMember;

import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import ContributionPage from "@/components/contribution/contributionPage";
export default async function Contribution() {
  const user = await currentUser();
  // If no user is signed in, redirect to sign-in page
  if (!user) {
    return redirect("/sign-in");
  }
  // Example: Assume role is stored in a custom attribute like 'publicMetadata.role'
  const role = user.publicMetadata.role as string;
  // Add your role-based access check here
  if (role !== "chairman") {
    return redirect("/unauthorized");
  }
  return <ContributionPage />;
}

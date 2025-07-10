// app/report/page.tsx (Server Component)
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getFilteredMembers } from "@/lib/report";
import MemberReport from "./memberReportshell";
import { Status } from "@prisma/client";

interface SearchParams {
  searchParams: {
    query?: string;
    from?: string;
    to?: string;
    status?: Status | string;
  };
}

export default async function ReportPage({ searchParams }: SearchParams) {
  // const user = await currentUser();
  // if (!user) return redirect("/sign-in");

  // const role = user.publicMetadata?.role;
  // if (role !== "chairman") return redirect("/dashboard");

  const members = await getFilteredMembers({
    name: searchParams.query,
    from: searchParams.from,
    to: searchParams.to,
    status: searchParams.status,
  });

  return <MemberReport members={members} />;
}

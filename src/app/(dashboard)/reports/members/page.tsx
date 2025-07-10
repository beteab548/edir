import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getFilteredMembers } from "@/lib/report";
import MemberReport from "./memberReportshell";
import { MemberType, Status } from "@prisma/client";

interface SearchParams {
  searchParams: {
    query?: string;
    from?: string;
    to?: string;
    status?: Status | string;
    profession?: string;
    member_type?: string;
    house_number?: string;
    title?: string;
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
    status: searchParams.status as Status,
    profession: searchParams.profession,
    member_type: searchParams.member_type as MemberType,
    house_number: searchParams.house_number,
    title: searchParams.title,
  });

  return <MemberReport members={members} />;
}

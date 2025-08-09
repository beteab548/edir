export const dynamic = "force-dynamic";

import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getFilteredMembers } from "@/lib/report";
import { MemberType, Status } from "@prisma/client";
import ReportShell from "@/components/report/ReportShell";
import FilterBar from "@/components/report/FilterBar";

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
    green_area?: string;
    block?: string;
    marital_status?: string;
    onlyPrincipals?: string;
  };
}
function formatMonthYear(date: Date | string): string {
  const d = new Date(date);
  return `${d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })}`;
}

export default async function ReportPage({ searchParams }: SearchParams) {
  try {
    const user = await currentUser();
    if (!user) return redirect("/sign-in");

    // Check user permissions
    const role = user.publicMetadata?.role;
    if (!["admin", "secretary", "chairman"].includes(role as string)) {
      return redirect("/unauthorized");
    }

    let members = [];
    try {
      members = await getFilteredMembers({
        name: searchParams.query,
        from: searchParams.from,
        to: searchParams.to,
        status: searchParams.status as Status,
        profession: searchParams.profession,
        member_type: searchParams.member_type as MemberType,
        house_number: searchParams.house_number,
        green_area: searchParams.green_area,
        block: searchParams.block,
        title: searchParams.title,
        marital_status: searchParams.marital_status,
        onlyPrincipals: searchParams.onlyPrincipals,
      });
    } catch (error) {
      console.error("Error fetching members:", error);
      throw new Error("Failed to load member data. Please try again later.");
    }

    const processedData = members?.map((m: any) => {
      try {
        const formatPhone = (phone: string | undefined) => {
          if (!phone) return "";
          return phone.replace(/^251/, "0").replace(/^\+/, "0");
        };

        const formatDate = (date: Date | string | null | undefined) => {
          if (!date) return "N/A";
          try {
            return new Date(date).toLocaleDateString();
          } catch {
            return "Invalid Date";
          }
        };

        return {
          ID: m.custom_id || "N/A",
          "Full Name":
            `${m.first_name || ""} ${m.second_name || ""} ${
              m.last_name || ""
            }`.trim() || "N/A",
          Phone: formatPhone(m.phone_number),
          "Registered Date": formatMonthYear(m.registered_date),
          status: m.status,
          green_area: m.green_area,
          block: m.block,
          house_number: m.house_number,
          member_type: m.member_type,
          birth_date: formatDate(m.birth_date),
          zone_or_district: m.zone_or_district,
          bank_account_name: m.bank_account_name,
          bank_account_number: m.bank_account_number,
          bank_name: m.bank_name,
          email: m.email,
          email_2: m.email_2,
          job_business: m.job_business,
          id_number: m.identification_number,
          kebele: m.kebele,
          profession: m.profession,
          wereda: m.wereda,
          citizen: m.citizen,
          phone_number_2: formatPhone(m.phone_number_2),
          sex: m.sex,
          marital_status: m.marital_status,
          title: m.title,
          remark: m.remark,
        };
      } catch (error) {
        console.error("Error processing member record:", error, m);
        return {
          ID: "ERROR",
          "Full Name": "Error processing record",
          Phone: "N/A",
          "Registered Date": "N/A",
          status: "ERROR",
          green_area: "N/A",
          block: "N/A",
          house_number: "N/A",
          member_type: "N/A",
          birth_date: "N/A",
          zone_or_district: "N/A",
          bank_account_name: "N/A",
          bank_account_number: "N/A",
          bank_name: "N/A",
          email: "N/A",
          email_2: "N/A",
          job_business: "N/A",
          id_number: "N/A",
          kebele: "N/A",
          profession: "N/A",
          wereda: "N/A",
          citizen: "N/A",
          phone_number_2: "N/A",
          sex: "N/A",
          marital_status: "N/A",
          title: "N/A",
          remark: "Error processing this record",
        };
      }
    });

    return (
      <ReportShell
        searchparams={searchParams}
        title="Member Report"
        filename="member_report"
        data={processedData}
        columns={[
          {
            label: "ID",
            accessor: "ID",
            width: "w-[95px]",
            printWidth: "print:w-[100px]",
          },
          {
            label: "Full Name",
            accessor: "Full Name",
            width: "w-auto",
            printWidth: "print:w-[300px]",
          },
          {
            label: "Title",
            accessor: "title",
            width: "w-auto",
            printWidth: "print:w-[100px]",
          },
          {
            label: "job Business",
            accessor: "job_business",
            width: "w-auto",
            printWidth: "print:w-[100px]",
          },
          {
            label: "profession",
            accessor: "profession",
            width: "w-auto",
            printWidth: "print:w-[100px]",
          },
          {
            label: "Phone no 1",
            accessor: "Phone",
            width: "w-auto",
            printWidth: "print:w-[100px]",
          },
          {
            label: "phone no 2",
            accessor: "phone_number_2",
            width: "w-auto",
            printWidth: "print:w-[100px]",
          },
          {
            label: "Registerd Date",
            accessor: "Registered Date",
            width: "w-auto",
            printWidth: "print:w-[100px]",
          },
          {
            label: "Status",
            accessor: "status",
            width: "w-auto",
            printWidth: "print:w-[100px]",
          },
          {
            label: "Sex",
            accessor: "sex",
            width: "w-auto",
            printWidth: "print:w-[100px]",
          },
          {
            label: "Martial Status",
            accessor: "marital_status",
            width: "w-auto",
            printWidth: "print:w-[100px]",
          },
          {
            label: "Id No",
            accessor: "id_number",
            width: "w-auto",
            printWidth: "print:w-[100px]",
          },
          {
            label: "Member Type",
            accessor: "member_type",
            width: "w-auto",
            printWidth: "print:w-[100px]",
          },
          {
            label: "Birth Date",
            accessor: "birth_date",
            width: "w-auto",
            printWidth: "print:w-[100px]",
          },
          {
            label: "Zone/District",
            accessor: "zone_or_district",
            width: "w-auto",
          },
          {
            label: "Woreda",
            accessor: "wereda",
            width: "w-auto",
            printWidth: "print:w-[100px]",
          },
          {
            label: "Kebele",
            accessor: "kebele",
            width: "w-auto",
            printWidth: "print:w-[100px]",
          },
          {
            label: "Green Area",
            accessor: "green_area",
            width: "w-auto",
            printWidth: "print:w-[100px]",
          },
          {
            label: "Block",
            accessor: "block",
            width: "w-auto",
            printWidth: "print:w-[100px]",
          },
          {
            label: "House Number",
            accessor: "house_number",
            width: "w-auto",
            printWidth: "print:w-[100px]",
          },
          {
            label: "Citizen",
            accessor: "citizen",
            width: "w-auto",
            printWidth: "print:w-[100px]",
          },
          {
            label: "Email",
            accessor: "email",
            width: "w-auto",
            printWidth: "print:w-[100px]",
          },
          {
            label: "Email No 2",
            accessor: "email_2",
            width: "w-auto",
            printWidth: "print:w-[100px]",
          },
          {
            label: "bank Account Name",
            accessor: "bank_account_name",
            width: "w-auto",
            printWidth: "print:w-[100px]",
          },
          {
            label: "bank Account No",
            accessor: "bank_account_number",
            width: "w-auto",
            printWidth: "print:w-[100px]",
          },
          {
            label: "Bank Name",
            accessor: "bank_name",
            width: "w-auto",
            printWidth: "print:w-[100px]",
          },
          {
            label: "Remark",
            accessor: "remark",
            width: "w-auto",
            printWidth: "print:w-[100px]",
          },
        ]}
      >
        <FilterBar type="members" />
      </ReportShell>
    );
  } catch (error) {
    console.error("Error in ReportPage:", error);
    return (
      <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Member Report</h1>
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error loading member report
              </h3>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

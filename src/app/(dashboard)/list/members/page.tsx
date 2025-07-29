export const dynamic = "force-dynamic";

import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import LinkButtonWithProgress from "@/components/ui/LinkButtonWithProgress";
import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { Member, Prisma } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FiPlus, FiArrowUp, FiArrowDown } from "react-icons/fi";

const ITEMS_PER_PAGE_OPTIONS = [10, 30, 50];
const DEFAULT_ITEMS_PER_PAGE = 10;

// Error fallback component
const ErrorFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
    <div className="text-center space-y-6 max-w-md">
      <h1 className="text-3xl font-bold text-red-600">
        Connection Issue Detected
      </h1>
      <p className="text-gray-700">
        We were unable to load the members list due to a network or server
        error. Please try the following:
      </p>
      <ul className="text-left text-sm text-gray-600 list-disc list-inside space-y-1">
        <li>Check your internet connection</li>
        <li>Refresh the page</li>
        <li>Try again in a few minutes</li>
      </ul>
    </div>
  </div>
);

// Main page component
const MemberListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  try {
    const user = await currentUser();

    if (!user) return redirect("/sign-in");
    if (user.publicMetadata?.role !== "secretary")
      return redirect("/dashboard");

    const itemsPerPage = searchParams.perPage
      ? parseInt(searchParams.perPage as string)
      : DEFAULT_ITEMS_PER_PAGE;

    const sortableColumns = {
      name: [
        { last_name: "asc" },
        { first_name: "asc" },
        { second_name: "asc" },
      ],
      registered_date: { created_at: "desc" },
      profession: { profession: "asc" },
      status: { status: "asc" },
    };

    const currentSort =
      (searchParams.sort as keyof typeof sortableColumns) || "registered_date";
    const sortDirection = searchParams.direction === "asc" ? "asc" : "desc";

    const columns = [
      { header: "ID", accessor: "id" },
      {
        header: (
          <SortableHeader
            label="Member"
            sortKey="name"
            currentSort={currentSort}
            sortDirection={sortDirection}
          />
        ),
        accessor: "member",
      },
      {
        header: (
          <SortableHeader
            label="Profession"
            sortKey="profession"
            currentSort={currentSort}
            sortDirection={sortDirection}
          />
        ),
        accessor: "profession",
      },
      { header: "Contact", accessor: "phone" },
      { header: "Age", accessor: "age" },
      {
        header: (
          <SortableHeader
            label="Status"
            sortKey="status"
            currentSort={currentSort}
            sortDirection={sortDirection}
          />
        ),
        accessor: "status",
      },
      {
        header: (
          <SortableHeader
            label="Registered Date"
            sortKey="registered_date"
            currentSort={currentSort}
            sortDirection={sortDirection}
          />
        ),
        accessor: "registered_date",
      },
      { header: "Action", accessor: "action" },
    ];

    const getStatusClasses = (status: string) => {
      switch (status) {
        case "Active":
          return "bg-green-100 text-green-800";
        case "Inactive":
          return "bg-yellow-100 text-yellow-800";
        case "Deceased":
          return "bg-red-100 text-red-800";
        case "Left":
          return "bg-gray-200 text-gray-700";
        default:
          return "bg-gray-100 text-gray-800";
      }
    };

    const formatDate = (date: Date) =>
      new Date(date).toLocaleDateString("en-GB", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });

    const calculateAge = (birthDate: Date | null) => {
      if (!birthDate) return "N/A";
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    };

    const renderRow = (item: Member) => (
      <>
        <td className="px-2 py-4 text-gray-700 font-medium whitespace-nowrap">
          {item.custom_id || item.id}
        </td>
        <td className="py-2 pl-3 pr-3">
          <div className="flex items-center gap-4">
            <Image
              src={item.image_url ?? "/avatar.png"}
              alt=""
              width={48}
              height={48}
              unoptimized
              className="w-12 h-12 rounded-full object-cover border-2 border-gray-100"
            />
            <div className="flex flex-col">
              <h3 className="font-medium text-gray-900 ">
                {item.first_name} {item.second_name} {item.last_name}
              </h3>
              <p className="text-sm text-gray-500 md:hidden">
                {item.profession || "-"}
              </p>
            </div>
          </div>
        </td>
        <td className="hidden md:table-cell px-3 py-4 text-gray-600">
          {item.profession || "-"}
        </td>
        <td className="hidden lg:table-cell px-3 py-4 text-gray-600">
          {item.phone_number || "-"}
        </td>
        <td className="hidden md:table-cell py-4 px-5 text-gray-600">
          {calculateAge(item.birth_date)}
        </td>
        <td className="hidden md:table-cell px-3 py-4">
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusClasses(
              item.status ?? "Active"
            )}`}
          >
            {item.status}
          </span>
        </td>
        <td className="hidden md:table-cell px-5 py-4 text-gray-600">
          {formatDate(item.registered_date)}
        </td>
        <td className="py-4 pr-6 pl-3">
          <div className="flex items-center justify-end gap-3">
            <FormContainer table="member" type="update" data={item} />
            <FormContainer table="member" type="delete" id={item.id} />
          </div>
        </td>
      </>
    );

    const { page, ...queryParams } = searchParams;
    const currentPage = page ? parseInt(page) : 1;

    const query: Prisma.MemberWhereInput = {};
    if (queryParams.search) {
      const searchTerm = queryParams.search.trim();
      const words = searchTerm.split(/\s+/);

      let phoneVariants = [searchTerm];
      if (/^0\d+$/.test(searchTerm)) {
        phoneVariants.push("251" + searchTerm.slice(1));
      } else if (/^251\d+$/.test(searchTerm)) {
        phoneVariants.push("0" + searchTerm.slice(3));
      }

      query.OR = [
        {
          custom_id: {
            contains: searchTerm,
            mode: Prisma.QueryMode.insensitive,
          },
        },
        ...phoneVariants.flatMap((variant) => [
          {
            phone_number: {
              contains: variant,
              mode: Prisma.QueryMode.insensitive,
            },
          },
          {
            phone_number_2: {
              contains: variant,
              mode: Prisma.QueryMode.insensitive,
            },
          },
        ]),
        {
          AND: words.map((word) => ({
            OR: [
              {
                first_name: {
                  contains: word,
                  mode: Prisma.QueryMode.insensitive,
                },
              },
              {
                second_name: {
                  contains: word,
                  mode: Prisma.QueryMode.insensitive,
                },
              },
              {
                last_name: {
                  contains: word,
                  mode: Prisma.QueryMode.insensitive,
                },
              },
            ],
          })),
        },
      ];
    }

    let orderBy:
      | Prisma.MemberOrderByWithRelationInput
      | Prisma.MemberOrderByWithRelationInput[];

    if (currentSort === "name") {
      orderBy = [
        { last_name: sortDirection },
        { first_name: sortDirection },
        { second_name: sortDirection },
      ];
    } else if (currentSort === "registered_date") {
      orderBy = { created_at: sortDirection };
    } else if (currentSort === "profession") {
      orderBy = { profession: sortDirection };
    } else if (currentSort === "status") {
      orderBy = { status: sortDirection };
    } else if (currentSort === "registered_date") {
      orderBy = { registered_date: sortDirection };
    } else {
      orderBy = { registered_date: "desc" };
    }

    const [data, count] = await prisma.$transaction([
      prisma.member.findMany({
        where: query,
        take: itemsPerPage,
        skip: itemsPerPage * (currentPage - 1),
        include: { relative: true },
        orderBy,
      }),
      prisma.member.count({ where: query }),
    ]);

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 pb-4 border-b border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Members Directory
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {count} {count === 1 ? "member" : "members"} found
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-full md:w-64">
                <TableSearch />
              </div>

              <div className="flex items-center gap-2">
                <LinkButtonWithProgress href="/list/addNewMember">
                  <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm">
                    <FiPlus className="w-5 h-5" />
                    <span className="hidden sm:inline">Add Member</span>
                  </button>
                </LinkButtonWithProgress>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table
            columns={columns}
            renderRow={renderRow}
            data={data}
            headerClassName="px-5 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            rowClassName="border-b border-gray-100 hover:bg-gray-50 transition-colors"
          />
        </div>

        <div className="p-6 pt-4 border-t border-gray-100 bg-gray-50">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Members per page:</span>
              <div className="flex items-center gap-1">
                {ITEMS_PER_PAGE_OPTIONS.map((option: any) => {
                  const params = new URLSearchParams(
                    searchParams as Record<string, string>
                  );
                  params.set("perPage", option.toString());
                  params.set("page", "1");

                  const isActive = itemsPerPage === option;

                  return (
                    <Link
                      key={option}
                      href={`?${params.toString()}`}
                      className={`px-3 py-1 text-sm rounded-md ${
                        isActive
                          ? "bg-blue-100 text-blue-700 font-medium"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {option}
                    </Link>
                  );
                })}
              </div>
            </div>

            <Pagination
              page={currentPage}
              count={count}
              itemsPerPage={itemsPerPage}
            />
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("MemberListPage Error:", error);
    return <ErrorFallback />;
  }
};

// Sortable header component
const SortableHeader = ({
  label,
  sortKey,
  currentSort,
  sortDirection,
}: {
  label: string;
  sortKey: string;
  currentSort: string;
  sortDirection: "asc" | "desc";
}) => {
  const isActive = currentSort === sortKey;
  const nextDirection = isActive && sortDirection === "asc" ? "desc" : "asc";
  const params = new URLSearchParams();
  params.set("sort", sortKey);
  params.set("direction", nextDirection);

  return (
    <Link
      href={`?${params.toString()}`}
      className="flex items-center gap-1 hover:text-gray-700"
    >
      <span>{label}</span>
      {isActive ? (
        sortDirection === "asc" ? (
          <FiArrowUp className="w-3 h-3" />
        ) : (
          <FiArrowDown className="w-3 h-3" />
        )
      ) : (
        <span className="w-3 h-3" />
      )}
    </Link>
  );
};

export default MemberListPage;

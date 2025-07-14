import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { Member, Prisma } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FiPlus, FiFilter, FiArrowUp, FiArrowDown } from "react-icons/fi";

const ITEMS_PER_PAGE_OPTIONS = [10, 30, 50];
const DEFAULT_ITEMS_PER_PAGE = 10;

const MemberListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const user = await currentUser();

  if (!user) {
    return redirect("/sign-in");
  }

  const role = user.publicMetadata?.role;
  if (role !== "secretary") {
    return redirect("/dashboard");
  }
  const itemsPerPage = searchParams.perPage
    ? parseInt(searchParams.perPage as string)
    : DEFAULT_ITEMS_PER_PAGE;

  // Sort configuration
  const sortableColumns = {
    name: [{ last_name: "asc" }, { first_name: "asc" }, { second_name: "asc" }],
    date_joined: { created_at: "desc" },
    profession: { profession: "asc" },
    status: { status: "asc" },
  };

  // Current sort state from URL
  const currentSort =
    (searchParams.sort as keyof typeof sortableColumns) || "date_joined";
  const sortDirection = searchParams.direction === "asc" ? "asc" : "desc";

  // Table columns configuration
  const columns = [
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
    {
      header: "Age",
      accessor: "age",
    },
    {
      header: "Contact",
      accessor: "phone",
    },
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
          label="Joined Date"
          sortKey="date_joined"
          currentSort={currentSort}
          sortDirection={sortDirection}
        />
      ),
      accessor: "joined_date",
    },
    {
      header: "Action",
      accessor: "action",
    },
  ];

  // Helper functions
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

  // Row rendering function
  const renderRow = (item: Member) => (
    <>
      <td className="py-4 pl-6 pr-3">
        <div className="flex items-center gap-4">
          <Image
            src={item.image_url ?? "/noAvatar.png"}
            alt=""
            width={48}
            height={48}
            className="w-12 h-12 rounded-full object-cover border-2 border-gray-100"
          />
          <div className="flex flex-col">
            <h3 className="font-medium text-gray-900">
              {item.first_name} {item.second_name} {item.last_name}
            </h3>
            <p className="text-sm text-gray-500 md:hidden">
              {item.profession || "-"}
            </p>
          </div>
        </div>
      </td>
      <td className="hidden md:table-cell px-4 py-4 text-gray-600">
        {item.profession || "-"}
      </td>
      <td className="hidden md:table-cell px-4 py-4 text-gray-600">
        {calculateAge(item.birth_date)}
      </td>
      <td className="hidden lg:table-cell px-4 py-4 text-gray-600">
        {item.phone_number || "-"}
      </td>
      <td className="hidden md:table-cell px-4 py-4">
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusClasses(
            item.status
          )}`}
        >
          {item.status}
        </span>
      </td>
      <td className="hidden md:table-cell px-4 py-4 text-gray-600">
        {formatDate(item.joined_date)}
      </td>
      <td className="py-4 pr-6 pl-3">
        <div className="flex items-center justify-end gap-3">
          <FormContainer table="member" type="update" data={item} />
          <FormContainer table="member" type="delete" id={item.id} />
        </div>
      </td>
    </>
  );

  // Pagination
  const { page, ...queryParams } = searchParams;
  const currentPage = page ? parseInt(page) : 1;

  // Query filters
  const query: Prisma.MemberWhereInput = {};
if (queryParams.search) {
  const searchTerm = queryParams.search.trim();

  // Prepare phone variants for search
  let phoneVariants = [searchTerm];

  // If searchTerm starts with 0, add variant with 251 prefix (without +)
  if (/^0\d+$/.test(searchTerm)) {
    phoneVariants.push("251" + searchTerm.slice(1));
  }
  // If searchTerm starts with 251, add variant with 0 prefix
  else if (/^251\d+$/.test(searchTerm)) {
    phoneVariants.push("0" + searchTerm.slice(3));
  }

  query.OR = [
    { first_name: { contains: searchTerm, mode: "insensitive" } },
    { second_name: { contains: searchTerm, mode: "insensitive" } },
    { last_name: { contains: searchTerm, mode: "insensitive" } },
    ...phoneVariants.flatMap((variant) => [
      { phone_number: { contains: variant, mode: Prisma.QueryMode.insensitive } },
      { phone_number_2: { contains: variant, mode: Prisma.QueryMode.insensitive } },
    ]),
  ];
}


  // Sorting logic
  let orderBy:
    | Prisma.MemberOrderByWithRelationInput
    | Prisma.MemberOrderByWithRelationInput[];
  if (currentSort === "name") {
    orderBy = [
      { last_name: sortDirection },
      { first_name: sortDirection },
      { second_name: sortDirection },
    ];
  } else if (currentSort === "date_joined") {
    orderBy = { created_at: sortDirection };
  } else if (currentSort === "profession") {
    orderBy = { profession: sortDirection };
  } else if (currentSort === "status") {
    orderBy = { status: sortDirection };
  } else if (currentSort === "joined_date") {
    orderBy = { joined_date: sortDirection };
  } else {
    orderBy = { joined_date: "desc" };
  }

  // Data fetching
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
      {/* Header Section */}
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
              <Link href="/list/addNewMember">
                <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm">
                  <FiPlus className="w-5 h-5" />
                  <span className="hidden sm:inline">Add Member</span>
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="overflow-x-auto">
        <Table
          columns={columns}
          renderRow={renderRow}
          data={data}
          headerClassName="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
          rowClassName="border-b border-gray-100 hover:bg-gray-50 transition-colors"
        />
      </div>

      {/* Pagination Section */}
      <div className="p-6 pt-4 border-t border-gray-100 bg-gray-50">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Items per page selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Members per page:</span>
            <div className="flex items-center gap-1">
              {ITEMS_PER_PAGE_OPTIONS.map((option) => {
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

          {/* Pagination component */}
          <Pagination
            page={currentPage}
            count={count}
            itemsPerPage={itemsPerPage}
          />
        </div>
      </div>
    </div>
  );
};

// SortableHeader component
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
        <span className="w-3 h-3"></span>
      )}
    </Link>
  );
};

export default MemberListPage;

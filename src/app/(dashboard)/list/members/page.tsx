import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import prisma from "@/lib/prisma";
import { Member, Prisma } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { auth } from "@clerk/nextjs/server";

const MemberListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined };
}) => {
  const columns = [
    { header: "Full Name", accessor: "full_name" },
    {
      header: "Profession",
      accessor: "profession",
      className: "hidden md:table-cell",
    },
    { header: "Age", accessor: "age", className: "hidden md:table-cell" },
    { header: "Phone", accessor: "phone", className: "hidden md:table-cell" },
    { header: "Status", accessor: "status", className: "hidden md:table-cell" },
    { header: "Actions", accessor: "action" },
  ];
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
      <td className="flex items-center gap-4 p-4">
        <Image
          src="/noAvatar.png"
          alt=""
          width={40}
          height={40}
          className="md:hidden xl:block w-10 h-10 rounded-full object-cover"
        />
        <div className="flex flex-col">
          <h3 className="font-semibold">
            {item.first_name} {item.second_name} {item.last_name}
          </h3>
          <p className="text-xs text-gray-500">{item.profession}</p>
        </div>
      </td>
      <td className="hidden md:table-cell">{item.profession}</td>
      <td className="hidden md:table-cell">{calculateAge(item.birth_date)}</td>
      <td className="hidden md:table-cell">{item.phone_number}</td>
      <td className="hidden md:table-cell">{item.status}</td>
      <td>
        <div className="flex items-center gap-2">
          <FormContainer table="member" type="update" data={item} />
          <FormContainer table="member" type="delete" id={item.id} />
        </div>
      </td>
    </>
  );

  const { page, ...queryParams } = searchParams;
  const p = page ? parseInt(page) : 1;

  const query: Prisma.MemberWhereInput = {};
  console.log(query);
  if (queryParams.search) {
    query.first_name = { contains: queryParams.search, mode: "insensitive" };
  }

  const [data, count] = await prisma.$transaction([
    prisma.member.findMany({
      where: query,
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
      include: { relative: true },
    }),
    prisma.member.count({ where: query }),
  ]);
  // console.log("data is",data);
  console.log("Initial query params:", searchParams);
  console.log("Calculated page:", p);
  console.log("Query filter:", query);
  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">All Members</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-yellow-200">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-yellow-200">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
            <Link href="/list/addNewMember">
              <button className="w-8 h-8 flex items-center justify-center rounded-full bg-yellow-200">
                <Image src="/add.png" alt="Add" width={16} height={16} />
              </button>
            </Link>
          </div>
        </div>
      </div>
      {/* LIST */}
      <Table columns={columns} renderRow={renderRow} data={data} />
      {/* PAGINATION */}
      <Pagination page={p} count={count} />
    </div>
  );
};

export default MemberListPage;

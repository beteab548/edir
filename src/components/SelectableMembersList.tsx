"use client";

import { useState, useMemo, useEffect } from "react";
import Table from "./Table";
import Pagination from "./client-pagination";
import TableSearch from "./client-tableSearch";

const ITEMS_PER_PAGE = 10;

export default function SelectableMembersList({
  members,
  initialSelected = [],
  onSaveSelection,
  onCancel,
  isLoadingExisting = false,
}: {
  members: any[];
  initialSelected?: number[];
  onSaveSelection: (selectedIds: number[]) => void;
  onCancel: () => void;
  isLoadingExisting?: boolean;
}) {
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Initialize selected members when initialSelected changes
  useEffect(() => {
    setSelectedMembers(initialSelected);
  }, [initialSelected]);

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
  ];

  // Filter members based on search query
  const filteredMembers = useMemo(() => {
    return members.filter((member) =>
      `${member.first_name} ${member.last_name} ${member.profession} ${member.phone_number}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    );
  }, [members, searchQuery]);

  // Paginate the filtered members
  const paginatedMembers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredMembers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredMembers, currentPage]);

  const totalPages = Math.ceil(filteredMembers.length / ITEMS_PER_PAGE);

  const renderRow = (item: any) => (
    <>
      <td className="flex items-center gap-4 p-4">
        <div className="flex flex-col">
          <h3 className="font-semibold">
            {item.first_name} {item.second_name} {item.last_name}
          </h3>
          <p className="text-xs text-gray-500">{item.profession}</p>
        </div>
      </td>
      <td className="hidden md:table-cell">{item.profession}</td>
      <td className="hidden md:table-cell">{item.age}</td>
      <td className="hidden md:table-cell">{item.phone_number}</td>
      <td className="hidden md:table-cell">{item.status}</td>
    </>
  );

  const handleSelect = (id: number, checked: boolean) => {
    setSelectedMembers((prev) =>
      checked ? [...prev, id] : prev.filter((memberId) => memberId !== id)
    );
  };

  const handleSelectAll = (checked: boolean) => {
    const currentPageIds = paginatedMembers.map((member) => member.id);
    if (checked) {
      setSelectedMembers((prev) => [
        ...Array.from(new Set([...prev, ...currentPageIds])),
      ]);
    } else {
      setSelectedMembers((prev) =>
        prev.filter((id) => !currentPageIds.includes(id))
      );
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0 shadow-sm">
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">
          Select Members
        </h1>
        <TableSearch
          onSearch={handleSearch}
          placeholder="Search members..."
          className="w-full md:w-auto"
        />
      </div>

      {isLoadingExisting ? (
        <div className="flex justify-center items-center h-40">
          <p className="text-gray-500">Loading existing members...</p>
        </div>
      ) : (
        <>
          <Table
            columns={columns}
            data={paginatedMembers}
            renderRow={renderRow}
            selectable
            selectedIds={selectedMembers}
            onSelect={handleSelect}
            onSelectAll={handleSelectAll}
          />

          <Pagination
            page={currentPage}
            count={filteredMembers.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />

          <div className="flex justify-end mt-4 gap-2">
            <button
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={() => onSaveSelection(selectedMembers)}
            >
              Confirm Selection ({selectedMembers.length})
            </button>
          </div>
        </>
      )}
    </div>
  );
}

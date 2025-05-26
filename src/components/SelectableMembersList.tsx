// components/SelectableMembersList.tsx
"use client";

import { useState } from "react";
import Table from "./Table";
import Pagination from "./Pagination";
import TableSearch from "./TableSearch";

export default function SelectableMembersList({
  members,
  initialSelected = [],
  onSaveSelection,
  onCancel,
}: {
  members: any[];
  initialSelected?: number[];
  onSaveSelection: (selectedIds: number[]) => void;
  onCancel: () => void;
}) {
  const [selectedMembers, setSelectedMembers] = useState<number[]>(initialSelected);
  const [searchQuery, setSearchQuery] = useState("");

  const columns = [
    { header: "Full Name", accessor: "full_name" },
    { header: "Profession", accessor: "profession", className: "hidden md:table-cell" },
    { header: "Age", accessor: "age", className: "hidden md:table-cell" },
    { header: "Phone", accessor: "phone", className: "hidden md:table-cell" },
    { header: "Status", accessor: "status", className: "hidden md:table-cell" },
  ];

  const filteredMembers = members.filter(member =>
    `${member.first_name} ${member.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    setSelectedMembers(prev =>
      checked ? [...prev, id] : prev.filter(memberId => memberId !== id)
    );
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedMembers(checked ? filteredMembers.map(member => member.id) : []);
  };

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">Select Members</h1>
        <TableSearch  />
      </div>

      <Table
        columns={columns}
        renderRow={renderRow}
        data={filteredMembers}
        selectable
        selectedIds={selectedMembers}
        onSelect={handleSelect}
        onSelectAll={handleSelectAll}
      />

      <div className="flex justify-end mt-4 gap-2">
        <button className="btn btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button
          className="btn btn-primary"
          onClick={() => onSaveSelection(selectedMembers)}
        >
          Confirm Selection ({selectedMembers.length})
        </button>
      </div>
    </div>
  );
}
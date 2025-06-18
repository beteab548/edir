"use client";
import { useState } from "react";
import CreateNewContribution from "./createNewContribution";
import ConfigureExistingContribution from "./ConfigureExistingContribution";
import { Member } from "@prisma/client";

export default function ContributionClientWrapper({
  members,
  contributionTypes,
}: {
  members: Member[];
  contributionTypes: any[];
}) {
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100 p-8 space-y-8">
      <div className="flex justify-end mb-4">
        <button
          className={`px-4 py-2 rounded-md text-white font-semibold transition-colors ${
            showAdd ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"
          }`}
          onClick={() => setShowAdd((prev) => !prev)}
        >
          {showAdd ? "Cancel" : "Add New Contribution"}
        </button>
      </div>

      {showAdd && <CreateNewContribution members={members} />}

      <ConfigureExistingContribution
        contributionTypes={contributionTypes}
        members={members}
      />
    </div>
  );
}

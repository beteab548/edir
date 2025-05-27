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
    <div className="min-h-screen bg-base-200 p-8 space-y-8">
      <div className="flex justify-end mb-4">
        <button
          className="btn btn-primary"
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
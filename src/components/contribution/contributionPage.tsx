// "use client";

"use client";
import { useEffect, useState } from "react";
import CreateNewContribution from "./createNewContribution";
import ConfigureExistingContribution from "./ConfigureExistingContribution";
import { ContributionType, Member } from "@prisma/client";

export default function ContributionPage() {
  const [showAdd, setShowAdd] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [revalidate, setRevalidate] = useState<boolean>(false);

  useEffect(() => {
    async function fetchDatas() {
      const res = await fetch("/api/contributions/contributionTypes");
      const { members } = await res.json();
      setMembers(members);
    }
    fetchDatas();
  }, []);
  return (
    <div className="  min-h-screen  p-8 space-y-8 mt-6">
      <div className="flex justify-end mb-4">
        <button
          className={`px-4 py-2 rounded-md text-white font-semibold transition-colors bg-blue-600 hover:bg-blue-700`}
          onClick={() => setShowAdd((prev) => !prev)}
        >
          Add New Contribution
        </button>
      </div>

      {showAdd && (
        <CreateNewContribution
          members={members}
          setRevalidate={setRevalidate}
          onClose={() => setShowAdd(false)}
        />
      )}

      <ConfigureExistingContribution revalidate={revalidate} />
    </div>
  );
}

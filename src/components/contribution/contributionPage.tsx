"use client";
import { useEffect, useState } from "react";
import CreateNewContribution from "./createNewContribution";
import ConfigureExistingContribution from "./ConfigureExistingContribution";
import { ContributionType, Member } from "@prisma/client";

export default function ContributionPage() {
  const [showAdd, setShowAdd] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [revalidate, setRevalidate] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDatas() {
      try {
        const res = await fetch("/api/contributions/contributionTypes");
        const { members } = await res.json();
        setMembers(members);
      } catch (error) {
        console.error("Failed to fetch members", error);
      } finally {
        setLoading(false);
      }
    }
    fetchDatas();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 space-y-4">
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

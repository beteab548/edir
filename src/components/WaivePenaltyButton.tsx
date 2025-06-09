// app/members/[id]/penalties/WaivePenaltyButton.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { waivePenalty } from "@/lib/actions";

interface WaivePenaltyButtonProps {
  penaltyId: number;
  memberId: number;
}

export function WaivePenaltyButton({
  penaltyId,
  memberId,
}: WaivePenaltyButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const handleWaive = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await waivePenalty(penaltyId, memberId);
      if (result.success) {
        setShowModal(false);
        router.refresh();
      } else {
        setError(result.message || "Failed to waive penalty");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={() => setShowModal(true)}
        disabled={isLoading}
        className={`text-indigo-600 hover:text-indigo-900 ${
          isLoading ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        {isLoading ? "Processing..." : "Waive"}
      </button>
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg p-6 shadow-lg max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4 text-center">
              Waive this penalty?
            </h3>
            <p className="mb-6 text-center text-gray-600">
              Are you sure you want to waive this penalty? This action cannot be
              undone.
            </p>
            {error && (
              <p className="mb-2 text-sm text-red-600 text-center">{error}</p>
            )}
            <div className="flex justify-end gap-2">
              <button
                className="btn btn-ghost"
                onClick={() => setShowModal(false)}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                className="btn btn-error"
                onClick={handleWaive}
                disabled={isLoading}
              >
                {isLoading ? "Processing..." : "OK"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { waivePenalty } from "@/lib/actions";
import { format } from "date-fns";
import { UserIcon, DocumentTextIcon } from "@heroicons/react/24/outline";
import UploadFile from "./FileUpload/page";
import Image from "next/image";

interface WaivePenaltyButtonProps {
  penaltyId: number;
  memberId: number;
  memberName: string;
  memberCustomId: string;
  amount: Number;
  missedMonth: string | Date;
  onSuccess?: () => void; // <-- new optional prop
}

export function WaivePenaltyButton({
  penaltyId,
  memberId,
  memberName,
  memberCustomId,
  amount,
  missedMonth,
  onSuccess, // receive prop
}: WaivePenaltyButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState("");
  const [waiverEvidence, setWaiverEvidence] = useState<{
    Url: string;
    fileId: string;
  } | null>(null);

  const handleWaive = async () => {
    if (!reason.trim()) {
      setReasonError("Please provide a reason for the waiver");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await waivePenalty(
        penaltyId,
        memberId,
        reason,
        waiverEvidence?.Url,
        waiverEvidence?.fileId
      );

      if (result.success) {
        setShowModal(false);
        setReason("");
        setWaiverEvidence(null);
        if (onSuccess) onSuccess(); // <-- call onSuccess to trigger SWR mutate
        // optionally, if you want router refresh, you can remove router.refresh() here
      } else {
        setError(result.message || "Failed to waive penalty");
      }
    } catch {
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
        <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">
                  Waive Penalty
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setWaiverEvidence(null);
                    setReasonError("");
                    setReason("");
                  }}
                  className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
                >
                  <XIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-shrink-0 h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <UserIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{memberName}</h3>
                    <p className="text-sm text-gray-500">
                      ID: {memberCustomId}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <p className="text-gray-500">Amount</p>
                    <p className="font-medium">
                      {Number(amount)?.toFixed(2)} birr
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Month</p>
                    <p className="font-medium">
                      {format(new Date(missedMonth), "MMM dd yyyy")}
                    </p>
                  </div>
                </div>

                {/* Reason Textarea */}
                <div className="mb-4">
                  <label
                    htmlFor="reason"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Reason for Waiver <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="reason"
                    name="reason"
                    rows={3}
                    className={`w-full p-2 border ${
                      reasonError ? "border-red-500" : "border-gray-300"
                    } rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                    placeholder="Enter the reason for waiving this penalty..."
                    value={reason}
                    onChange={(e) => {
                      setReason(e.target.value);
                      setReasonError("");
                    }}
                  />
                  {reasonError && (
                    <p className="mt-1 text-sm text-red-600">{reasonError}</p>
                  )}
                </div>

                {/* Evidence Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Supporting Evidence
                  </label>
                  {waiverEvidence ? (
                    <div className="mb-2 flex items-center gap-2">
                      <div className="relative h-28 w-80">
                        {waiverEvidence.Url.match(/\.(jpe?g|png|gif|webp)$/i) ? (
                          <Image
                            src={waiverEvidence.Url}
                            alt="Waiver evidence"
                            fill
                            className="object-cover rounded border border-gray-300"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-gray-100 rounded border border-gray-300">
                            <DocumentTextIcon className="h-8 w-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setWaiverEvidence(null)}
                        className="text-red-500 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <UploadFile
                      text="Upload Evidence"
                      getImageUrl={(file) => setWaiverEvidence(file)}
                      setImageReady={() => {}}
                      accept="image/*,.pdf"
                    />
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Upload supporting documents or images (optional)
                  </p>
                </div>
              </div>

              {error && (
                <p className="mb-4 text-sm text-red-600 text-center">{error}</p>
              )}

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setWaiverEvidence(null);
                    setReasonError("");
                    setReason("");
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleWaive}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                  disabled={isLoading}
                >
                  {isLoading ? "Processing..." : "Confirm Waive"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function XIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}

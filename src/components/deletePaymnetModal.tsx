"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { deletePayment } from "@/lib/actions";
import { UserIcon } from "@heroicons/react/24/outline";
import { format } from "date-fns";
import Decimal from "decimal.js";
import { PenaltyType } from "@prisma/client";

interface DeletePaymentButtonProps {
  type: PenaltyType;
  paymentId: number;
  memberName: string;
  amount: number;
  paymentDate: string | Date;
  memberId: number;
  contributionTypeID: number;
}

export default function DeletePaymentButton({
  type,
  paymentId,
  memberName,
  amount,
  paymentDate,
  memberId,
  contributionTypeID,
}: DeletePaymentButtonProps) {
  console.log(type);
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsLoading(true);
    setError(null);
    const data = {
      paymentId,
      amount,
      paymentDate,
      memberName,
      memberId,
      contributionTypeID,
    };
    try {
      const result = await deletePayment(
        { success: false, error: false },
        data,
        type
      );
      if (result?.success) {
        setShowModal(false);
        router.refresh();
      } else {
        setError("Failed to delete payment.");
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowModal(true);
        }}
        className="text-red-500 hover:text-red-800 p-1 rounded "
      >
        Delete
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">
                  This Will Delete Payment Permanently
                </h2>
                <button
                  onClick={() => setShowModal(false)}
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
                      Payment ID: {paymentId}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Amount</p>
                    <p className="font-medium">
                      {Number(amount).toFixed(2)} birr
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Date</p>
                    <p className="font-medium">
                      {format(new Date(paymentDate), "MMM dd yyyy")}
                    </p>
                  </div>
                </div>
              </div>

              {error && (
                <p className="mb-4 text-sm text-red-600 text-center">{error}</p>
              )}

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                  disabled={isLoading}
                >
                  {isLoading ? "Deleting..." : "Confirm Delete"}
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

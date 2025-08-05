"use client";

import { DocumentTextIcon, UserIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import { format } from "date-fns";

export function ViewWaiverModal({
  penalty,
  onClose,
}: {
  penalty: any;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Waiver Details</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
            >
            </button>
          </div>

          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-shrink-0 h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                {penalty.member.image_url ? (
                  <Image
                    src={penalty.member.image_url}
                    alt="Member"
                    width={48}
                    height={48}
                    className="rounded-full"
                  />
                ) : (
                  <UserIcon className="h-6 w-6 text-blue-600" />
                )}
              </div>
              <div>
                <h3 className="font-medium text-gray-900">
                  {penalty.member.first_name} {penalty.member.last_name}
                </h3>
                <p className="text-sm text-gray-500">
                  ID: {penalty.member.custom_id}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div>
                <p className="text-gray-500">Amount</p>
                <p className="font-medium">
                  {penalty.expected_amount} birr
                </p>
              </div>
              <div>
                <p className="text-gray-500">Month</p>
                <p className="font-medium">
                  {format(new Date(penalty.missed_month), "MMM yyyy")}
                </p>
              </div>
            </div>

            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-1">
                Waiver Reason
              </h3>
              <div className="p-3 bg-gray-50 rounded-md">
                <p className="text-gray-800">
                  {penalty.waived_reason || "No reason provided"}
                </p>
              </div>
            </div>

            {penalty.waived_reason_document && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Supporting Evidence
                </h3>
                {penalty.waived_reason_document.match(
                  /\.(jpe?g|png|gif|webp)$/i
                ) ? (
                  <div className="relative h-48 w-full border border-gray-200 rounded-md overflow-hidden">
                    <Image
                      src={penalty.waived_reason_document}
                      alt="Waiver evidence"
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                ) : (
                  <a
                    href={penalty.waived_reason_document}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800"
                  >
                    <DocumentTextIcon className="h-5 w-5" />
                    View Evidence Document
                  </a>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
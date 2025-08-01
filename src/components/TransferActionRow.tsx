"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { transferPrincipalRole } from "@/lib/actions";
import { Member } from "@prisma/client";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { FiAlertTriangle, FiCheckCircle } from "react-icons/fi"; // Import some nice icons

// Define the type for the principal prop, including the nested spouse
type PrincipalWithSpouse = Member & { spouse: Member | null };

export function TransferActionRow({ principal }: { principal: PrincipalWithSpouse }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  
  // --- STEP 1: ADD STATE AND REF FOR THE MODAL ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Effect to sync the dialog's state with our React state
  useEffect(() => {
    if (isModalOpen) {
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [isModalOpen]);

  if (!principal.spouse) return null; // Safety check

  // --- STEP 2: CREATE THE HANDLER FOR THE FINAL CONFIRMATION ---
  const handleConfirmTransfer = () => {
    startTransition(async () => {
      const result = await transferPrincipalRole(principal.id);
      if (result.success) {
        toast.success("Role transferred successfully!");
        setIsModalOpen(false); // Close the modal on success
        router.refresh(); // Refresh the page to remove this row from the list
      } else {
        toast.error(result.message || "Failed to transfer the role.");
        // Optionally keep the modal open on failure to allow retry
      }
    });
  };

  return (
    <>
      {/* This is the table row that is always visible */}
      <tr>
        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{principal.first_name} {principal.last_name}</td>
        <td className="px-6 py-4 whitespace-nowrap text-gray-500">{principal.status}</td>
        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{principal.spouse.first_name} {principal.spouse.last_name}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
          {/* --- STEP 3: THIS BUTTON NOW ONLY OPENS THE MODAL --- */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-semibold"
          >
            Confirm Transfer
          </button>
        </td>
      </tr>

      {/* =================================================================== */}
      {/* === STEP 4: THE CONFIRMATION MODAL (DIALOG ELEMENT) === */}
      {/* =================================================================== */}
      <dialog ref={dialogRef} className="modal backdrop:bg-black/40 p-0 rounded-lg shadow-xl w-full max-w-md">
        <div className="bg-white rounded-lg">
          <div className="p-6 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <FiAlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
            </div>
            <h3 className="mt-5 text-lg font-semibold leading-6 text-gray-900">
              Confirm Principal Role Transfer
            </h3>
            <div className="mt-2 px-4 text-sm text-gray-500">
              <p>
                Are you sure you want to transfer all financial responsibilities and history from{' '}
                <strong className="text-gray-800">{principal.first_name} {principal.last_name}</strong> to{' '}
                <strong className="text-gray-800">{principal.spouse.first_name} {principal.spouse.last_name}</strong>?
              </p>
              <p className="mt-3 font-bold text-red-600">
                This action cannot be undone.
              </p>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
            <button
              type="button"
              onClick={handleConfirmTransfer}
              disabled={isPending}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
            >
              {isPending ? "Transferring..." : "Yes, I'm Sure"}
            </button>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              disabled={isPending}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
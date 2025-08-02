"use client";

// --- React and Next.js Imports ---
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  ReactEventHandler,
  ReactNode,
  SVGProps,
} from "react";
import { useRouter } from "next/navigation";

// --- Library Imports ---
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFormState } from "react-dom";
import { toast } from "react-toastify";

// --- Prisma Type Imports ---
import { Member } from "@prisma/client";

// --- Local Component & Action Imports ---
// Ensure these paths are correct for your project structure
import InputField from "../InputField";
import SelectField from "../SelectField";
import UploadFile from "../FileUpload/page";
import DeletePaymentButton from "../deletePaymnetModal";
import FilterBar from "../filterbar";
import {
  getMemberBalance,
  paymentActionforAutomatic,
  paymentActionforManual,
} from "@/lib/actions";
import {
  paymentFormSchema,
  PaymentFormSchemaType,
  penaltyPaymentFormSchema,
} from "@/lib/formValidationSchemas";

// --- Icon Imports ---
import { FaExclamation, FaFileDownload } from "react-icons/fa";
import { FiX, FiInfo, FiUser } from "react-icons/fi";
import {
  CheckIcon,
  FolderOpenIcon,
  UserIcon as HeroUserIcon,
} from "@heroicons/react/24/outline";

// --- Type Definitions ---

// The primary data structure for this component: a principal member with their optional spouse.
type PrincipalWithSpouse = Member & {
  spouse: Member | null;
};

// All other types needed by the component.
type ContributionType = {
  id: number;
  amount: number;
  name: string;
  is_active: boolean;
};

type Payment = {
  id: number;
  payment_type: string;
  payment_month: string;
  paid_amount: number;
};

type PaymentRecord = {
  id: number;
  custom_id: string;
  member: Member; // The paying member (always the principal)
  contribution_Type_id?: number | null;
  payment_method: string;
  payment_date: Date;
  document_reference: string;
  total_paid_amount: number;
  contributionType?: ContributionType | null;
  remaining_balance?: number | null;
  payments?: Payment[];
  member_id: number;
};

type penaltyPaymentFormSchemaType = {
  member_id: number;
  paid_amount: string;
  payment_method: string;
  payment_date: string;
  penalty_month: string;
  receipt?: string | undefined;
  contribution_id: string;
};

// =================================================================================
// --- Main Component ---
// =================================================================================

export default function ContributionTemplate({
  ContributionType,
  principals,
  payments,
  type,
}: {
  ContributionType?: ContributionType;
  principals: PrincipalWithSpouse[];
  payments: PaymentRecord[];
  type: "manually" | "automatically";
}) {
  // --- State Management ---
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<PrincipalWithSpouse[]>([]);
  const [selectedPrincipal, setSelectedPrincipal] =
    useState<PrincipalWithSpouse | null>(null);
  const [loading, setLoading] = useState(false);
  const [image, setImageUrl] = useState<{ Url: string; fileId: string } | null>(
    null
  );
  const [penaltyMonths, setPenaltyMonths] = useState<
    { month: Date; amount: number }[]
  >([]);
  const [amountError, setAmountError] = useState<string | null>(null);
  const [loadingPenaltyMonths, setLoadingPenaltyMonths] = useState(false);
  const [imageReady, setImageReady] = useState(true);
  const [openPaymentId, setOpenPaymentId] = useState<number | null>(null);
  const [isAmountLocked, setIsAmountLocked] = useState(false);

  // --- Hooks ---
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [state, formAction] = useFormState(
    type === "automatically"
      ? paymentActionforAutomatic
      : paymentActionforManual,
    { success: false, error: false }
  );

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
    watch,
  } = useForm<PaymentFormSchemaType | penaltyPaymentFormSchemaType>({
    resolver: zodResolver(
      type === "automatically" ? paymentFormSchema : penaltyPaymentFormSchema
    ) as any,
    defaultValues: {
      payment_method: "Cash",
      receipt: "",
      payment_date: new Date().toISOString().split("T")[0],
      penalty_month: "",
    },
    mode: "onChange",
  });

  const paymentMethod = watch("payment_method");

  // --- Handlers and Callbacks ---

  const getImageUrl = (newImage: { Url: string; fileId: string }) => {
    setImageUrl(newImage);
  };

  const toggleDetails = (id: number) => {
    setOpenPaymentId((prev) => (prev === id ? null : id));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handlePrincipalSelect = (principal: PrincipalWithSpouse) => {
    setSelectedPrincipal(principal);
    setSearchTerm(`${principal.first_name} ${principal.last_name}`);
    setSearchResults([]);
    setValue("member_id", principal.id, { shouldValidate: true });
  };

  const clearSelectedPrincipal = () => {
    setSelectedPrincipal(null);
    setSearchTerm("");
    setValue("member_id", 0, { shouldValidate: true });
  };

  const resetValues = useCallback(() => {
    setShowAddModal(false);
    clearSelectedPrincipal();
    setImageUrl(null);
    setIsAmountLocked(false);
    setPenaltyMonths([]);
    setAmountError(null);
    reset({
      payment_method: "Cash",
      receipt: "",
      payment_date: new Date().toISOString().split("T")[0],
      penalty_month: "",
      paid_amount: "",
      member_id: 1,
      contribution_id: ContributionType?.id?.toString() || "",
    });
  }, [reset, ContributionType?.id]);

  const onSubmit = async (
    data: PaymentFormSchemaType | penaltyPaymentFormSchemaType
  ) => {
    if (!selectedPrincipal) {
      toast.error("Please select a principal member first.");
      return;
    }
    setLoading(true);
    try {
      const baseData = {
        member_id: selectedPrincipal.id,
        paid_amount: Number(data.paid_amount),
        payment_method: data.payment_method,
        payment_date: new Date(data.payment_date),
        receipt: image?.Url,
      };

      if (type === "automatically") {
        const automaticData = {
          ...baseData,
          contribution_type: (data as PaymentFormSchemaType).contribution_type,
          contribution_id: ContributionType?.id?.toString(),
        };
        formAction(automaticData as any);
      } else {
        const penaltyData = {
          ...baseData,
          penalty_month: new Date(
            (data as penaltyPaymentFormSchemaType).penalty_month
          ),
        };
        formAction(penaltyData as any);
      }
    } catch (error) {
      console.error("❌ Error submitting form:", error);
      toast.error("Failed to process payment");
      setLoading(false);
    }
  };

  const onError = (errors: any) => {
    console.error("❌ Zod Validation Errors:", errors);
    toast.error("Please check the form for errors.");
  };

  // --- useEffect Hooks ---

  useEffect(() => {
    if (!selectedPrincipal && searchTerm.length > 1) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      const results = principals.filter((principal) => {
        const principalName =
          `${principal.first_name} ${principal.second_name} ${principal.last_name}`.toLowerCase();
        if (
          principalName.includes(lowerCaseSearchTerm) ||
          principal.phone_number?.includes(lowerCaseSearchTerm)
        ) {
          return true;
        }
        if (principal.spouse) {
          const spouseName =
            `${principal.spouse.first_name} ${principal.spouse.second_name} ${principal.spouse.last_name}`.toLowerCase();
          return spouseName.includes(lowerCaseSearchTerm);
        }
        return false;
      });
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchTerm, selectedPrincipal, principals]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setSearchResults([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (state.success) {
      resetValues();
      setLoading(false);
      toast.success("Payment created successfully!");
      router.refresh();
    }
    if (state.error) {
      setLoading(false);
      toast.error("Something went wrong with the payment.");
    }
  }, [state, router, resetValues]);

  // Other original useEffects for penalty months, etc. can be placed here if needed
  // ...

  // --- Render ---
  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              {type === "manually"
                ? "Penalty Payments"
                : `${ContributionType?.name || "Contribution"} Payments`}
            </h1>
            <p className="text-gray-600 mt-1">
              {type === "manually"
                ? "Manage manually generated penalty payments"
                : `Track all ${ContributionType?.name} contribution Payments`}
            </p>
          </div>
          <button
            onClick={() => {
              resetValues();
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
            disabled={
              principals.length <= 0 ||
              (ContributionType && !ContributionType.is_active)
            }
          >
            <PlusIcon className="w-5 h-5" />
            Add Payment
          </button>
        </div>

        <FilterBar />

        {/* Payments Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-700 text-lg">
              Payment Records
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <TableHeader>ID</TableHeader>
                  <TableHeader>Member</TableHeader>
                  <TableHeader>Amount</TableHeader>
                  <TableHeader>Date</TableHeader>
                  <TableHeader>Method</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payments.length > 0 ? (
                  payments.map((payment) => (
                    <React.Fragment key={payment.id}>
                      <tr
                        className="hover:bg-blue-50 transition-colors cursor-pointer"
                        onClick={() => toggleDetails(payment.id)}
                      >
                        <TableCell>{payment.custom_id}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <HeroUserIcon className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {payment.member.first_name}{" "}
                                {payment.member.last_name}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-blue-800">
                            {Number(payment.total_paid_amount).toFixed(2)} birr
                          </span>
                        </TableCell>
                        <TableCell>
                          {new Date(payment.payment_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={payment.payment_method.toLowerCase() as any}>
                            {payment.payment_method}
                          </Badge>
                        </TableCell>
                        <TableCell onclick={(e) => e.stopPropagation()}>
                          <DeletePaymentButton
                            type={type}
                            paymentId={payment.id}
                            memberName={`${payment.member.first_name} ${payment.member.last_name}`}
                            amount={payment.total_paid_amount}
                            paymentDate={payment.payment_date}
                            memberId={payment.member_id}
                            contributionTypeID={payment.contribution_Type_id ?? 0}
                          />
                        </TableCell>
                      </tr>
                      {openPaymentId === payment.id && (
                        <tr className="bg-gray-50">
                          <td colSpan={8} className="px-6 py-4">
                            {/* Expanded details view content */}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <FolderOpenIcon className="h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-1">
                          No payments recorded
                        </h3>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* --- Add Payment Modal --- */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-800">
                  Add New Payment
                </h3>
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-500"
                  onClick={resetValues}
                >
                  <FiX size={24} />
                </button>
              </div>

              <form
                onSubmit={handleSubmit(onSubmit, onError)}
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Find Family (Search by Principal or Spouse Name)
                  </label>
                  <div className="relative" ref={dropdownRef}>
                    {selectedPrincipal ? (
                      <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-blue-800">
                              {selectedPrincipal.first_name}{" "}
                              {selectedPrincipal.last_name} (Principal)
                            </p>
                            <p className="text-sm text-blue-600">
                              {selectedPrincipal.phone_number}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={clearSelectedPrincipal}
                            className="p-1 text-red-500 rounded-full hover:bg-red-100"
                          >
                            <FiX size={20} />
                          </button>
                        </div>
                        <div className="mt-3 pt-3 border-t border-blue-200">
                          <h4 className="text-xs font-semibold text-gray-600 mb-2">
                            Spouse Covered:
                          </h4>
                          {selectedPrincipal.spouse ? (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-white border rounded-lg">
                              <FiUser className="h-4 w-4 text-gray-500" />
                              <span className="text-sm font-medium text-gray-800">
                                {selectedPrincipal.spouse.first_name}{" "}
                                {selectedPrincipal.spouse.last_name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500 italic">
                              No spouse linked.
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <>
                        <input
                          type="text"
                          placeholder="Start typing a name or phone number..."
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                          value={searchTerm}
                          onChange={handleSearchChange}
                        />
                        {searchResults.length > 0 && (
                          <ul className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md max-h-60 overflow-auto border border-gray-200">
                            {searchResults.map((principal) => (
                              <li key={principal.id}>
                                <button
                                  type="button"
                                  onClick={() => handlePrincipalSelect(principal)}
                                  className="w-full text-left px-4 py-3 hover:bg-gray-100"
                                >
                                  <p className="font-semibold text-gray-800">
                                    {principal.first_name} {principal.last_name}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    Principal -{" "}
                                    {principal.spouse
                                      ? `Spouse: ${principal.spouse.first_name}`
                                      : "No spouse"}
                                  </p>
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {!selectedPrincipal && (
                  <div className="flex items-center gap-3 p-3 bg-gray-100 text-gray-600 text-sm rounded-lg">
                    <FiInfo className="flex-shrink-0" size={32} />
                    <p>
                      Please select a principal. The payment will be recorded
                      for the entire family under their name. The form below
                      will activate once a principal is selected.
                    </p>
                  </div>
                )}

                <div
                  className={`transition-opacity duration-300 space-y-6 ${
                    selectedPrincipal
                      ? "opacity-100"
                      : "opacity-40 pointer-events-none"
                  }`}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField
                      label="Amount"
                      name="paid_amount"
                      type="number"
                      register={register}
                      error={errors.paid_amount}
                      inputProps={{
                        step: "0.01",
                        min: "0",
                        placeholder: "0.00",
                        required: true,
                        readOnly: isAmountLocked,
                      }}
                    />
                    <InputField
                      label="Payment Date"
                      name="payment_date"
                      type="date"
                      register={register}
                      error={errors.payment_date}
                      inputProps={{ required: true }}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SelectField
                      label="Payment Method"
                      name="payment_method"
                      register={register}
                      error={errors.payment_method}
                      options={[
                        { value: "Cash", label: "Cash" },
                        { value: "Bank", label: "Bank" },
                        { value: "Mobile banking", label: "Mobile banking" },
                      ]}
                    />
                    {paymentMethod !== "Cash" && (
                      <UploadFile
                        text="receipt"
                        getImageUrl={getImageUrl}
                        setImageReady={setImageReady}
                      />
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t">
                  <button
                    type="button"
                    onClick={resetValues}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium  bg-green-600 text-white  hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!selectedPrincipal || loading || !imageReady}
                  >
                    {loading ? "Processing..." : "Save Payment"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =================================================================================
// --- Helper Components ---
// =================================================================================

function TableHeader({ children }: { children: ReactNode }) {
  return (
    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
      {children}
    </th>
  );
}

function TableCell({
  children,
  onclick,
}: {
  children: ReactNode;
  onclick?: ReactEventHandler;
}) {
  return (
    <td className="px-6 py-4 whitespace-nowrap" onClick={onclick}>
      {children}
    </td>
  );
}

function Badge({
  children,
  variant = "default",
}: {
  children: ReactNode;
  variant?: "cash" | "bank" | "mobile banking" | "default";
}) {
  const variantClasses = {
    cash: "bg-green-100 text-green-800",
    bank: "bg-blue-100 text-blue-800",
    "mobile banking": "bg-purple-100 text-purple-800",
    default: "bg-gray-100 text-gray-800",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
        variantClasses[variant.toLowerCase() as keyof typeof variantClasses] ||
        variantClasses.default
      }`}
    >
      {children}
    </span>
  );
}

function PlusIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 4v16m8-8H4"
      />
    </svg>
  );
}
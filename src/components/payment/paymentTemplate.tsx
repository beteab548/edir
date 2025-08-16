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
import InputField from "../InputField";
import SelectField from "../SelectField";
import UploadFile from "../FileUpload/page";
import DeletePaymentButton from "../deletePaymnetModal";
import FilterBar from "../filterbar";
import {
  deductAmountFromBalance,
  fetchbalance,
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

// --- Import the Action ---
import { checkIFhasExcessbalance } from "@/lib/actions"; // Make sure the path is correct
// =================================================================================
// --- Type Definitions ---
// =================================================================================

type PrincipalWithSpouse = Member & {
  spouse: Member | null;
};

type ContributionType = {
  id: number;
  amount: number;
  name: string;
  is_active: boolean;
  mode: "Recurring" | "OneTimeWindow" | "OpenEndedRecurring";
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
  member: Member;
  contribution_Type_id?: number | null;
  payment_method: string;
  payment_date: Date;
  document_reference: string;
  total_paid_amount: number;
  contributionType?: ContributionType | null;
  remaining_balance?: number | null;
  payments?: Payment[];
  excess_balance?: number; // Added to track excess balance
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
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<PrincipalWithSpouse[]>([]);
  const [selectedPrincipal, setSelectedPrincipal] =
    useState<PrincipalWithSpouse | null>(null);
  const [loading, setLoading] = useState(false);
  const [image, setImageUrl] = useState<{ Url: string; fileId: string } | null>(
    null
  );
  const [openPaymentId, setOpenPaymentId] = useState<number | null>(null);
  const [imageReady, setImageReady] = useState(true);

  // Penalty-specific state
  const [penaltyMonths, setPenaltyMonths] = useState<
    { month: Date; amount: number; waived: boolean | null }[]
  >([]);
  const [loadingPenaltyMonths, setLoadingPenaltyMonths] = useState(false);
  const [LimitMessage, setLimitMessage] = useState<string>("");
  const [isAmountLocked, setIsAmountLocked] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [payFromBalance, setPayFromBalance] = useState(false);
  const [excessBalance, setExcessBalance] = useState<number>(0); // Track excess balance
  // --- Hooks ---
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const listRef = useRef<HTMLUListElement>(null); // useRef for the list

  // const [state, formAction] = useFormState(
  //   type === "automatically"
  //     ? paymentActionforAutomatic
  //     : paymentActionforManual,
  //   { success: false, error: false }
  // );

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
    watch,
  } = useForm<PaymentFormSchemaType | penaltyPaymentFormSchemaType>({
    resolver: zodResolver(
      type === "manually" ? penaltyPaymentFormSchema : paymentFormSchema
    ) as any, // Dynamic schema based on type
    defaultValues: {
      payment_method: "Cash",
      payment_date: new Date().toISOString().split("T")[0],
      penalty_month: "",
    },
    mode: "onChange",
  });

  const paymentMethod = watch("payment_method");
  const paidAmount = watch("paid_amount"); // Get the paid amount

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
    setIsDropdownOpen(false);
    setValue("member_id", principal.id, { shouldValidate: true });
    setFocusedIndex(-1); // Reset focused index after selection
  };

  const clearSelectedPrincipal = useCallback(() => {
    setSelectedPrincipal(null);
    setSearchTerm("");
    setValue("member_id", 0, { shouldValidate: true });
    setFocusedIndex(-1); // Reset focused index after clearing
  }, [setSelectedPrincipal, setSearchTerm, setValue]);
  const resetValues = useCallback(() => {
    setShowAddModal(false);
    clearSelectedPrincipal();
    setImageUrl(null);
    setLimitMessage("");
    setIsDropdownOpen(false);
    setIsAmountLocked(false);
    setPenaltyMonths([]);
    setPayFromBalance(false);
    setExcessBalance(0);
    reset({
      payment_method: "Cash",
      payment_date: new Date().toISOString().split("T")[0],
      penalty_month: "",
      paid_amount:
        type === "automatically"
          ? ContributionType?.amount.toString() || ""
          : "",
      member_id: 1,
      contribution_id: ContributionType?.id?.toString() || "",
    });
    setFocusedIndex(-1); // Reset focused index after resetting values
  }, [reset, type, ContributionType, clearSelectedPrincipal]);

  const onSubmit = async (
    data: PaymentFormSchemaType | penaltyPaymentFormSchemaType
  ) => {
    if (!selectedPrincipal) {
      toast.error("Please select a principal member first.");
      return;
    }
    if (payFromBalance && !excessBalance) {
      toast.error("Insufficient balance.");
      return;
    }

    setLoading(true);
    try {
      const baseData = {
        member_id: selectedPrincipal.id,
        paid_amount: Number(data.paid_amount),
        payment_method: payFromBalance ? "Excess Balance" : data.payment_method, // Use 'Balance' as payment method
        payment_date: new Date(data.payment_date),
        receipt: image?.Url,
      };

      let result; // To store the result of the action

      if (type === "automatically") {
        const automaticData = {
          ...baseData,
          contribution_type: (data as PaymentFormSchemaType).contribution_type,
          contribution_id: ContributionType?.id?.toString(),
        };

        const limitAmount = await fetchbalance(
          selectedPrincipal.id,
          ContributionType?.name!
        );
        if (ContributionType?.mode !== "OpenEndedRecurring") {
          if (limitAmount < Number(data.paid_amount)) {
            setLimitMessage(
              `paid amount ${baseData.paid_amount} birr is greater than the limit owed ${limitAmount} birr`
            );
            setLoading(false);
            return;
          }
        }
        setLimitMessage("");

        // Call the server action and await the result
        result = await paymentActionforAutomatic(automaticData as any);
      } else {
        const penaltyData = {
          ...baseData,
          penalty_month: new Date(
            (data as penaltyPaymentFormSchemaType).penalty_month
          ),
        };

        if (payFromBalance) {
          try {
            await deductAmountFromBalance(
              selectedPrincipal.id,
              Number(data.paid_amount)
            );
          } catch (deductError) {
            console.error("❌ Error deducting balance:", deductError);
            toast.error("Failed to deduct amount from balance.");
            setLoading(false);
            return; // Exit if deducting balance fails
          }
        }

        // Call the server action and await the result
        result = await paymentActionforManual(penaltyData as any);
      }

      // Process the result
      if (result?.success) {
        toast.success("Payment created successfully!");
        resetValues();
        router.refresh();
      } else {
        toast.error("Something went wrong with the payment.");
      }
    } catch (error) {
      console.error("❌ Error submitting form:", error);
      toast.error("Failed to process payment");
    } finally {
      setLoading(false);
    }
  };

  const onError = (errors: any) => {
    console.error("❌ Zod Validation Errors:", errors);
    toast.error("Please check the form for errors.");
  };

  // --- useEffect Hooks ---

  // Smart search for principals and their spouses
  // Smart search for principals and their spouses
  useEffect(() => {
    if (!principals) return;

    const normalize = (str: any) =>
      str?.toLowerCase().replace(/[^a-z0-9]/g, "");

    const normalizedSearchTerm = normalize(searchTerm);

    const results = principals.filter((principal) => {
      const principalName = `${principal.first_name} ${principal.second_name} ${principal.last_name}`.toLowerCase();

      // ✅ Check for custom_id (ignoring dashes, spaces, etc.)
      if (normalize(principal.custom_id)?.includes(normalizedSearchTerm)) {
        return true;
      }

      if (
        principalName.includes(searchTerm.toLowerCase()) ||
        principal.phone_number?.includes(searchTerm)
      ) {
        return true;
      }

      if (principal.spouse) {
        const spouseName = `${principal.spouse.first_name} ${principal.spouse.second_name} ${principal.spouse.last_name}`.toLowerCase();
        return spouseName.includes(searchTerm.toLowerCase());
      }

      return false;
    });

    setSearchResults(results);
    setFocusedIndex(-1); // Reset focused index when search results change
  }, [searchTerm, principals]);

  // Click outside dropdown handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false); // This is now correctly placed inside the handler
        setFocusedIndex(-1); // Also reset focused index when dropdown closes
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch penalty months when a principal is selected for a manual payment
  useEffect(() => {
    const fetchPenaltyMonths = async () => {
      if (type === "manually" && selectedPrincipal) {
        setLoadingPenaltyMonths(true);
        try {
          const res = await fetch(
            `/api/penalty?memberId=${selectedPrincipal.id}`
          );
          if (!res.ok) throw new Error("Failed to fetch penalty months");
          const { monthsWithAmount } = await res.json();
          const filtered = (monthsWithAmount || []).filter(
            (p: { waived: boolean | null }) => !p.waived
          );
          const sorted = filtered.sort(
            (a: { month: Date }, b: { month: Date }) =>
              new Date(a.month).getTime() - new Date(b.month).getTime()
          );
          setPenaltyMonths(sorted);
        } catch (error) {
          console.error("Error fetching penalty months:", error);
          toast.error("Failed to load penalty months");
          setPenaltyMonths([]);
        } finally {
          setLoadingPenaltyMonths(false);
        }
      } else {
        setPenaltyMonths([]);
      }
    };
    fetchPenaltyMonths();
  }, [type, selectedPrincipal]);

  // Watch for changes in the penalty_month dropdown and update the amount
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name === "penalty_month" && value.penalty_month) {
        const selectedMonth = penaltyMonths.find(
          (month) =>
            new Date(month.month).toISOString() ===
            new Date(value?.penalty_month ?? new Date()).toISOString()
        );
        if (selectedMonth) {
          setValue("paid_amount", selectedMonth.amount.toString(), {
            shouldValidate: true,
          });
          setIsAmountLocked(true);
        }
      } else if (name === "penalty_month" && !value.penalty_month) {
        setValue("paid_amount", "");
        setIsAmountLocked(false);
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, penaltyMonths, setValue]);

  // Set default amount for automatic contributions
  useEffect(() => {
    if (type === "automatically" && ContributionType?.amount) {
      setValue("paid_amount", ContributionType.amount.toString());
    }
  }, [type, ContributionType, setValue]);

  // Check excess balance
  useEffect(() => {
    const checkBalance = async () => {
      if (type === "manually" && selectedPrincipal && paidAmount) {
        try {
          const excess = await checkIFhasExcessbalance(selectedPrincipal.id);
          setExcessBalance(excess);
        } catch (error) {
          console.error("Error checking balance:", error);
          toast.error("Failed to check balance");
          setExcessBalance(0);
        }
      } else {
        setExcessBalance(0);
      }
    };
    checkBalance();
  }, [type, selectedPrincipal, paidAmount]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isDropdownOpen) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (searchResults.length > 0) {
        setFocusedIndex((prevIndex) => {
          const newIndex = (prevIndex + 1) % searchResults.length;
          scrollToListItem(newIndex); // Scroll to the new item
          return newIndex;
        });
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (searchResults.length > 0) {
        setFocusedIndex((prevIndex) => {
          let newIndex = (prevIndex - 1 + searchResults.length) % searchResults.length;
          scrollToListItem(newIndex); // Scroll to the new item
          return newIndex;
        });
      }
    } else if (e.key === "Enter" && focusedIndex !== -1) {
      e.preventDefault();
      handlePrincipalSelect(searchResults[focusedIndex]);
    }
  };

  const scrollToListItem = (index: number) => {
    if (listRef.current) {
      const listItem = listRef.current.children[index] as HTMLElement;
      if (listItem) {
        listItem.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest', // or 'center'
        });
      }
    }
  };
  // --- Render ---
  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-600">
              {type === "manually"
                ? "Penalty Payments"
                : `${ContributionType?.name || "Contribution"} Payments`}
            </h1>
          </div>
          <button
            onClick={() => {
              resetValues();
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
            disabled={
              type === "automatically" &&
              (principals.length <= 0 || !ContributionType?.is_active)
            }
          >
            <PlusIcon className="w-5 h-5" />
            Add Payment
          </button>
        </div>

        <FilterBar />

        {/* Payments Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Table content from previous examples */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-600 text-lg">
              Payment Records
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <TableHeader>ID</TableHeader>
                  <TableHeader>Member</TableHeader>
                  <TableHeader>Amount</TableHeader>
                  <TableHeader>Date</TableHeader>
                  <TableHeader>Method</TableHeader>
                  {type === "automatically" && (
                    <TableHeader>Balance</TableHeader>
                  )}
                  {type === "automatically" && (
                    <TableHeader>Excess balance</TableHeader>
                  )}
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
                                {payment.member.second_name}{" "}
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
                          <Badge
                            variant={
                              payment.payment_method.toLowerCase() as any
                            }
                          >
                            {payment.payment_method}
                          </Badge>
                        </TableCell>

                        {type === "automatically" && (
                          <TableCell>
                            <span
                              className={`${
                                (payment?.remaining_balance ?? 0) > 0
                                  ? " text-red-800 bg-red-100  "
                                  : " text-green-800 bg-green-100 "
                              } rounded-full  px-2 `}
                            >
                              {payment.remaining_balance}
                            </span>
                          </TableCell>
                        )}
                        {type === "automatically" && (
                          <TableCell>
                            <span
                              className={`
                                  : " text-green-800 bg-green-100 "
                               rounded-full  px-2 `}
                            >
                              {payment.excess_balance}
                            </span>
                          </TableCell>
                        )}
                        <TableCell onclick={(e) => e.stopPropagation()}>
                          <DeletePaymentButton
                            type={type}
                            paymentId={payment.id}
                            memberName={`${payment.member.first_name} ${payment.member.last_name}`}
                            amount={payment.total_paid_amount}
                            paymentDate={payment.payment_date}
                            memberId={payment.member_id}
                            contributionTypeID={
                              payment.contribution_Type_id ?? 0
                            }
                          />
                        </TableCell>
                      </tr>
                      {openPaymentId === payment.id && (
                        <tr className="bg-gray-50">
                          <td colSpan={8} className="px-6 py-4">
                            <div className="pl-14 pr-6 py-4 bg-white rounded-lg border border-gray-200 shadow-xs">
                              <div className="flex justify-between items-start mb-3">
                                <h4 className="font-semibold text-gray-800">
                                  Payment Details
                                </h4>
                                {payment.document_reference &&
                                  payment.document_reference !== "-" && (
                                    <a
                                      href={payment.document_reference}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                                    >
                                      <FaFileDownload className="h-4 w-4" />
                                      View Receipt
                                    </a>
                                  )}
                              </div>

                              {(payment.payments?.length ?? 0) > 0 ? (
                                <div className="space-y-4">
                                  {payment.payments?.map((p) => (
                                    <div
                                      key={p.id}
                                      className="flex gap-4 items-start"
                                    >
                                      <div
                                        className={`mt-1 flex-shrink-0 h-5 w-5 rounded-full flex items-center justify-center ${
                                          p.payment_type === "penalty"
                                            ? "bg-red-100 text-red-600"
                                            : "bg-green-100 text-green-600"
                                        }`}
                                      >
                                        {p.payment_type === "penalty" ? (
                                          <FaExclamation className="h-3 w-3" />
                                        ) : (
                                          <CheckIcon className="h-3 w-3" />
                                        )}
                                      </div>
                                      <div className="flex-1">
                                        <div className="flex justify-between">
                                          <p className="font-medium text-gray-800">
                                            {p.payment_type === "penalty"
                                              ? "Penalty Payment"
                                              : p.payment_type ===
                                                "Registration"
                                              ? "Registration Fee"
                                              : "Monthly Contribution"}
                                          </p>
                                          <p className="font-semibold text-blue-800">
                                            {Number(p.paid_amount).toFixed(2)}{" "}
                                            birr
                                          </p>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1">
                                          {p.payment_type === "penalty"
                                            ? `For: ${new Date(
                                                p.payment_month
                                              ).toLocaleDateString("en-US", {
                                                year: "numeric",
                                                month: "short",
                                              })}`
                                            : `Month: ${new Date(
                                                p.payment_month
                                              ).toLocaleDateString("en-US", {
                                                year: "numeric",
                                                month: "short",
                                              })}`}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-4">
                                  <p className="text-gray-500">
                                    No detailed payment information available
                                  </p>
                                </div>
                              )}
                            </div>{" "}
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
                  Add New {type === "manually" ? "Penalty" : "Contribution"}{" "}
                  Payment
                </h3>
                <button type="button" onClick={resetValues}>
                  <FiX size={24} />
                </button>
              </div>

              <form
                onSubmit={handleSubmit(onSubmit, onError)}
                className="space-y-6"
              >
                {/* --- Row 1: Search and Type --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Col 1: Find Family */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Find Family (Search by Principal or Spouse)
                    </label>
                    <div className="relative" ref={dropdownRef}>
                      {selectedPrincipal ? (
                        <div className="p-1 border border-blue-200 rounded-lg bg-blue-50">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-blue-800">
                                {selectedPrincipal.first_name}{" "}
                                {selectedPrincipal.second_name}{" "}
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
                        </div>
                      ) : (
                        <>
                          <input
                            type="text"
                            placeholder="Click to show all or start typing..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            value={searchTerm}
                            onChange={handleSearchChange}
                            onFocus={() => {
                              setIsDropdownOpen(true);
                              if (searchTerm === "") {
                                setSearchResults(principals);
                              }
                            }}
                            onKeyDown={handleKeyDown} // Attach keydown handler
                          />
                          {isDropdownOpen && (
                            <div className="absolute z-10 mt-1 w-full border border-gray-200 rounded-lg shadow-lg bg-white max-h-60 overflow-y-auto">
                              {principals.length === 0 ? (
                                // A) Case 1: The initial list passed via props is empty.
                                <div className="p-4 text-center text-sm text-gray-500">
                                  {type === "manually"
                                    ? "No members with unpaid penalties found."
                                    : "No eligible members found for this contribution."}
                                </div>
                              ) : searchResults.length > 0 ? (
                                // B) Case 2: We have search results to display.
                                <ul ref={listRef}>
                                  {searchResults.map((principal, index) => (
                                    <li key={principal.id} className="list-none">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handlePrincipalSelect(principal)
                                        }
                                        className={`w-full text-left px-4 py-3 hover:bg-gray-100 border-b last:border-0 ${index === focusedIndex ? "bg-blue-100" : ""
                                          }`}
                                      >
                                        <p className="font-semibold text-gray-800">
                                          {principal.first_name}{" "}
                                          {principal.second_name}{" "}
                                          {principal.last_name} (Principal)
                                        </p>
                                        <p className="text-sm text-gray-500">
                                          {principal.spouse
                                            ? `Spouse: ${principal.spouse.first_name} ${principal.spouse.second_name}`
                                            : "No spouse"}
                                        </p>
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                // C) Case 3: The initial list has members, but the current search term found none.
                                <div className="p-4 text-center text-sm text-gray-500">
                                  No members match your search.
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Col 2: Contribution Type or Penalty Month */}
                  <div>
                    {type === "automatically" ? (
                      <InputField
                        label="Contribution Type"
                        name="contribution_type"
                        register={register}
                        inputProps={{
                          value: ContributionType?.name || "",
                          disabled: true,
                          className: "bg-gray-200 cursor-not-allowed",
                        }}
                      />
                    ) : (
                      <SelectField
                        label="Penalty Month"
                        name="penalty_month"
                        register={register}
                        error={errors.penalty_month}
                        disabled={
                          loadingPenaltyMonths || penaltyMonths.length === 0
                        }
                        options={
                          loadingPenaltyMonths
                            ? [{ value: "", label: "Loading penalties..." }]
                            : penaltyMonths.length === 0
                              ? [{ value: "", label: "No outstanding penalties" }]
                              : [
                                { value: "", label: "Select oldest penalty" },
                                ...penaltyMonths.map((month, index) => ({
                                  value: new Date(month.month).toISOString(),
                                  label: `${new Date(
                                    month.month
                                  ).toLocaleDateString()} - ${month.amount
                                    } birr`,
                                  disabled: index !== 0,
                                })),
                              ]
                        }
                      />
                    )}
                  </div>
                </div>

                {/* Wrapper div to control the enabled/disabled state of lower form rows */}
                <div
                  className={`transition-opacity duration-300 space-y-6 ${selectedPrincipal
                    ? "opacity-100"
                    : "opacity-40 pointer-events-none"
                    }`}
                >
                  {/* --- Row 2: Amount and Date --- */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Col 1: Amount */}
                    <div>
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
                          readOnly:
                            isAmountLocked ||
                            (type === "manually" && !!ContributionType?.amount),
                          className:
                            isAmountLocked ||
                            (type === "manually" && !!ContributionType?.amount)
                              ? "bg-gray-200 cursor-not-allowed"
                              : "",
                        }}
                      />
                      <span className="text-xs text-red-600">
                        {LimitMessage.length > 0 && LimitMessage}
                      </span>
                    </div>
                    {/* Col 2: Payment Date */}
                    <InputField
                      label="Payment Date"
                      name="payment_date"
                      type="date"
                      register={register}
                      error={errors.payment_date}
                      inputProps={{ required: true }}
                    />
                  </div>
                  {/* Pay from balance checkbox */}
                  {type === "manually" && (
                    <div className="flex items-center">
                      <input
                        id="pay-from-balance"
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        checked={payFromBalance}
                        onChange={(e) => setPayFromBalance(e.target.checked)}
                        disabled={Number(paidAmount) > excessBalance}
                      />
                      <label
                        htmlFor="pay-from-balance"
                        className="ml-2 block text-sm text-gray-900"
                      >
                        Pay from Balance (Available: {excessBalance} birr)
                      </label>
                    </div>
                  )}
                  {/* --- Row 3: Method and Upload --- */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Col 1: Payment Method */}
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
                      disabled={payFromBalance}
                    />
                    {/* Col 2: Upload File (Conditional) */}
                    <div>
                      {paymentMethod !== "Cash" && !payFromBalance && (
                        <UploadFile
                          text="receipt"
                          getImageUrl={getImageUrl}
                          setImageReady={setImageReady}
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* --- Form Buttons --- */}
                <div className="flex justify-end gap-3 pt-6 border-t">
                  <button
                    type="button"
                    onClick={resetValues}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!selectedPrincipal || loading || !imageReady}
                  >
                    {loading ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      "Save Payment"
                    )}
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
    <td className="px-4 py-4 whitespace-nowrap" onClick={onclick}>
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

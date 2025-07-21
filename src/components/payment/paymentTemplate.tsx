"use client";
import { Member } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { useRouter } from "next/navigation";
import React, { ReactEventHandler, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback } from "react";
import InputField from "../InputField";
import SelectField from "../SelectField";
import { toast } from "react-toastify";
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
import UploadFile from "../FileUpload/page";
import { useFormState } from "react-dom";
import { FaExclamation } from "react-icons/fa";

import { FaFileDownload } from "react-icons/fa";

import {
  CheckIcon,
  FolderOpenIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import FilterBar from "../filterbar";
import DeletePaymentButton from "../deletePaymnetModal";

type ContributionType = {
  id: number;
  amount: number;
  start_date: Date | null;
  end_date: Date | null;
  name: string;
  is_for_all: boolean;
  is_active: Boolean;
};
type Payment = {
  id: number;
  member_id: number;
  contribution_id: number;
  payment_record_id: number;
  contribution_schedule_id: number | null;
  payment_type: string;
  payment_month: string;
  paid_amount: number;
};
type PaymentRecord = {
  id: number;
  custom_id: string;
  member_id: number;
  contribution_Type_id?: number | null;
  payment_method: string;
  payment_date: Date;
  document_reference: string;
  total_paid_amount: number;
  member: Member;
  contributionType?: ContributionType | null;
  remaining_balance?: number | null;
  payments?: Payment[];
};

export default function ContributionTemplate({
  ContributionType,
  members,
  payments,
  type,
}: {
  ContributionType?: ContributionType;
  members: Member[];
  payments: PaymentRecord[];
  type: "manually" | "automatically";
}) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
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
  const router = useRouter();
  const [selectedContributionTypeFormat, setSelectedContributionTypeFormat] =
    useState<ContributionType | undefined>(ContributionType);
  const [openPaymentId, setOpenPaymentId] = useState<number | null>(null);
  const [state, formAction] = useFormState(
    type === "automatically"
      ? paymentActionforAutomatic
      : paymentActionforManual,
    { success: false, error: false }
  );
  const [isAmountLocked, setIsAmountLocked] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
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
      receipt: "www://example.com/receipt.jpg",
      payment_date: new Date().toISOString().split("T")[0],
      penalty_month: "",
    },
    mode: "onChange",
  });
  const paymentMethod = watch("payment_method");
  const getImageUrl = async (newImage: { Url: string; fileId: string }) => {
    try {
      setImageUrl({ Url: newImage.Url, fileId: newImage.fileId });
    } catch (err) {
      console.error("Failed to handle receipt:", err);
    }
  };

  // Handle clicks outside the dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setSearchResults([]);
      }
    };

    // Add event listener when component mounts
    document.addEventListener("mousedown", handleClickOutside);

    // Clean up event listener when component unmounts
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  useEffect(() => {
    const fetchPenaltyMonths = async () => {
      if (type === "manually" && selectedMember) {
        setLoadingPenaltyMonths(true);
        const res = await fetch(`/api/penalty?memberId=${selectedMember.id}`);
        const { monthsWithAmount } = await res.json();
        setPenaltyMonths(monthsWithAmount || []);
        setLoadingPenaltyMonths(false);
      } else {
        setPenaltyMonths([]);
      }
    };
    fetchPenaltyMonths();
  }, [type, selectedMember]);
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name === "penalty_month" && value.penalty_month) {
        const selectedMonth = penaltyMonths.find(
          (month) => month.month === value.penalty_month
        );
        if (selectedMonth) {
          setValue("paid_amount", selectedMonth.amount.toString(), {
            shouldValidate: true,
          });
          setIsAmountLocked(true);
        }
      }
      if (name === "penalty_month" && !value.penalty_month) {
        setIsAmountLocked(false);
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, penaltyMonths, setValue]);
  useEffect(() => {
    if (selectedContributionTypeFormat?.amount) {
      setValue(
        "paid_amount",
        selectedContributionTypeFormat?.amount.toString()
      );
      setValue("contribution_type", selectedContributionTypeFormat.name);
    }
  }, [selectedContributionTypeFormat, setValue]);
  useEffect(() => {
    if (!selectedMember) {
      if (searchTerm.length > 0) {
        const results = members.filter((member: Member) => {
          return (
            member.first_name
              .toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            member.second_name
              .toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            member.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            member.phone_number.toLowerCase().includes(searchTerm.toLowerCase())
          );
        });
        setSearchResults(results);
      } else {
        setSearchResults(members);
      }
    } else {
      setSearchResults([]);
    }
  }, [searchTerm, selectedMember, members]);
  const resetValues = useCallback(() => {
    setShowAddModal(false);
    setSearchResults([]);
    setSelectedMember(null);
    setSearchTerm("");
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

  const toggleDetails = (id: number) => {
    setOpenPaymentId((prev) => (prev === id ? null : id));
  };
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  const handleMemberSelect = (member: Member) => {
    setSelectedMember(member);
    setSearchTerm(`${member.first_name} ${member.last_name}`);
    setSearchResults([]);
    setValue("member_id", member.id, { shouldValidate: true });
  };
  const clearSelectedMember = () => {
    setSelectedMember(null);
    setSearchTerm("");
    setSearchResults(members);
    setValue("member_id", 1, { shouldValidate: true });
  };
  const fetchMemberBalance = async (
    memberId: number,
    contribution_id: string
  ) => {
    return await getMemberBalance(memberId, contribution_id);
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
  const onSubmit = async (
    data: PaymentFormSchemaType | penaltyPaymentFormSchemaType
  ) => {
    try {
      setLoading(true);
      if (!selectedMember) {
        setLoading(false);
        toast.error("Please select a member first");
        return;
      }

      if (type === "automatically") {
        const enteredAmount = Number(data.paid_amount);
        const balance = await fetchMemberBalance(
          selectedMember.id,
          data.contribution_id
        );

        const balanceNumber =
          typeof balance === "number" ? balance : Number(balance);
        if (enteredAmount > balanceNumber) {
          setAmountError(
            `The entered amount (${enteredAmount}) is greater than the amount owed (${balanceNumber})`
          );
          setLoading(false);
          return;
        }
      }
      const baseData = {
        member_id: selectedMember.id,
        paid_amount: Number(data.paid_amount),
        payment_method: data.payment_method,
        payment_date: new Date(data.payment_date),
        receipt: image?.Url,
      };

      if (type === "automatically") {
        const automaticData = {
          ...baseData,
          contribution_type: (data as PaymentFormSchemaType).contribution_type,
          contribution_id: ContributionType?.id
            ? ContributionType.id.toString()
            : undefined,
        };
        formAction(automaticData);
      } else {
        const penaltyData = {
          ...baseData,
          penalty_month: new Date(
            (data as penaltyPaymentFormSchemaType).penalty_month
          ),
        };
        formAction(penaltyData);
      }
    } catch (error) {
      console.error("❌ Error submitting form:", error);
      toast.error("Failed to process payment");
    }
  };
  const onError = (errors: any) => {
    console.log("❌ Zod Validation Errors:", errors);
  };
  useEffect(() => {
    if (state.success) {
      resetValues();
      setLoading(false);
      toast.success(` Payment created successfully!`);
      type === "automatically"
        ? router.push(`/contribution/${ContributionType?.name}`)
        : router.push("/penalty/payment");
      return router.refresh();
    }
    if (state.error) {
      setLoading(false);
      toast.error("Something went wrong");
    }
  }, [state, router, type, ContributionType?.name, resetValues]);
  useEffect(() => {
    return () => {
      resetValues();
    };
  }, [resetValues]);
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {type === "manually"
                ? "Penalty Payments"
                : ContributionType?.name + " Payments"}
            </h1>
            <p className="text-gray-600 mt-1">
              {type === "manually"
                ? "Manage manually generated penalty payments"
                : `Track all ${ContributionType?.name} contribution Payments`}
            </p>
          </div>
          {/* Add Payment Button */}
          <div className="relative group">
            <button
              onClick={() => {
                resetValues();
                setShowAddModal(true);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                members.length <= 0 ||
                (ContributionType && !ContributionType.is_active)
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg"
              }`}
              disabled={
                members.length <= 0 ||
                (ContributionType && !ContributionType.is_active)
              }
            >
              <PlusIcon className="w-5 h-5" />
              Add Payment
            </button>
            {(members.length <= 0 ||
              (ContributionType && !ContributionType.is_active)) && (
              <div className="absolute z-10 hidden group-hover:block w-48 bg-gray-800 text-white text-xs rounded p-1 bottom-full mb-2">
                {members.length <= 0
                  ? "No members available"
                  : "Contribution is inactive"}
              </div>
            )}
          </div>
        </div>
        <FilterBar />
        {/* Payments Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Table Header with Search */}
          <div className="px-6 py-4 border-b border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h2 className="font-semibold text-gray-800 text-lg">
              Payment Records
            </h2>
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <TableHeader>ID</TableHeader>
                  <TableHeader>Member</TableHeader>
                  <TableHeader>Amount</TableHeader>
                  {type === "automatically" && <TableHeader>Type</TableHeader>}
                  <TableHeader>Date</TableHeader>
                  <TableHeader>Method</TableHeader>
                  {type === "automatically" && (
                    <TableHeader>Balance</TableHeader>
                  )}
                  <TableHeader>Actions</TableHeader>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payments.length > 0 ? (
                  payments.map((payment) => (
                    <React.Fragment key={payment.id}>
                      {/* Main Payment Row */}
                      <tr
                        className="hover:bg-blue-50 transition-colors hover:cursor-pointer"
                        onClick={() => toggleDetails(payment.id)}
                      >
                        <TableCell>
                          <span className="font-medium text-gray-900">
                            {payment.custom_id}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <UserIcon className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {payment.member.first_name}{" "}
                                {payment.member.second_name}{" "}
                                {payment.member.last_name}
                              </p>
                              <p className="text-sm text-gray-500">
                                {payment.member.phone_number}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-blue-800">
                            {Number(payment.total_paid_amount).toFixed(2)} birr
                          </span>
                        </TableCell>
                        {type === "automatically" && (
                          <TableCell>
                            <span className="text-gray-600">
                              {payment.contributionType?.name}
                            </span>
                          </TableCell>
                        )}
                        <TableCell>
                          <span className="text-gray-600">
                            {new Date(
                              payment.payment_date
                            ).toLocaleDateString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              payment.payment_method.toLowerCase() as
                                | "cash"
                                | "bank"
                                | "mobile banking"
                                | "default"
                            }
                          >
                            {payment.payment_method}
                          </Badge>
                        </TableCell>
                        {type === "automatically" && (
                          <TableCell>
                            <span
                              className={`font-medium ${
                                Number(payment.remaining_balance) > 0
                                  ? "text-red-600"
                                  : "text-green-600"
                              }`}
                            >
                              {payment.remaining_balance?.toString() ?? "0"}{" "}
                              birr
                            </span>
                          </TableCell>
                        )}
                        <TableCell
                          onclick={(e) => {
                            e.stopPropagation();
                          }}
                        >
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

                      {/* Expanded Details Row */}
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
                                              : "Monthly Contribution"}
                                          </p>
                                          <p className="font-semibold">
                                            {Number(p.paid_amount).toFixed(2)}{" "}
                                            birr
                                          </p>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1">
                                          {p.payment_type === "penalty"
                                            ? `For: ${new Date(
                                                p.payment_month
                                              ).toLocaleDateString()}`
                                            : `Month: ${new Date(
                                                p.payment_month
                                              ).toLocaleDateString()}`}
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
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <FolderOpenIcon className="h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-1">
                          No payments recorded
                        </h3>
                        <p className="text-gray-500 max-w-md">
                          {type === "manually"
                            ? "No penalty payments have been recorded yet."
                            : `No ${ContributionType?.name} payments have been recorded yet.`}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Payment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800">
                  Add New Payment
                </h3>
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-500"
                  onClick={resetValues}
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <form
                onSubmit={handleSubmit(onSubmit, onError)}
                className="space-y-6"
              >
                {/* Row 1: Dynamic first row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Member Select */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Member
                    </label>
                    <div className="relative" ref={dropdownRef}>
                      {selectedMember ? (
                        <div className="flex items-center justify-between p-2 border border-gray-300 rounded-md bg-gray-50">
                          <span>
                            {selectedMember.first_name}{" "}
                            {selectedMember.second_name}{" "}
                            {selectedMember.last_name} (
                            {selectedMember.phone_number})
                          </span>
                          <button
                            type="button"
                            onClick={clearSelectedMember}
                            className="text-red-500 hover:text-red-700"
                          >
                            <svg
                              className="h-5 w-5"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <>
                          <input
                            type="text"
                            placeholder="member name or phone number..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            value={searchTerm}
                            onChange={handleSearchChange}
                            onClick={() => {
                              if (
                                !selectedMember &&
                                searchTerm === "" &&
                                searchResults.length === 0
                              ) {
                                setSearchResults(members);
                              }
                            }}
                          />
                          {searchResults.length > 0 && (
                            <ul className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md max-h-60 overflow-auto border border-gray-200">
                              {searchResults.map((member) => (
                                <li key={member.id}>
                                  <button
                                    type="button"
                                    onClick={() => handleMemberSelect(member)}
                                    className="w-full text-left px-4 py-2 hover:bg-gray-100 flex justify-between items-center"
                                  >
                                    <span>
                                      {member.first_name} {member.second_name}{" "}
                                      {member.last_name} ({member.phone_number})
                                    </span>
                                    <svg
                                      className="h-5 w-5 text-blue-500"
                                      viewBox="0 0 20 20"
                                      fill="currentColor"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right Side */}
                  <div>
                    {type === "automatically" ? (
                      <InputField
                        label="Contribution Type"
                        name="contribution_type"
                        register={register}
                        inputProps={{
                          value: selectedContributionTypeFormat?.name,
                          disabled: true,
                          className:
                            "w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100",
                        }}
                      />
                    ) : (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Penalty Month
                        </label>
                        <select
                          {...register("penalty_month", { required: true })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          disabled={
                            loadingPenaltyMonths || penaltyMonths.length === 0
                          }
                        >
                          <option value="">Select a month</option>
                          {penaltyMonths.map((month) => {
                            const monthStr =
                              typeof month.month === "string"
                                ? month.month
                                : `${month.month.getFullYear()}-${String(
                                    month.month.getMonth() + 1
                                  ).padStart(2, "0")}`;
                            return (
                              <option key={monthStr} value={monthStr}>
                                {monthStr.slice(0, 10)} - {month.amount} birr
                              </option>
                            );
                          })}
                        </select>
                        <span className=" text-xs text-red-700">
                          {penaltyMonths.length > 1
                            ? "only allows payment from oldes to latest"
                            : ""}
                        </span>{" "}
                        {errors.penalty_month && (
                          <span className="text-red-500 text-xs">
                            Penalty month is required
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Row 2 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField
                    label="Amount"
                    name="paid_amount"
                    type="number"
                    required
                    register={register}
                    error={
                      errors.paid_amount ||
                      (amountError
                        ? { type: "manual", message: amountError }
                        : undefined)
                    }
                    inputProps={{
                      step: "0.01",
                      min: "0",
                      placeholder: "0.00",
                      required: true,
                      readOnly: isAmountLocked,
                      className: `w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                        isAmountLocked ? "bg-gray-100 cursor-not-allowed" : ""
                      }`,
                      onChange: () => setAmountError(null), // Clear error when user types
                    }}
                  />
                  <InputField
                    name="contribution_id"
                    hidden
                    register={register}
                    defaultValue={
                      selectedContributionTypeFormat?.id || ContributionType?.id
                    }
                  />
                  <InputField
                    label="Payment Date"
                    name="payment_date"
                    type="date"
                    required
                    register={register}
                    inputProps={{
                      required: true,
                      className:
                        "w-full px-3 py-2 border border-gray-300 rounded-md",
                    }}
                  />
                </div>

                {/* Row 3 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SelectField
                    label="Payment Method"
                    name="payment_method"
                    register={register}
                    error={errors.payment_method}
                    options={[
                      { value: "", label: "Select payment method" },
                      { value: "Cash", label: "Cash" },
                      { value: "Bank", label: "Bank" },
                      { value: "Mobile banking", label: "Mobile banking" },
                    ]}
                    selectProps={{
                      className:
                        "w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500",
                    }}
                  />
                  {paymentMethod !== "Cash" && (
                    <UploadFile
                      text="receipt"
                      getImageUrl={getImageUrl}
                      setImageReady={setImageReady}
                    />
                  )}
                </div>

                {/* Row 4 */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setSelectedMember(null);
                      setSearchTerm("");
                      resetValues();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={
                      !imageReady ||
                      loading ||
                      !selectedMember ||
                      loadingPenaltyMonths
                    }
                  >
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                      </span>
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

function TableHeader({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
      {children}
    </th>
  );
}

function TableCell({
  children,
  onclick,
}: {
  children: React.ReactNode;
  onclick?: ReactEventHandler;
}) {
  return (
    <td className="px-2 py-4 whitespace-nowrap" onClick={onclick}>
      {children}
    </td>
  );
}

function Badge({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
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

function PlusIcon(props: React.SVGProps<SVGSVGElement>) {
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

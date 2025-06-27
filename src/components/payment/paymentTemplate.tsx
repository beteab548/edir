"use client";
import { Contribution, Member, Payment } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import InputField from "../InputField";
import SelectField from "../SelectField";
import { toast } from "react-toastify";
import { createPaymentAction, PenaltyPaymentAction } from "@/lib/actions";
import {
  paymentFormSchema,
  PaymentFormSchemaType,
  penaltyPaymentFormSchema,
  penaltyPaymentFormSchemaType,
} from "@/lib/formValidationSchemas";
import UploadFile from "../FileUpload/page";
import { useFormState } from "react-dom";
import Image from "next/image";

type ContributionType = {
  id: number;
  amount: number;
  start_date: Date | null;
  end_date: Date | null;
  name: string;
  is_for_all: boolean;
  is_active: Boolean;
};

type PaymentRecord = {
  id: number;
  member_id: number;
  contribution_Type_id?: number | null;
  payment_method: string;
  payment_date: Date;
  document_reference: string;
  total_paid_amount: Prisma.Decimal;
  member: Member;
  contributionType?: ContributionType | null;
  remaining_balance?: Prisma.Decimal | null;
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
  const [loadingPenaltyMonths, setLoadingPenaltyMonths] = useState(false);
  const [imageReady, setImageReady] = useState(true);
  const router = useRouter();
  const [selectedContributionTypeFormat, setSelectedContributionTypeFormat] =
    useState<ContributionType | undefined>(ContributionType);
  const [openPaymentId, setOpenPaymentId] = useState<number | null>(null);
  const [state, formAction] = useFormState(
    type === "automatically" ? createPaymentAction : PenaltyPaymentAction,
    { success: false, error: false }
  );
  const [isAmountLocked, setIsAmountLocked] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isValid },
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
  useEffect(() => {
    const fetchPenaltyMonths = async () => {
      if (type === "manually" && selectedMember) {
        console.log("Fetching penalty months for member:", selectedMember.id);
        setLoadingPenaltyMonths(true);
        const res = await fetch(`/api/penalty?memberId=${selectedMember.id}`);
        const { monthsWithAmount } = await res.json();
        console.log(monthsWithAmount);
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
    if (searchTerm.length > 1 && !selectedMember) {
      const results = members.filter((member: Member) => {
        return (
          member.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.second_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.phone_number.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchTerm, selectedMember, members]);
  const resetValues = () => {
    setShowAddModal(false);
    setSearchResults([]);
    setSelectedMember(null);
    setSearchTerm("");
    setImageUrl(null);
    setIsAmountLocked(false);
    setValue("paid_amount", "", { shouldValidate: true });
    setValue("payment_method", "Cash", { shouldValidate: true });
    setValue("payment_date", new Date().toISOString().split("T")[0], {
      shouldValidate: true,
    });
    setValue("penalty_month", "", { shouldValidate: true });
    setValue("receipt", "", { shouldValidate: true });
    return;
  };
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
    setValue("member_id", 1, { shouldValidate: true });
  };
  const onSubmit = async (
    data: PaymentFormSchemaType | penaltyPaymentFormSchemaType
  ) => {
    try {
      if (!selectedMember) {
        toast.error("Please select a member first");
        return;
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
        console.log("Submitting manual payment data:", penaltyData);

        formAction(penaltyData);
      }
    } catch (error) {
      console.error("❌ Error submitting form:", error);
    }
  };
  const onError = (errors: any) => {
    console.log("❌ Zod Validation Errors:", errors);
  };
  useEffect(() => {
    if (state.success) {
      toast.success(` Payment created successfully!`);
      type === "automatically"
        ? router.push(`/contribution/${ContributionType?.name}`)
        : router.push("/penalty/payment");
      router.refresh();
      return resetValues();
    }
    if (state.error) toast.error("Something went wrong");
  }, [state, router, type]);
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Payments</h1>

            {type === "manually" ? (
              <p className="text-gray-600">
                Manage Manually generated Penalities payments
              </p>
            ) : (
              <p className="text-gray-600">
                Manage all {ContributionType?.name ?? "Contribution"} payments
              </p>
            )}
          </div>
          <div
            title={
              members.length <= 0
                ? "No members available"
                : !ContributionType?.is_active
                ? "Contribution is inactive"
                : ""
            }
          >
            <button
              onClick={() => setShowAddModal(true)}
              className="btn bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              disabled={
                members.length <= 0 ||
                (ContributionType && !ContributionType.is_active)
              }
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              Add Payment
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Member Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paid Amount
                  </th>
                  {type === "automatically" && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contribution Type
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Method
                  </th>
                  {type === "automatically" && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Balance
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payments.map((payment) => (
                  <React.Fragment key={payment.id}>
                    {/* Main Payment Row */}
                    <tr
                      className="hover:bg-blue-50 transition-colors duration-150 cursor-pointer border-b border-gray-200"
                      onClick={() => toggleDetails(payment.id)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">
                          #{payment.id}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="ml-0">
                            <p className="text-sm font-medium text-gray-900">
                              {payment.member.first_name}{" "}
                              {payment.member.second_name}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-sm font-semibold text-blue-800 bg-blue-100 rounded-full">
                          {payment.total_paid_amount.toString()} birr
                        </span>
                      </td>
                      {type === "automatically" && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-600">
                            {payment.contributionType?.name}
                          </span>
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600">
                          {new Date(payment.payment_date).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize bg-green-100 text-green-800">
                          {payment.payment_method}
                        </span>
                      </td>
                      {payment?.remaining_balance && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`text-sm font-medium ${
                              Number(payment.remaining_balance) > 0
                                ? "text-red-600"
                                : "text-green-600"
                            }`}
                          >
                            {payment.remaining_balance?.toString() ?? "N/A"}{" "}
                            birr
                          </span>
                        </td>
                      )}
                    </tr>

                    {/* Expanded Details Row */}
                    {openPaymentId === payment.id && (
                      <tr className="bg-gray-50">
                        <td colSpan={7} className="px-6 py-4">
                          <div className="pl-8 pr-4 py-3 bg-white rounded-lg shadow-xs border border-gray-200">
                            <h4 className="text-sm font-semibold text-gray-800 mb-2">
                              Payment Breakdown
                            </h4>
                            {(payment.payments?.length ?? 0) > 0 ? (
                              <ul className="space-y-2">
                                {payment.payments?.map((p) => (
                                  <li key={p.id} className="flex items-start">
                                    <span className="flex items-center justify-center h-5 w-5 rounded-full bg-blue-100 text-blue-800 mr-3 mt-0.5 text-xs">
                                      {p.payment_type === "penalty" ? "!" : "$"}
                                    </span>
                                    <div className="flex-1">
                                      <p className="text-sm text-gray-700">
                                        {p.payment_type === "penalty"
                                          ? `Penalty Payment`
                                          : `Monthly Contribution`}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        Amount: {Number(p.paid_amount)} birr
                                        {p.payment_type !== "penalty" &&
                                          ` • Month: ${p.payment_month}`}
                                        {p.payment_type === "penalty" &&
                                          ` • Month: ${p.payment_month}`}
                                      </p>
                                    </div>
                                  </li>
                                ))}
                                <div>
                                  {payment?.document_reference &&
                                    payment?.document_reference !== "-" && (
                                      <Image
                                        src={payment.document_reference}
                                        alt="Payment Receipt"
                                        width={100}
                                        height={100}
                                        unoptimized
                                        className="mt-2 rounded-lg"
                                      />
                                    )}
                                </div>
                              </ul>
                            ) : (
                              <div className="text-center py-4">
                                <p className="text-sm text-gray-500">
                                  No payment details available
                                </p>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}

                {payments.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-4 text-center text-sm text-gray-500"
                    >
                      No payments recorded yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800">
                  Add New Payment
                </h3>
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-500"
                  onClick={() => {
                    setShowAddModal(false);
                    setSelectedMember(null);
                    setSearchTerm("");
                  }}
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
                    <div className="relative">
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
                            placeholder="Type member name or phone number..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            value={searchTerm}
                            onChange={handleSearchChange}
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
                    register={register}
                    error={errors.paid_amount}
                    inputProps={{
                      step: "0.01",
                      min: "0",
                      placeholder: "0.00",
                      required: true,
                      readOnly: isAmountLocked,
                      className: `w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                        isAmountLocked ? "bg-gray-100 cursor-not-allowed" : ""
                      }`,
                    }}
                  />
                     <input
                      type="hidden"
                      {...register("contribution_id")}
                      value={
                        selectedContributionTypeFormat?.id ||
                        ContributionType?.id
                      }
                    />
                  <InputField
                    label="Payment Date"
                    name="payment_date"
                    type="date"
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
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
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

"use client";
import { Member } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import InputField from "../InputField";
import SelectField from "../SelectField";
import { toast } from "react-toastify";
import { createPaymentAction } from "@/lib/actions";
import {
  paymentFormSchema,
  PaymentFormSchemaType,
} from "@/lib/formValidationSchemas";
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
  document: string;
  contribution_id: number;
  member_id: number;
  payment_method: string;
  payment_month: string;
  paid_amount: Prisma.Decimal;
  payment_date: Date;
  created_at: Date;
  payment_type: string;
  member: Member;
};

export default function ContributionTemplate({
  ContributionType,
  members,
  payments,
}: {
  ContributionType: ContributionType;
  members: Member[];
  payments: Payment[];
}) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [selectedContributionTypeFormat, setSelectedContributionTypeFormat] =
    useState<ContributionType>(ContributionType);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<PaymentFormSchemaType>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      payment_method: "Bank",
      receipt: "www://example.com/receipt.jpg",
      payment_date: new Date().toISOString().split("T")[0],
    },
  });

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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleMemberSelect = (member: Member) => {
    setSelectedMember(member);
    setSearchTerm(`${member.first_name} ${member.last_name}`);
    setSearchResults([]);
    setValue("member_id", member.id);
  };

  const onSubmit = async (data: PaymentFormSchemaType) => {
    try {
      const transformedData = {
        ...data,
        paid_amount: Number(data.paid_amount),
        payment_date: new Date(data.payment_date),
      };
      console.log("✅ Transformed Data to Submit:", transformedData);
      const res = await createPaymentAction(
        { success: false, error: false },
        transformedData
      );

      if (!res.success) {
        return toast.error("Failed to create payment!");
      }
      toast.success("Payment created successfully!");
      reset();
      setShowAddModal(false);
      router.refresh();
    } catch (error) {
      console.error("❌ Error submitting form:", error);
    }
  };

  const onError = (errors: any) => {
    console.log("❌ Zod Validation Errors:", errors);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Payments</h1>
            <p className="text-gray-600">
              Manage all {ContributionType.name} payments
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            disabled={members.length <= 0}
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

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    contribution Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Month
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payments.map((payment: Payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {payment?.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payment?.member?.first_name}{" "}
                      {payment?.member?.second_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payment.paid_amount.toString()} birr
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payment.payment_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(payment.payment_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payment.payment_month}
                    </td>
                  </tr>
                ))}
                {payments.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
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

        {showAddModal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowAddModal(false);
                setSelectedMember(null);
                setSearchTerm("");
              }
            }}
          >
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
                    aria-label="Close"
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

                {!selectedMember && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Search Member
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Type member name or phone number..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        value={searchTerm}
                        onChange={handleSearchChange}
                        disabled={!!selectedMember}
                      />
                      {searchResults.length > 0 && !selectedMember && (
                        <ul className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md max-h-60 overflow-auto">
                          {searchResults.map((member) => (
                            <li key={member.id}>
                              <button
                                type="button"
                                onClick={() => handleMemberSelect(member)}
                                className="w-full text-left px-4 py-2 hover:bg-gray-100"
                              >
                                {member.first_name} {member.second_name}{" "}
                                {member.last_name} ({member.phone_number})
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )}

                {selectedMember && (
                  <form onSubmit={handleSubmit(onSubmit, onError)}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
                          className:
                            "w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500",
                        }}
                      />
                      <input
                        type="hidden"
                        {...register("contribution_id")}
                        value={
                          selectedContributionTypeFormat?.id ||
                          ContributionType.id
                        }
                      />
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
                      <InputField
                        label="Payment Date"
                        name="payment_date"
                        type="date"
                        register={register}
                        inputProps={{
                          disabled: true,
                          required: true,
                          className:
                            "w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100",
                        }}
                      />
                      <SelectField
                        label="Month Being Paid For"
                        name="payment_month"
                        register={register}
                        error={errors.payment_month}
                        options={[
                          { value: "", label: "Select a month" },
                          { value: "January", label: "January" },
                          { value: "February", label: "February" },
                          { value: "March", label: "March" },
                          { value: "April", label: "April" },
                          { value: "May", label: "May" },
                          { value: "June", label: "June" },
                          { value: "July", label: "July" },
                          { value: "August", label: "August" },
                          { value: "September", label: "September" },
                          { value: "October", label: "October" },
                          { value: "November", label: "November" },
                          { value: "December", label: "December" },
                        ]}
                        selectProps={{
                          className:
                            "w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500",
                        }}
                      />
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Upload receipt
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="file"
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setValue("receipt", file.name);
                              }
                            }}
                          />
                        </div>
                        <InputField
                          label="receipt"
                          name="receipt"
                          register={register}
                          error={errors.receipt}
                          hidden
                        />
                      </div>
                      <SelectField
                        label="Payment Method"
                        name="payment_method"
                        register={register}
                        error={errors.payment_method}
                        options={[
                          { value: "", label: "Select payment method" },
                          { value: "Bank", label: "Bank" },
                          { value: "Cash", label: "Cash" },
                          { value: "Mobile banking", label: "Mobile banking" },
                        ]}
                        selectProps={{
                          className:
                            "w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500",
                        }}
                      />
                    </div>

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
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        disabled={loading}
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
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

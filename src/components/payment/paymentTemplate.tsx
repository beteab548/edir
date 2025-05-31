"use client";

import { Member, Payment } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import InputField from "../InputField";
import SelectField from "../SelectField";
import { toast } from "react-toastify";
import { createPaymentAction } from "@/lib/actions";
import { paymentFormSchema,PaymentFormSchemaType } from "@/lib/formValidationSchemas";
type ContributionType = {
  id: number;
  amount: number;
  start_date: Date | null;
  end_date: Date | null;
  name: string;
  is_for_all: boolean;
  is_active: Boolean;
};
export default function ContributionTemplate({
  ContributionType,
  members,
}: {
  ContributionType: ContributionType;
  members: Member[];
}) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [Allmembers, setMembers] = useState<Member[]>(members);
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
        paid_amount: new Prisma.Decimal(data.paid_amount),
        payment_date: new Date(data.payment_date),
      };
      console.log("✅ Transformed Data to Submit:", transformedData);
      const res = await createPaymentAction(
        { success: false, error: false },
        transformedData
      );
   
      if (!res.success) {
        return toast.error("failed to create paymnet!");
      }
      toast.success("payment created!");
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
    <>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Payments</h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
            disabled={members.length <= 0}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
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
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>ID</th>
                <th>Member</th>
                <th>Amount</th>
                <th>Date</th>
                <th>month</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment: Payment) => (
                <tr key={payment.id}>
                  <td>{payment.id}</td>
                  <td>{payment.paid_amount.toString()} birr</td>
                  <td>{new Date(payment.payment_date).toLocaleDateString()}</td>
                  <td>{payment.payment_month}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {showAddModal && (
          <div
            className="modal modal-open"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowAddModal(false);
                setSelectedMember(null);
                setSearchTerm("");
              }
            }}
          >
            <div className="modal-box w-11/12 max-w-3xl relative">
              <button
                type="button"
                className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedMember(null);
                  setSearchTerm("");
                }}
                aria-label="Close"
              >
                ✕
              </button>
              <h3 className="font-bold text-lg mb-4">Add New Payment For</h3>
              {!selectedMember && (
                <>
                  <div className="mb-16">
                    <label className="label">
                      <span className="label-text">Search Member</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Type member name..."
                        className="input input-bordered w-full"
                        value={searchTerm}
                        onChange={handleSearchChange}
                        disabled={!!selectedMember}
                      />
                      {searchResults.length > 0 && !selectedMember && (
                        <ul className="menu bg-base-100 w-full mt-1 shadow-lg rounded-box absolute z-10">
                          {searchResults.map((member) => (
                            <li key={member.id}>
                              <button
                                type="button"
                                onClick={() => handleMemberSelect(member)}
                                className="text-left"
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
                </>
              )}
              {selectedMember && (
                <form onSubmit={handleSubmit(onSubmit, onError)}>
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
                    />
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Upload receipt</span>
                      </label>
                      <input
                        type="file"
                        className="file-input file-input-bordered file-input-primary w-full max-w-xs"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setValue("receipt", file.name);
                          }
                        }}
                      />
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
                    />
                  </div>
                  <div className="modal-action">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddModal(false);
                        setSelectedMember(null);
                        setSearchTerm("");
                      }}
                      className="btn btn-ghost"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={loading}
                    >
                      {loading ? (
                        <span className="loading loading-spinner"></span>
                      ) : (
                        "Save Payment"
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

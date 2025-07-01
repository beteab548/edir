"use client";

import { useEffect, useState } from "react";
import { SubmitErrorHandler, SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { penaltyFormSchema } from "@/lib/formValidationSchemas";
import { addPenaltyType, createPenalty, getPenaltyTypes } from "@/lib/actions";
import { useFormState } from "react-dom";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import InputField from "@/components/InputField";

type Member = {
  id: number;
  first_name: string;
  second_name: string;
  last_name: string;
  id_number: string | null;
  phone_number: string;
};
type Penalty = {
  id: number;
  member: {
    id: number;
    custom_id: string;
    first_name: string;
    second_name: string;
    last_name: string;
  };
  penalty_type: string;
  reason: string;
  amount: number;
  paid_amount: number;
  missed_month: Date;
  is_paid: boolean;
  applied_at: Date;
  resolved_at: Date | null;
  waived: boolean | null;
  generated: "automatically" | "manually" | null;
};

type Props = {
  members: Member[];
  penalties: Penalty[];
};

export default function PenaltyManagement({ members, penalties }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>(members);
  const [isWaiveModalOpen, setIsWaiveModalOpen] = useState(false);
  const [selectedPenalty, setSelectedPenalty] = useState<Penalty | null>(null);
  const router = useRouter();
  const form = useForm<z.infer<typeof penaltyFormSchema>>({
    resolver: zodResolver(penaltyFormSchema),
    defaultValues: {
      member_id: 0,
      reason: "",
      amount: 0,
      missed_month: new Date(),
      generated: "manually",
    },
  });
  const [penaltyTypes, setPenaltyTypes] = useState<string[]>([]);

  const [state, formAction] = useFormState(createPenalty, {
    success: false,
    error: false,
  });
  const [penaltiesWithNumberAmount, setPenaltiesWithNumberAmount] = useState(
    []
  );
  const [allMembers, setAllMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<{ message: string } | null>(null);

  useEffect(() => {
    getPenaltyTypes().then((types) =>
      setPenaltyTypes(types.map((t) => t.name))
    );
  }, []);
  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        setError(null);
        const res = await fetch("/api/fetchSettingDatas");
        if (!res.ok) throw new Error("Failed to fetch data");
        const { penalties, allMembers } = await res.json();
        console.log("penalties", penalties);
        console.log("allmembers", allMembers);
        setPenaltiesWithNumberAmount(penalties);
        setAllMembers(allMembers);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError({ message: err.message });
        } else {
          setError({
            message: "An unknown error occurred while fetching data.",
          });
        }
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);
  const handleWaivePenalty = async (penaltyId: number) => {
    try {
      const response = await fetch("/api/penalty", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ penaltyId }),
      });

      if (!response.ok) {
        throw new Error("Failed to waive penalty");
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (term === "") {
      setFilteredMembers(members);
      return;
    }
    const filtered = members.filter(
      (member) =>
        `${member.first_name} ${member.second_name} ${member.last_name}`
          .toLowerCase()
          .includes(term.toLowerCase()) ||
        member.id_number?.toLowerCase().includes(term.toLowerCase()) ||
        member.phone_number.toLowerCase().includes(term.toLowerCase())
    );
    setFilteredMembers(filtered);
  };

  const handleMemberSelect = (member: Member) => {
    setSelectedMember(member);
    form.setValue("member_id", member.id);
  };

  // -------------- handlers -----------------

  // ✅ Called only when the form passes Zod validation
  const onSubmit: SubmitHandler<z.infer<typeof penaltyFormSchema>> = (data) => {
    formAction(data); 

  };

  // ❌ Called when there are validation errors
  const onInvalid: SubmitErrorHandler<z.infer<typeof penaltyFormSchema>> = (
    errors
  ) => {
    console.error("Validation errors:", errors); // dev console
    toast.error("Please fix the highlighted form errors.");
  };

  useEffect(() => {
    if (state.success) {
      toast.success(`peanlty has been created`);
    }
    if (state.error) toast.error("Something went wrong");
  }, [state, router]);
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Penalty Management</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          Add Penalty
        </button>
      </div>
      {/* Penalty Table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Id
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Member
              </th>
              {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Penalty Type
              </th> */}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reason
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Expected Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Paid
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Missed Month
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {penalties.map((penalty) => (
              <tr key={penalty.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {penalty.member.custom_id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {penalty.member.first_name} {penalty.member.second_name}{" "}
                  {penalty.member.last_name}
                </td>

                {/* <td className="px-6 py-4 whitespace-nowrap">
                  {penalty.type_name || "Unknown"}
                </td> */}
                <td className="px-6 py-4 whitespace-nowrap">
                  {penalty.reason}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {penalty.amount.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {penalty.paid_amount.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {format(new Date(penalty.missed_month), "MMM yyyy")}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {penalty.is_paid
                    ? "Paid"
                    : penalty.waived
                    ? "Waived"
                    : "Pending"}
                </td>
              </tr>
            ))}
            {penalties.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center">
                  No penalties found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Penalty Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Add New Penalty</h2>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    form.reset();
                    setSelectedMember(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>
              <form
                onSubmit={form.handleSubmit(onSubmit, onInvalid)}
                className="space-y-4"
              >
                {/* First Row: Search + Missed Month */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Search Member Input */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">
                      Search Member
                    </label>
                    <div className="relative">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search by name or phone"
                          value={
                            selectedMember
                              ? `${selectedMember.first_name} ${selectedMember.second_name} ${selectedMember.last_name}`
                              : searchTerm
                          }
                          onChange={(e) => {
                            setSelectedMember(null); // Clear selected if user types again
                            handleSearch(e.target.value);
                          }}
                          className="w-full p-2 border rounded pr-10"
                          disabled={!!selectedMember}
                        />
                        {selectedMember && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedMember(null);
                              setSearchTerm("");
                              form.setValue("member_id", 0);
                            }}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-red-400 hover:text-red-500"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>

                    {searchTerm && !selectedMember && (
                      <div className="border rounded-lg max-h-60 overflow-y-auto">
                        {filteredMembers.length > 0 ? (
                          filteredMembers.map((member) => (
                            <div
                              key={member.id}
                              className="p-2 hover:bg-gray-100 cursor-pointer"
                              onClick={() => handleMemberSelect(member)}
                            >
                              {member.first_name} {member.second_name}{" "}
                              {member.last_name} - {member.id_number} -{" "}
                              {member.phone_number}
                            </div>
                          ))
                        ) : (
                          <div className="p-2 text-gray-500">
                            No members found
                          </div>
                        )}
                      </div>
                    )}

                    {form.formState.errors.member_id && (
                      <p className="text-sm text-red-500">
                        {form.formState.errors.member_id.message}
                      </p>
                    )}
                  </div>

                  {/* Missed Month */}
                  <InputField
                    label="Missed Date"
                    name="missed_month"
                    type="date"
                    register={form.register}
                    defaultValue={format(new Date(), "yyyy-MM-dd")}
                    registerOptions={{
                      setValueAs: (value: string) =>
                        value ? new Date(value) : new Date(),
                    }}
                    error={form.formState.errors.missed_month}
                  />
                </div>
                {/* Second Row: Amount + Penalty Type */}
                <div className="grid grid-cols-2 gap-4">
                  <InputField
                    label="Amount"
                    name="amount"
                    type="number"
                    register={form.register}
                    error={form.formState.errors.amount}
                  />

                  <div className="space-y-2">
                    <label className="block text-sm font-medium">
                      Penalty Type
                    </label>
                    <select
                      {...form.register("penalty_type")}
                      className="w-full p-2 border rounded"
                    >
                      <option value="">Select Penalty type</option>
                      {penaltyTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                    {form.formState.errors.penalty_type && (
                      <p className="text-sm text-red-500">
                        {form.formState.errors.penalty_type.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      form.reset();
                      setSelectedMember(null);
                    }}
                    className="px-4 py-2 border rounded hover:bg-gray-100 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    Save Penalty
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* Waive Penalty Modal */}
      {isWaiveModalOpen && selectedPenalty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Waive Penalty</h2>
                <button
                  onClick={() => setIsWaiveModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>

              <p className="mb-4">
                Are you sure you want to waive the penalty for{" "}
                {selectedPenalty.member.first_name}{" "}
                {selectedPenalty.member.last_name}?
              </p>

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  onClick={() => setIsWaiveModalOpen(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!selectedPenalty) return;
                    try {
                      const result = await handleWaivePenalty(
                        selectedPenalty.id
                      );
                      if (result.success) {
                        toast.success(
                          `Penalty waived for ${selectedPenalty.member.first_name}`
                        );
                        router.refresh(); // Refresh the page to show updated status
                      } else {
                        toast.error(result.error || "Failed to waive penalty");
                      }
                    } catch (error) {
                      toast.error("Failed to waive penalty");
                      console.error("Error waiving penalty:", error);
                    } finally {
                      setIsWaiveModalOpen(false);
                    }
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  Confirm Waive
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

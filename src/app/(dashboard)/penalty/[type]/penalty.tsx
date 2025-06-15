"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { penaltyFormSchema } from "@/lib/formValidationSchemas";
import { addPenaltyType, createPenalty, getPenaltyTypes } from "@/lib/actions";
import { useFormState } from "react-dom";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
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
  const [newPenaltyType, setNewPenaltyType] = useState("");
  const [state, formAction] = useFormState(createPenalty, {
    success: false,
    error: false,
  });
  useEffect(() => {
    getPenaltyTypes().then((types) =>
      setPenaltyTypes(types.map((t) => t.name))
    );
  }, []);

  const handleAddPenaltyType = async () => {
    if (!newPenaltyType.trim()) return;
    try {
      const result = await addPenaltyType(newPenaltyType);
      setPenaltyTypes((prev) => Array.from(new Set([...prev, result.name])));
      setNewPenaltyType("");
    } catch (err) {
      console.error("Failed to add penalty type:", err);
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

  const onSubmit = async (data: z.infer<typeof penaltyFormSchema>) => {
    try {
      console.log("Submitting penalty:", data);
      formAction(data);
      setIsModalOpen(false);
      form.reset();
      setSelectedMember(null);
    } catch (error) {
      console.error("Error creating penalty:", error);
    }
  };
  useEffect(() => {
    if (state.success) {
      toast.success(`peanlty has been created`);
      router.push("/penalty/manage");
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
                Member
              </th>
              {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Penalty Type
              </th> */}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reason
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {penalties.map((penalty) => (
              <tr key={penalty.id}>
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
                <td className="px-6 py-4 whitespace-nowrap">
                  {!penalty.is_paid && !penalty.waived && (
                    <button
                      onClick={() => {
                        setSelectedPenalty(penalty);
                        setIsWaiveModalOpen(true);
                      }}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Waive
                    </button>
                  )}
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
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                {/* Member Search */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium">
                    Search Member
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search by name, ID or phone"
                      value={searchTerm}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="w-full p-2 border rounded"
                    />
                    <span className="absolute right-3 top-3 text-gray-400">
                      🔍
                    </span>
                  </div>
                  {searchTerm && (
                    <div className="border rounded-lg max-h-60 overflow-y-auto">
                      {filteredMembers.length > 0 ? (
                        filteredMembers.map((member) => (
                          <div
                            key={member.id}
                            className={`p-2 hover:bg-gray-100 cursor-pointer ${
                              selectedMember?.id === member.id
                                ? "bg-blue-50"
                                : ""
                            }`}
                            onClick={() => handleMemberSelect(member)}
                          >
                            {member.first_name} {member.second_name}{" "}
                            {member.last_name} -{" "}
                            {member.id_number || member.phone_number}
                          </div>
                        ))
                      ) : (
                        <div className="p-2 text-gray-500">
                          No members found
                        </div>
                      )}
                    </div>
                  )}
                  {selectedMember && (
                    <div className="p-2 bg-green-50 rounded-lg">
                      Selected: {selectedMember.first_name}{" "}
                      {selectedMember.second_name} {selectedMember.last_name}
                    </div>
                  )}
                  {form.formState.errors.member_id && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.member_id.message}
                    </p>
                  )}
                </div>

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

                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      placeholder="Add new type"
                      value={newPenaltyType}
                      onChange={(e) => setNewPenaltyType(e.target.value)}
                      className="flex-1 p-2 border rounded"
                    />
                    <button
                      type="button"
                      onClick={handleAddPenaltyType}
                      className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Reason */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Reason</label>
                  <input
                    type="text"
                    placeholder="Enter reason for penalty"
                    {...form.register("reason")}
                    className="w-full p-2 border rounded"
                  />
                  {form.formState.errors.reason && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.reason.message}
                    </p>
                  )}
                </div>

                {/* Amount */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Amount</label>
                  <input
                    type="number"
                    placeholder="Enter penalty amount"
                    {...form.register("amount", { valueAsNumber: true })}
                    className="w-full p-2 border rounded"
                  />
                  {form.formState.errors.amount && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.amount.message}
                    </p>
                  )}
                </div>

                {/* Missed Month */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium">
                    Missed Month
                  </label>
                  <input
                    type="month"
                    {...form.register("missed_month", {
                      setValueAs: (value) =>
                        value ? new Date(value + "-01") : new Date(),
                    })}
                    className="w-full p-2 border rounded"
                  />
                  {form.formState.errors.missed_month && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.missed_month.message}
                    </p>
                  )}
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
                    Cancel
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
                  onClick={() => {
                    // Here you would call your API to waive the penalty
                    // For example: waivePenalty(selectedPenalty.id);
                    toast.success(
                      `Penalty waived for ${selectedPenalty.member.first_name}`
                    );
                    setIsWaiveModalOpen(false);
                    // You might want to refresh the data here
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

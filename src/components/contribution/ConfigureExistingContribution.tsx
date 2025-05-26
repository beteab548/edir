// components/ConfigureExistingContribution.tsx
"use client";

import { SubmitHandler } from "react-hook-form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ContributionSchema } from "../../lib/formValidationSchemas";
import InputField from "../InputField";
import { useState } from "react";
import { z } from "zod";
import { toast } from "react-toastify";
import { updateContribution } from "../../lib/actions";
import { useRouter } from "next/navigation";
import SelectableMembersList from "../SelectableMembersList";
import { Member } from "@prisma/client";

type ContributionType = {
  id: number;
  name: string;
  amount: number;
  is_active: boolean;
  is_for_all: boolean;
  created_at: Date;
  start_date: Date | null;
  end_date: Date | null;
};

type ConfigureExistingContributionProps = {
  contributionTypes: ContributionType[];
  members: Member[];
};

export default function ConfigureExistingContribution({
  contributionTypes,
  members,
}: ConfigureExistingContributionProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [showMemberSelection, setShowMemberSelection] = useState(false);
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);
  const router = useRouter();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
    watch,
  } = useForm<z.input<typeof ContributionSchema>>({
    resolver: zodResolver(ContributionSchema),
  });
  const isForAll = watch("is_for_all");
  const handleEdit = (contribution: ContributionType) => {
    setEditingId(contribution.id);
    setSelectedMemberIds([]); // Reset selected members when editing a new contribution
    reset({
      amount: contribution.amount,
      type_name: contribution.name,
      start_date: contribution.start_date?.toISOString().split("T")[0] || "",
      end_date: contribution.end_date?.toISOString().split("T")[0] || "",
      is_active: contribution.is_active,
      is_for_all: contribution.is_for_all,
    });
  };
  const onSubmit: SubmitHandler<z.input<typeof ContributionSchema>> = async (data) => {
    if (!editingId) return;
    setLoading(true);
// console.log(selectedMemberIds);
    const formData = {
      id: editingId,
      amount: Number(data.amount),
      type_name: data.type_name,
      start_date: data.start_date ? new Date(data.start_date) : new Date(),
      end_date: data.end_date ? new Date(data.end_date) : new Date(),
      is_active: data.is_active,
      is_for_all: data.is_for_all,
      member_ids: data.is_for_all ? [] : selectedMemberIds,
    };
console.log(formData);
    try {
      const result = await updateContribution(
        { success: false, error: false },
        formData
      );

      if (result.success) {
        router.refresh();
        toast.success("Contribution updated!");
      } else {
        toast.error("Something went wrong");
      }
    } catch (e) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
      setEditingId(null);
    }
  };

  return (
    <div className="bg-base-100 p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-6">Configure Existing Contributions</h2>
      
      {showMemberSelection ? (
        <SelectableMembersList
          members={members}
          initialSelected={selectedMemberIds}
          onSaveSelection={(ids) => {
            setSelectedMemberIds(ids);
            setShowMemberSelection(false);
          }}
          onCancel={() => setShowMemberSelection(false)}
        />
      ) : (
        <div className="space-y-6">
          {contributionTypes.map((contribution) => (
            <div 
              key={contribution.id} 
              className="border p-4 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {editingId === contribution.id ? (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="flex flex-wrap gap-4 items-end">
                    <InputField
                      label="Contribution Name"
                      name="type_name"
                      register={register}
                      error={errors.type_name}
                      defaultValue={contribution.name}
                    />
                    
                    <InputField
                      label="Amount"
                      name="amount"
                      type="number"
                      register={register}
                      error={errors.amount}
                      defaultValue={contribution.amount.toString()}
                      inputProps={{
                        step: "0.01",
                        onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                          setValue("amount", parseFloat(e.target.value) || 0);
                        },
                      }}
                    />

                    <div className="form-control">
                      <label className="label cursor-pointer gap-2">
                        <span className="label-text">Active</span>
                        <input
                          type="checkbox"
                          className="toggle toggle-primary"
                          {...register("is_active")}
                          defaultChecked={contribution.is_active}
                        />
                      </label>
                    </div>

                    <div className="form-control">
                      <label className="label cursor-pointer gap-2">
                        <span className="label-text">For All Members</span>
                        <input
                          type="checkbox"
                          className="toggle toggle-primary"
                          {...register("is_for_all")}
                          defaultChecked={contribution.is_for_all}
                        />
                      </label>
                    </div>

                    {!isForAll && (
                      <div className="w-full">
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={() => setShowMemberSelection(true)}
                        >
                          {selectedMemberIds.length > 0
                            ? `${selectedMemberIds.length} members selected`
                            : "Select Members"}
                        </button>
                      </div>
                    )}

                    <InputField
                      label="Start Date"
                      name="start_date"
                      type="date"
                      register={register}
                      error={errors.start_date}
                      defaultValue={
                        contribution.start_date?.toISOString().split("T")[0] || ""
                      }
                    />

                    <InputField
                      label="End Date"
                      name="end_date"
                      type="date"
                      register={register}
                      error={errors.end_date}
                      defaultValue={
                        contribution.end_date?.toISOString().split("T")[0] || ""
                      }
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="btn btn-primary btn-sm"
                      disabled={loading}
                    >
                      {loading ? "Saving..." : "Save"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{contribution.name}</h3>
                    <div className="text-sm text-gray-600">
                      <span>Amount: {contribution.amount}</span> | 
                      <span> Status: {contribution.is_active ? "Active" : "Inactive"}</span> | 
                      <span> Scope: {contribution.is_for_all ? "All Members" : "Selected Members"}</span> | 
                      <span> Start: {contribution.start_date?.toLocaleDateString() || "N/A"}</span> | 
                      <span> End: {contribution.end_date?.toLocaleDateString() || "N/A"}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleEdit(contribution)}
                    className="btn btn-outline btn-sm"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
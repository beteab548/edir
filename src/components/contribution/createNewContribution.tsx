"use client";

import { useForm } from "react-hook-form";
import { useState } from "react";
import InputField from "../InputField";
import SelectableMembersList from "../SelectableMembersList";
import { toast } from "react-toastify";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createContributionType } from "@/lib/actions"; // You need to implement this action
import { Member } from "@prisma/client";
import { useRouter } from "next/navigation";

const ContributionTypeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  amount: z.number().min(0.01, "Amount must be positive"),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().min(1, "End date is required"),
  is_for_all: z.boolean(),
  member_ids: z.array(z.number()).optional(),
});

type ContributionTypeForm = z.infer<typeof ContributionTypeSchema>;

export default function CreateNewContribution({
  members,
}: {
  members: Member[];
}) {
  const [showMemberSelection, setShowMemberSelection] = useState(false);
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);
const router=useRouter() 
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ContributionTypeForm>({
    resolver: zodResolver(ContributionTypeSchema),
    defaultValues: {
      is_for_all: true,
      member_ids: [],
    },
  });
  const isForAll = watch("is_for_all");
  const onSubmit = async (data: ContributionTypeForm) => {
    try {
      const payload = {
        ...data,
        amount: Number(data.amount),
        member_ids: data.is_for_all ? [] : selectedMemberIds,
        start_date: new Date(data.start_date),
        end_date: new Date(data.end_date),
      };
      const result = await createContributionType(payload);
      if (result.success) {
        toast.success("Contribution type created!");
        reset();
        setSelectedMemberIds([]);
        router.refresh()
      } else {
        toast.error("Failed to create contribution type");
      }
    } catch (err) {
      toast.error("Something went wrong");
    }
  };

  return (
<div className="bg-base-100 p-6 rounded-lg shadow-md w-full">
      <h2 className="text-xl font-semibold mb-6">
        Create New Contribution Type
      </h2>
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
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-wrap gap-4 items-end ">
          <InputField
            label="Name"
            name="name"
            register={register}
            error={errors.name}
          />
          <InputField
            label="Amount"
            name="amount"
            type="number"
            register={register}
            error={errors.amount}
            inputProps={{
              step: "0.01",
              // This will convert the input value to a number
              ...register("amount", {
                setValueAs: (v) => (v === "" ? undefined : Number(v)),
              }),
            }}
          />
          <InputField
            label="Start Date"
            name="start_date"
            type="date"
            register={register}
            error={errors.start_date}
          />
          <InputField
            label="End Date"
            name="end_date"
            type="date"
            register={register}
            error={errors.end_date}
          />
          <div className="form-control">
            <label className="label cursor-pointer gap-2">
              <span className="label-text">For All Members</span>
              <input
                type="checkbox"
                className="toggle toggle-primary"
                {...register("is_for_all")}
                checked={isForAll}
                onChange={(e) => {
                  setValue("is_for_all", e.target.checked);
                  if (e.target.checked) setSelectedMemberIds([]);
                }}
              />
            </label>
          </div>
          {!isForAll && (
            <div>
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
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Create"}
          </button>
        </form>
      )}
    </div>
  );
}

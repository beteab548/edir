"use client";

import { useForm } from "react-hook-form";
import { useState } from "react";
import InputField from "../InputField";
import SelectableMembersList from "../SelectableMembersList";
import { toast } from "react-toastify";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { createContributionType } from "@/lib/actions";
import { Member } from "@prisma/client";
import { useRouter } from "next/navigation";
import { ContributionTypeSchema } from "@/lib/formValidationSchemas";

type ContributionTypeForm = z.infer<typeof ContributionTypeSchema>;

export default function CreateNewContribution({
  members,
}: {
  members: Member[];
}) {
  const [showMemberSelection, setShowMemberSelection] = useState(false);
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);
  const router = useRouter();
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
      is_active: true,
      mode: "Recurring",
      member_ids: [],
      penalty_amount: 0,
    },
  });

  const isForAll = watch("is_for_all");
  const isActive = watch("is_active");
  const mode = watch("mode");

  const onSubmit = async (data: ContributionTypeForm) => {
    try {
      const payload = {
        ...data,
        amount: Number(data.amount),
        member_ids: data.is_for_all ? [] : selectedMemberIds,
        mode,
        start_date:
          data.mode === "Recurring" || data.mode === "OpenEndedRecurring"
            ? new Date(data.start_date!)
            : undefined,
        end_date:
          data.mode === "Recurring"
            ? new Date(data.end_date!)
            : data.mode === "OpenEndedRecurring"
            ? null
            : undefined,
        period_months:
          data.mode === "OneTimeWindow"
            ? Number(data.period_months)
            : undefined,
        penalty_amount: data.penalty_amount,
      };

      const result = await createContributionType(payload);
      if (result.success) {
        toast.success("Contribution type created!");
        reset();
        setSelectedMemberIds([]);

        router.refresh();
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
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-wrap gap-4 items-end"
        >
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
              ...register("amount", {
                setValueAs: (v) => (v === "" ? undefined : Number(v)),
              }),
            }}
          />
          <InputField
            label="Penalty Amount"
            name="penalty_amount"
            type="number"
            register={register}
            error={errors.penalty_amount}
            inputProps={{
              step: "0.01",
              ...register("penalty_amount", {
                setValueAs: (v) => (v === "" ? undefined : Number(v)),
              }),
            }}
          />

          <div className="form-control">
            <label className="label">
              <span className="label-text">Mode</span>
            </label>
            <select
              {...register("mode")}
              className="select select-bordered"
              defaultValue="Recurring"
            >
              <option value="Recurring">Recurring</option>
              <option value="OpenEndedRecurring">
                Open Ended Recurring (No End Date)
              </option>
              <option value="OneTimeWindow">One-Time (Fixed Months)</option>
            </select>
          </div>

          {mode === "Recurring" && (
            <>
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
            </>
          )}
          {mode === "OpenEndedRecurring" && (
            <InputField
              label="Start Date"
              name="start_date"
              type="date"
              register={register}
              error={errors.start_date}
            />
          )}
          {mode === "OneTimeWindow" && (
            <InputField
              label="Number of Months"
              name="period_months"
              type="number"
              register={register}
              error={errors.period_months}
              inputProps={{
                min: 1,
                step: 1,
                ...register("period_months", {
                  setValueAs: (v) => (v === "" ? undefined : Number(v)),
                }),
              }}
            />
          )}

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

          <div className="form-control">
            <label className="label cursor-pointer gap-2">
              <span className="label-text">Active</span>
              <input
                type="checkbox"
                className="toggle toggle-primary"
                {...register("is_active")}
                checked={isActive}
                onChange={(e) => setValue("is_active", e.target.checked)}
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
          {selectedMemberIds.length > 0 && (
            <ul className="text-sm mt-2">
              {members
                .filter((m) => selectedMemberIds.includes(m.id))
                .map((m) => (
                  <li key={m.id}>{m.first_name}</li>
                ))}
            </ul>
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

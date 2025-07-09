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
import { ContributionTypeSchema } from "@/lib/formValidationSchemas";
import ModalPortal from "../ModalPortal";
import { useDataChange } from "../DataChangeContext";
import { useRouter } from "next/navigation";

type ContributionTypeForm = z.infer<typeof ContributionTypeSchema>;

export default function CreateNewContribution({
  members,
  setRevalidate,
  onClose,
}: {
  members: Member[];
  setRevalidate: React.Dispatch<React.SetStateAction<boolean>>;
  onClose: () => void;
}) {
  const [showMemberSelection, setShowMemberSelection] = useState(false);
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);
  const { setDataChanged } = useDataChange();
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
      period_months: undefined,
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
        penalty_amount:
          data.mode !== "OneTimeWindow" ? data.penalty_amount : undefined,
      };
      console.log("payload", payload);
      const result = await createContributionType(payload);

      if (result.success) {
        toast.success("Contribution type created!");
        setRevalidate((prev) => !prev);
        reset();
        setSelectedMemberIds([]);
        setDataChanged(true);
        onClose();
        return router.push("/contribution");
      } else {
        toast.error("Failed to create contribution type");
      }
    } catch (err) {
      toast.error("Something went wrong");
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 bg-black backdrop-blur-sm  bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white p-8 my-24  rounded-xl shadow-lg w-[800px] mx-auto border border-gray-100 relative h-[550px] overflow-y-auto custom-scrollbar">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-lg"
            aria-label="Close"
          >
            ✕
          </button>

          <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-2 border-b border-gray-200">
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
              onSubmit={handleSubmit(onSubmit, (errors) => {
                console.error("Validation Errors:", errors);
              })}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField
                  label="Name"
                  name="type_name"
                  register={register}
                  error={errors.type_name}
                  containerClass="bg-gray-50 p-4 rounded-lg"
                />

                <InputField
                  label="Amount"
                  name="amount"
                  type="number"
                  register={register}
                  error={errors.amount}
                  containerClass="bg-gray-50 p-4 rounded-lg"
                  inputProps={{
                    step: "0.01",
                    ...register("amount", {
                      setValueAs: (v) => (v === "" ? undefined : Number(v)),
                    }),
                  }}
                />

                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contribution Mode
                  </label>
                  <select
                    {...register("mode")}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="Recurring">Recurring</option>
                    <option value="OpenEndedRecurring">
                      Open Ended Recurring
                    </option>
                    <option value="OneTimeWindow">
                      One-Time (Fixed Months)
                    </option>
                  </select>
                </div>
                {mode !== "OneTimeWindow" && (
                  <InputField
                    label="Penalty Amount"
                    name="penalty_amount"
                    type="number"
                    register={register}
                    error={errors.penalty_amount}
                    containerClass="bg-gray-50 p-4 rounded-lg"
                    inputProps={{
                      step: "0.01",
                      ...register("penalty_amount", {
                        setValueAs: (v) => (v === "" ? undefined : Number(v)),
                      }),
                    }}
                  />
                )}

                {mode === "Recurring" && (
                  <>
                    <InputField
                      label="Start Date"
                      name="start_date"
                      type="date"
                      register={register}
                      error={errors.start_date}
                      containerClass="bg-gray-50 p-4 rounded-lg"
                      defaultValue={new Date().toISOString().split("T")[0]}
                    />
                    <InputField
                      label="End Date"
                      name="end_date"
                      type="date"
                      register={register}
                      error={errors.end_date}
                      containerClass="bg-gray-50 p-4 rounded-lg"
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
                    containerClass="bg-gray-50 p-4 rounded-lg"
                  />
                )}

                {mode === "OneTimeWindow" && (
                  <InputField
                    label="Number of Months"
                    name="period_months"
                    type="number"
                    register={register}
                    error={errors.period_months}
                    containerClass="bg-gray-50 p-4 rounded-lg"
                    inputProps={{
                      min: 1,
                      step: 1,
                      ...register("period_months", {
                        setValueAs: (v) => (v === "" ? undefined : Number(v)),
                      }),
                    }}
                  />
                )}

                <div className="bg-gray-50 p-4 rounded-lg flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    For All Members
                  </label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      {...register("is_for_all")}
                      checked={isForAll}
                      onChange={(e) => {
                        setValue("is_for_all", e.target.checked);
                        if (e.target.checked) setSelectedMemberIds([]);
                      }}
                    />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
                  </label>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    Active
                  </label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      {...register("is_active")}
                      checked={isActive}
                      onChange={(e) => setValue("is_active", e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
                  </label>
                </div>

                {!isForAll && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <button
                      type="button"
                      className="w-full px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                      onClick={() => setShowMemberSelection(true)}
                    >
                      {selectedMemberIds.length > 0
                        ? `${selectedMemberIds.length} members selected`
                        : "Select Members"}
                    </button>
                    {selectedMemberIds.length > 0 && (
                      <div className="mt-3 bg-white p-3 rounded-md border border-gray-200">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                          Selected Members
                        </h4>
                        <ul className="text-sm text-gray-600 space-y-1 max-h-40 overflow-y-auto">
                          {members
                            .filter((m) => selectedMemberIds.includes(m.id))
                            .map((m) => (
                              <li key={m.id} className="flex items-center">
                                <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                                {m.first_name} {m.last_name}
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => reset()}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Reset
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
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
                      Creating...
                    </>
                  ) : (
                    "Create Contribution Type"
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </ModalPortal>
  );
}

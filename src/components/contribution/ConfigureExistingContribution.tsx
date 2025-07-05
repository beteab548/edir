"use client";
import { SubmitHandler } from "react-hook-form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ContributionSchema } from "../../lib/formValidationSchemas";
import InputField from "../InputField";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "react-toastify";
import { deleteContributionType, updateContribution } from "../../lib/actions";
import SelectableMembersList from "../SelectableMembersList";
import { Member } from "@prisma/client";
import Decimal from "decimal.js";
import useSWR from "swr";
import { useRouter } from "next/navigation";

type ContributionType = {
  id: number;
  name: string;
  amount: Decimal;
  is_active: boolean;
  is_for_all: boolean;
  created_at: Date | string;
  start_date: Date | string | null;
  end_date: Date | string | null;
  mode: "Recurring" | "OneTimeWindow" | "OpenEndedRecurring";
  penalty_amount: Decimal | null;
  period_months: number | null;
  months_before_inactivation?: number;
};
type ApiResponse = {
  contributionTypes: ContributionType[];
  members: Member[];
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ConfigureExistingContribution({
  revalidate,
}: {
  revalidate: boolean;
}) {
  const {
    data: apiData,
    mutate: mutateData,
    isLoading,
  } = useSWR<ApiResponse>("/api/contributions/contributionTypes", fetcher);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [showMemberSelection, setShowMemberSelection] = useState(false);
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);
  const [existingMemberIds, setExistingMemberIds] = useState<number[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [isForAllLocal, setIsForAllLocal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toDelete, setToDelete] = useState<ContributionType | null>(null);
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
  console.log("apidata:", apiData);
  const watchIsForAll = watch("is_for_all");
  const watchMode = watch("mode");
  const contributionTypes = apiData?.contributionTypes || [];
  const members = apiData?.members || [];

  const handleEdit = (contribution: ContributionType) => {
    setEditingId(contribution.id);
    setIsForAllLocal(contribution.is_for_all);
    setSelectedMemberIds([]);
    reset({
      amount:
        contribution.amount instanceof Decimal
          ? contribution.amount.toNumber()
          : Number(contribution.amount),
      type_name: contribution.name,
      start_date: contribution.start_date
        ? formatDateForInput(contribution.start_date)
        : "",
      end_date: contribution.end_date
        ? formatDateForInput(contribution.end_date)
        : "",
      is_active: contribution.is_active,
      is_for_all: contribution.is_for_all,
      mode: contribution.mode || "Recurring",
      penalty_amount:
        contribution.penalty_amount instanceof Decimal
          ? contribution.penalty_amount.toNumber()
          : Number(contribution.penalty_amount ?? 0),
      period_months: contribution.period_months ?? undefined,
      months_before_inactivation: contribution.months_before_inactivation ?? 1,
    });
  };
  function formatDateForInput(date: Date | string | null): string {
    if (!date) return "";
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toISOString().split("T")[0];
  }
  function formatDateForDisplay(date: Date | string | null): string {
    if (!date) return "N/A";
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString();
  }
  const onSubmit: SubmitHandler<z.input<typeof ContributionSchema>> = async (
    data
  ) => {
    if (!editingId) return;
    setLoading(true);

    try {
      const formData = {
        id: editingId,
        amount: Number(data.amount),
        type_name: data.type_name,
        start_date: data.start_date ? new Date(data.start_date) : new Date(),
        end_date:
          data.mode === "Recurring" && data.end_date
            ? new Date(data.end_date)
            : null,
        is_active: data.is_active,
        is_for_all: data.is_for_all,
        member_ids: data.is_for_all ? [] : selectedMemberIds,
        mode: data.mode,
        penalty_amount: Number(data.penalty_amount),
        period_months:
          data.mode === "OneTimeWindow" ? Number(data.period_months) : null,
        months_before_inactivation:
          data.mode === "OneTimeWindow"
            ? Number(data.months_before_inactivation)
            : undefined,
      };

      await updateContribution({ success: false, error: false }, formData);
      mutateData();
      router.push("/contribution");
      toast.success("Contribution updated!");
      setEditingId(null);
    } catch (e) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    mutateData();
  }, [revalidate]);
  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteContributionType(toDelete.id);
      router.push("/contribution");
      mutateData();
      toast.success("Contribution type deleted!");
    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      setShowDeleteModal(false);
      setToDelete(null);
    }
  };

  const onError = (formErrors: typeof errors) => {
    console.error("Validation errors:", formErrors);
  };

  useEffect(() => {
    if (watchMode === "OpenEndedRecurring") {
      setValue("end_date", "");
      setValue("period_months", undefined);
    } else if (watchMode === "OneTimeWindow") {
      setValue("end_date", "");
    }
  }, [watchMode, setValue]);

  useEffect(() => {
    const fetchExistingMembers = async () => {
      try {
        setIsLoadingMembers(true);
        if (editingId === null) return;

        const response = await fetch(
          `/api/contributions/members/search?id=${editingId}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch existing members");
        }
        const memberIds = await response.json();
        setExistingMemberIds(memberIds);
        setSelectedMemberIds(memberIds);
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setIsLoadingMembers(false);
      }
    };

    fetchExistingMembers();
  }, [editingId]);
  return (
    <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-2 border-b border-gray-200">
        Configure Existing Contributions
      </h2>
      {showDeleteModal && toDelete && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40">
          <div className="bg-white rounded-xl p-6 shadow-xl max-w-md w-full">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Delete "{toDelete.name}"?
              </h3>
              <p className="text-gray-600 mb-6">
                This will permanently remove the contribution type and cannot be
                undone.
              </p>
            </div>
            <div className="flex justify-center gap-3">
              <button
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                onClick={() => {
                  setShowDeleteModal(false);
                  setToDelete(null);
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                onClick={handleDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {showMemberSelection ? (
        <SelectableMembersList
          members={members}
          initialSelected={selectedMemberIds}
          isLoadingExisting={isLoading}
          onSaveSelection={(ids) => {
            setSelectedMemberIds(ids);
            setShowMemberSelection(false);
          }}
          onCancel={() => setShowMemberSelection(false)}
        />
      ) : (
        <div className="space-y-4">
          {contributionTypes.map((contribution) => (
            <div
              key={contribution.id}
              className={`border border-gray-200 p-5 rounded-lg transition-all ${
                editingId === contribution.id ? "bg-gray-50" : "bg-white"
              }`}
            >
              {editingId === contribution.id ? (
                <form
                  onSubmit={handleSubmit(onSubmit, onError)}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField
                      label="Contribution Name"
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
                        onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                          setValue("amount", parseFloat(e.target.value) || 0);
                        },
                      }}
                    />

                    {watchMode === "OneTimeWindow" ? (
                      <InputField
                        label="Months Before Inactivation"
                        name="months_before_inactivation"
                        type="number"
                        register={register}
                        error={errors.months_before_inactivation}
                        containerClass="bg-gray-50 p-4 rounded-lg"
                        inputProps={{
                          min: 1,
                          step: 1,
                          ...register("months_before_inactivation", {
                            setValueAs: (v) =>
                              v === "" ? undefined : Number(v),
                          }),
                        }}
                      />
                    ) : (
                      <InputField
                        label="Penalty Amount"
                        name="penalty_amount"
                        type="number"
                        register={register}
                        error={errors.penalty_amount}
                        containerClass="bg-gray-50 p-4 rounded-lg"
                        inputProps={{
                          step: "0.01",
                          onChange: (
                            e: React.ChangeEvent<HTMLInputElement>
                          ) => {
                            setValue(
                              "penalty_amount",
                              parseFloat(e.target.value)
                            );
                          },
                        }}
                      />
                    )}

                    {watchMode === "OneTimeWindow" && (
                      <InputField
                        label="Period Months"
                        name="period_months"
                        type="number"
                        register={register}
                        error={errors.period_months}
                        containerClass="bg-gray-50 p-4 rounded-lg"
                        inputProps={{
                          min: 1,
                          step: "1",
                          onChange: (
                            e: React.ChangeEvent<HTMLInputElement>
                          ) => {
                            setValue("period_months", parseInt(e.target.value));
                          },
                        }}
                      />
                    )}

                    {(watchMode === "Recurring" ||
                      watchMode === "OpenEndedRecurring") && (
                      <>
                        <InputField
                          label="Start Date"
                          name="start_date"
                          type="date"
                          register={register}
                          error={errors.start_date}
                          containerClass="bg-gray-50 p-4 rounded-lg"
                        />
                        {watchMode === "Recurring" && (
                          <InputField
                            label="End Date"
                            name="end_date"
                            type="date"
                            register={register}
                            error={errors.end_date}
                            containerClass="bg-gray-50 p-4 rounded-lg"
                          />
                        )}
                      </>
                    )}

                    <div className="bg-gray-50 p-4 rounded-lg flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">
                        Active
                      </label>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          {...register("is_active")}
                          defaultChecked={contribution.is_active}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">
                        For All Members
                      </label>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={isForAllLocal}
                          onChange={(e) => {
                            setIsForAllLocal(e.target.checked);
                            setValue("is_for_all", e.target.checked);
                            if (e.target.checked) {
                              setSelectedMemberIds([]);
                            }
                          }}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    {!isForAllLocal && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <button
                          type="button"
                          className="w-full px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                      disabled={loading}
                    >
                      {loading ? (
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
                          Saving...
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-gray-800">
                      {contribution.name}
                    </h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                        Amount: {Number(contribution.amount)}
                      </div>
                      <div className="flex items-center">
                        <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                        Status:{" "}
                        <span
                          className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                            contribution.is_active
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {contribution.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                        Scope:{" "}
                        {contribution.is_for_all
                          ? "All Members"
                          : "Selected Members"}
                      </div>
                      <div className="flex items-center">
                        <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                        Mode: {contribution.mode}
                      </div>
                      {contribution.mode === "OneTimeWindow" ? (
                        <div className="flex items-center">
                          <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                          Months Before Inactivation:{" "}
                          {contribution.months_before_inactivation ?? "N/A"}
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                          Penalty: {Number(contribution.penalty_amount)}
                        </div>
                      )}
                      <div className="flex items-center">
                        <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                        Start:{" "}
                        {contribution.start_date
                          ? typeof contribution.start_date === "string"
                            ? contribution.start_date
                            : contribution.start_date.toLocaleDateString()
                          : "N/A"}
                      </div>
                      {contribution.mode !== "OneTimeWindow" &&
                        contribution.mode !== "OpenEndedRecurring" && (
                          <div className="flex items-center">
                            <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                            End:{" "}
                            {contribution.end_date?.toLocaleString() || "N/A"}
                          </div>
                        )}
                      {contribution.mode === "OneTimeWindow" && (
                        <div className="flex items-center">
                          <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                          Duration: {contribution.period_months ?? "N/A"} months
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(contribution)}
                      className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        setShowDeleteModal(true);
                        setToDelete(contribution);
                      }}
                      className="px-3 py-1.5 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

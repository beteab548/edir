"use client";

import { SubmitHandler, useFormState } from "react-hook-form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ContributionSchema,
  ContributionType as ContributionTypeSchema,
} from "../../lib/formValidationSchemas";
import InputField from "../InputField";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "react-toastify";
import { updateContribution } from "../../lib/actions"; // import CreateNewContribution from "./configure-new-contribution";
import { useRouter } from "next/navigation";

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
};

export default function ConfigureExistingContribution({
  contributionTypes,
}: ConfigureExistingContributionProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  // const router = useRouter();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
  } = useForm<z.input<typeof ContributionSchema>>({
    resolver: zodResolver(ContributionSchema),
  });
  const handleEdit = (contribution: ContributionType) => {
    setEditingId(contribution.id);
    reset({
      amount: contribution.amount,
      type_name: contribution.name,
      start_date: contribution.start_date?.toISOString().split("T")[0] || "",
      end_date: contribution.end_date?.toISOString().split("T")[0] || "",
    });
  };
    const router = useRouter();
  
  const onSubmit: SubmitHandler<z.input<typeof ContributionSchema>> = async (
    data
  ) => {
    if (!editingId) return;
    setLoading(true);
    // Convert string dates to Date objects and ensure amount is number
    // Fallback to current date if start_date or end_date is not provided, to satisfy type requirements
    const formData = {
      id: editingId,
      amount: Number(data.amount),
      type_name: data.type_name,
      start_date: data.start_date ? new Date(data.start_date) : new Date(),
      end_date: data.end_date ? new Date(data.end_date) : new Date(),
    };
    try {
      const result = await updateContribution(
        {
          success: false,
          error: false,
        },
        formData
      );
      console.log(result);

      if (result.success) {
        router.refresh()
        toast("contribution updated!");
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
      <h2 className="text-xl font-semibold mb-6">
        Configure Existing Contributions
      </h2>

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
                    label=""
                    name="id"
                    type="hidden"
                    register={register}
                    defaultValue={contribution.id.toString()}
                    hidden
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
                        // Ensure numeric value is stored
                        setValue("amount", parseFloat(e.target.value) || 0);
                      },
                    }}
                  />

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
                  <button type="submit" className="btn btn-primary btn-sm">
                    Save
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
                    <span>
                      {" "}
                      Start:{" "}
                      {contribution.start_date?.toLocaleDateString() || "N/A"}
                    </span>{" "}
                    |
                    <span>
                      {" "}
                      End:{" "}
                      {contribution.end_date?.toLocaleDateString() || "N/A"}
                    </span>
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
    </div>
  );
}

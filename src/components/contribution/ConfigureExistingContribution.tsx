"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFormState, useFormStatus } from "react-dom";
import InputField from "../InputField";
import { ContributionSchema } from "../../lib/formValidationSchemas";
import { ContributionType as ContributionSchemaType } from "../../lib/formValidationSchemas";
import { ContributionType } from "@prisma/client";

type ConfigureExistingContributionProps = {
  contributionTypes: ContributionType[];
  defaultType?: string;
  formAction: (prevState: any, formData: ContributionType) => Promise<any>;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="btn btn-primary min-w-[100px]"
      disabled={pending}
      aria-disabled={pending}
    >
      {pending ? <span className="loading loading-spinner"></span> : "Apply"}
    </button>
  );
}

export default function ConfigureExistingContribution({
  contributionTypes,
  defaultType = Object.keys(contributionTypes)[0],
  formAction,
}: ConfigureExistingContributionProps) {
  const [members, setMembers] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showMemberList, setShowMemberList] = useState<boolean>(false);
  const [state, formActionWithState] = useFormState(formAction, {
    error: null,
    success: false,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    control,
  } = useForm<ContributionSchemaType>({
    resolver: zodResolver(ContributionSchema),
    defaultValues: {
      type_name: defaultType,
      ...contributionTypes[defaultType],
    },
  });

  const typeName = watch("type_name");

  // Update form fields when contribution type changes
  useEffect(() => {
    const contributionData = contributionTypes[typeName];
    setValue("amount", contributionData.amount);
    setValue("start_date", contributionData.start_date);
    setValue("end_date", contributionData.end_date);
  }, [typeName, setValue, contributionTypes]);

  const getTheSelectedMembers = (
    selectedMember: number[],
    AllSelected: boolean
  ) => {
    setSelectAll(AllSelected);
    setMembers(selectedMember);
  };

  const onSubmit = async (data: ContributionSchemaType) => {
    const formData = new FormData();

    // Append all form fields
    formData.append("type_name", data.type_name);
    formData.append("amount", data.amount.toString());
    formData.append("start_date", data.start_date.toISOString());
    formData.append("end_date", data.end_date.toISOString());

    // Append members data
    formData.append("members", JSON.stringify(members));
    formData.append("selectAll", String(selectAll));

    // Call the form action
    await formActionWithState(formData);
  };

  return (
    <div className="card bg-base-100 shadow-xl w-full">
      <div className="card-body">
        <h2 className="card-title text-2xl my-2">
          Configure Existing Contribution Type
        </h2>

        <div className="flex justify-between items-center mb-6">
          <div className="form-control w-full max-w-xs">
            <label className="label">
              <span className="label-text">Select Contribution Type</span>
            </label>
            <select
              className="select select-bordered"
              {...register("type_name")}
            >
              {Object.keys(contributionTypes).map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            {errors.type_name && (
              <span className="text-red-500 text-xs mt-1">
                {errors.type_name.message}
              </span>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mb-8">
          <div className="flex flex-wrap gap-4 items-end">
            <InputField
              label="Amount"
              name="amount"
              type="number"
              register={register}
              error={errors.amount}
              inputProps={{
                placeholder: "Enter amount",
                step: "0.01",
              }}
            />

            <InputField
              label="Start Date"
              name="start_date"
              type="date"
              register={register}
              error={errors.start_date}
              inputProps={{
                max: watch("end_date")?.toISOString().split("T")[0],
              }}
            />

            <InputField
              label="End Date"
              name="end_date"
              type="date"
              register={register}
              error={errors.end_date}
              inputProps={{
                min: watch("start_date")?.toISOString().split("T")[0],
              }}
            />

            <div className="flex flex-wrap gap-4 items-end">
              <button
                type="button"
                className="btn btn-secondary min-w-[140px]"
                onClick={() => setShowMemberList((prev) => !prev)}
              >
                Select Members
              </button>
            </div>

            <SubmitButton />
          </div>
        </form>

        {/* {showMemberList && (
          <MembersList 
            contributionPage={true} 
            onSubmit={getTheSelectedMembers}
          />
        )} */}

        {state?.error && (
          <div className="text-red-500 text-sm mt-2">{state.error}</div>
        )}
        {state?.success && (
          <div className="text-green-500 text-sm mt-2">
            Contribution updated successfully!
          </div>
        )}
      </div>
    </div>
  );
}

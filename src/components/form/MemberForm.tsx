"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { memberSchema, MemberSchema } from "@/lib/formValidationSchemas";
import { useFormState } from "react-dom";
import { createMember, updateMember } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

const tabs = ["Member Info", "Address", "Relatives"];

const MemberForm = ({
  type,
  data,
  setOpen,
}: {
  type: "create" | "update";
  data?: any;
  setOpen: Dispatch<SetStateAction<boolean>>;
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MemberSchema>({
    resolver: zodResolver(memberSchema),
  });

  const [tabIndex, setTabIndex] = useState(0);
  const [state, formAction] = useFormState(
    type === "create" ? createMember : updateMember,
    { success: false, error: false }
  );

  const onSubmit = handleSubmit((data) => {
    formAction(data);
  });

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      toast(`Member has been ${type === "create" ? "created" : "updated"}!`);
      router.refresh();
      setOpen(false);
    }
  }, [state, type, setOpen]);

  return (
    <div>
      <div className="flex gap-4 border-b mb-4">
        {tabs.map((tab, index) => (
          <button
            key={tab}
            className={`pb-2 ${
              tabIndex === index
                ? "border-b-2 border-blue-500 font-medium"
                : "text-gray-500"
            }`}
            onClick={() => setTabIndex(index)}
          >
            {tab}
          </button>
        ))}
      </div>

      <form className="flex flex-col gap-6" onSubmit={onSubmit}>
        {tabIndex === 0 && (
          <div className="flex justify-between flex-wrap gap-4">
            <InputField
              label="First Name"
              name="first_name"
              defaultValue={data?.first_name}
              register={register}
              error={errors.first_name}
            />
            <InputField
              label="Second Name"
              name="second_name"
              defaultValue={data?.second_name}
              register={register}
              error={errors.second_name}
            />
            <InputField
              label="Last Name"
              name="last_name"
              defaultValue={data?.last_name}
              register={register}
              error={errors.last_name}
            />
            <InputField
              label="Birth Date"
              name="birth_date"
              type="date"
              defaultValue={
                data?.birth_date
                  ? new Date(data.birth_date).toISOString().split("T")[0]
                  : ""
              }
              register={register}
              error={errors.birth_date}
            />
            <div className="flex flex-col gap-2 min-w-[200px]">
              <label className="text-xs text-gray-500">Sex</label>
              <select
                {...register("sex")}
                defaultValue={data?.sex}
                className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <InputField
              label="Title"
              name="title"
              defaultValue={data?.title}
              register={register}
              error={errors.title}
            />
            <InputField
              label="Job/Business"
              name="job_business"
              defaultValue={data?.job_business}
              register={register}
              error={errors.job_business}
            />
            <InputField
              label="Profession"
              name="profession"
              defaultValue={data?.profession}
              register={register}
              error={errors.profession}
            />
            <InputField
              label="Joined Date"
              name="joined_date"
              type="date"
              defaultValue={
                data?.joined_date
                  ? new Date(data.joined_date).toISOString().split("T")[0]
                  : ""
              }
              register={register}
              error={errors.joined_date}
            />
            <InputField
              label="End Date"
              name="end_date"
              type="date"
              defaultValue={
                data?.end_date
                  ? new Date(data.end_date).toISOString().split("T")[0]
                  : ""
              }
              register={register}
              error={errors.end_date}
            />
            <div className="flex flex-col gap-2 min-w-[200px]">
              <label className="text-xs text-gray-500">Status</label>
              <select
                {...register("status")}
                defaultValue={data?.status}
                className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
              {errors.status && <p className="text-xs text-red-400"></p>}
            </div>
          </div>
        )}

        {tabIndex === 1 && (
          <div className="flex justify-between flex-wrap gap-4">
            <InputField
              label="ID Number"
              name="id_number"
              defaultValue={data?.id_number}
              register={register}
              error={errors.id_number}
            />
            <InputField
              label="Citizen"
              name="citizen"
              defaultValue={data?.citizen}
              register={register}
              error={errors.citizen}
            />

            <InputField
              label="Phone Number"
              name="phone_number"
              defaultValue={data?.phone_number}
              register={register}
              error={errors.phone_number}
            />
            <InputField
              label="Wereda"
              name="wereda"
              defaultValue={data?.wereda}
              register={register}
              error={errors.wereda}
            />
            <InputField
              label="Zone / District"
              name="zone_or_district"
              defaultValue={data?.zone_or_district}
              register={register}
              error={errors.zone_or_district}
            />
            <InputField
              label="Kebele"
              name="kebele"
              defaultValue={data?.kebele}
              register={register}
              error={errors.kebele}
            />
            {/* <div className="flex flex-col gap-2 w-full max-w-md">
              <label className="text-xs text-gray-500">Document</label>
              <input
                type="file"
                {...register("document")}
                className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm"
              />
              {errors.document && (
                <p className="text-xs text-red-400">
                  {errors.document.message?.toString()}
                </p>
              )}
            </div> */}
            <div className="flex flex-col gap-2 w-full max-w-md">
              <label className="text-xs text-gray-500">Remark</label>
              <textarea
                {...register("remark")}
                defaultValue={data?.remark}
                rows={4}
                className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm"
              />
              {errors.remark && (
                <p className="text-xs text-red-400">
                  {errors.remark.message?.toString()}
                </p>
              )}
            </div>
          </div>
        )}

        {tabIndex === 2 && (
          <div className="text-sm text-gray-500 italic">
            Relatives section placeholder
          </div>
        )}

        {state.error && (
          <span className="text-red-500">Something went wrong!</span>
        )}

        <button className="bg-blue-500 text-white py-2 px-4 rounded-md mt-4 w-fit self-end">
          {type === "create" ? "Create" : "Update"}
        </button>
      </form>
    </div>
  );
};

export default MemberForm;

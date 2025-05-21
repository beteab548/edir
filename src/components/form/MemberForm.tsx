"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { countryList } from "@/lib/countries";
import InputField from "../InputField";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { combinedSchema, CombinedSchema } from "@/lib/formValidationSchemas";
import { useFormState } from "react-dom";
import { createMember, updateMember } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

const tabs = ["Member Info", "Address", "Relatives"];

const MemberForm = ({
  type,
  data,
  setOpen
}: {
  type: "create" | "update";
  data?: any;
  setOpen: Dispatch<SetStateAction<boolean>>;
}) => {
  const formatDate = (dateStr?: string) =>
    dateStr ? new Date(dateStr).toISOString().split("T")[0] : "";
  console.log(data);
  const [relatives, setRelatives] = useState<any[]>(data?.relatives || []);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [confirmDeleteIndex, setConfirmDeleteIndex] = useState<number | null>(
    null
  );
  const [relativeError, setRelativeError] = useState<string | undefined>(
    undefined
  );
  const relativesDialogRef = useRef<HTMLDialogElement>(null);
  const deleteDialogRef = useRef<HTMLDialogElement>(null);
  const [relativeFormData, setRelativeFormData] = useState({
    first_name: "",
    second_name: "",
    last_name: "",
    status: "Alive",
    relation_type: "Mother",
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CombinedSchema>({
    resolver: zodResolver(combinedSchema),
    // defaultValues,
  });

  const [tabIndex, setTabIndex] = useState(0);
  const [state, formAction] = useFormState(
    type === "create" ? createMember : updateMember,
    { success: false, error: false }
  );
  console.log(type);
  useEffect(() => {
    if (data) {

      setRelatives(data.relative || []);
    }
  }, [data, reset]);
console.log(relativeFormData);
  const onSubmit = handleSubmit(
    (formData) => {
      const submissionData = {
        member: formData.member,
        relatives: relatives,
      };
      formAction(submissionData);
    },
    (errors) => {
      console.error("Validation errors:", errors);
    }
  );

  const router = useRouter();
  useEffect(() => {
    if (state.success) {
      toast(`Member has been ${type === "create" ? "created" : "updated"}!`);
      router.push("/list/members");
      if(type==="update"){
       router.refresh();
      setOpen(false);
      }
    }
    if (state.error) toast.error("Something went wrong");
  }, [state, router, type]);

  // Relative management functions
  const openRelativesDialog = (index?: number) => {
    if (typeof index === "number") {
      setEditIndex(index);
      setRelativeFormData(relatives[index]);
    } else {
      setEditIndex(null);
      setRelativeFormData({
        first_name: "",
        second_name: "",
        last_name: "",
        status: "Alive",
        relation_type: "Mother",
      });
    }
    relativesDialogRef.current?.showModal();
  };

  const closeRelativesDialog = () => {
    relativesDialogRef.current?.close();
  };

  const handleRelativeChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setRelativeFormData((prev) => ({ ...prev, [name]: value }));
  };

  const saveRelative = () => {
    if (
      !relativeFormData.first_name ||
      !relativeFormData.last_name ||
      !relativeFormData.relation_type ||
      !relativeFormData.status
    ) {
      setRelativeError("Please fill in all required fields");
      return;
    }

    const updatedRelatives = [...relatives];
    if (editIndex !== null) {
      updatedRelatives[editIndex] = relativeFormData;
    } else {
      updatedRelatives.push(relativeFormData);
    }

    setRelatives(updatedRelatives);
    setRelativeError(undefined);
    closeRelativesDialog();
  };

  const openDeleteDialog = (index: number) => {
    setConfirmDeleteIndex(index);
    deleteDialogRef.current?.showModal();
  };

  const confirmDelete = () => {
    if (confirmDeleteIndex !== null) {
      const updatedRelatives = relatives.filter(
        (_, i) => i !== confirmDeleteIndex
      );
      setRelatives(updatedRelatives);
      setConfirmDeleteIndex(null);
      deleteDialogRef.current?.close();
    }
  };

  const cancelDelete = () => {
    setConfirmDeleteIndex(null);
    deleteDialogRef.current?.close();
  };
  return (
    <div>
      <div className="flex gap-4 border-b mb-4">
        {tabs.map((tab, index) => (
          <button
            key={tab}
            className={`pb-2 ml-6 ${
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
      <form className="flex flex-col gap-6 m-10" onSubmit={onSubmit}>
        {tabIndex === 0 && (
          <div className="flex justify-between flex-wrap gap-4 ">
            <InputField
              label="First Name"
              name="member.first_name"
              register={register}
              error={errors?.member?.first_name}
              defaultValue={data?.first_name}
            />
            <InputField
              label="Second Name"
              name="member.second_name"
              register={register}
              error={errors?.member?.second_name}
              defaultValue={data?.second_name}
            />
            <InputField
              label="Last Name"
              name="member.last_name"
              register={register}
              error={errors?.member?.last_name}
              defaultValue={data?.last_name}
            />

            <InputField
              label="Birth Date"
              name="member.birth_date"
              type="date"
              register={register}
              defaultValue={formatDate(data.birth_date)}
              error={errors?.member?.birth_date}
            />
            {data && (
              <InputField
                label="Id"
                name="member.id"
                register={register}
                error={errors?.member?.id}
                hidden
                defaultValue={data?.id}
              />
            )}
            <div className="flex flex-col gap-2 min-w-[200px]">
              <label className="text-xs text-gray-500">Sex</label>
              <select
                {...register("member.sex")}
                className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm"
                defaultValue={data?.sex}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <InputField
              label="Title"
              name="member.title"
              register={register}
              error={errors.member?.title}
              defaultValue={data?.title}
            />
            <InputField
              label="Job/Business"
              name="member.job_business"
              register={register}
              error={errors.member?.job_business}
              defaultValue={data?.job_business}
            />
            <InputField
              label="Profession"
              name="member.profession"
              register={register}
              error={errors.member?.profession}
              defaultValue={data?.profession}
            />
            <InputField
              label="Joined Date"
              name="member.joined_date"
              type="date"
              register={register}
              error={errors.member?.joined_date}
              defaultValue={formatDate(data?.joined_date)}
            />
            <InputField
              label="End Date"
              name="member.end_date"
              type="date"
              register={register}
              error={errors.member?.end_date}
              defaultValue={data?.first_name}
            />
            <div className="flex flex-col gap-2 min-w-[200px]">
              <label className="text-xs text-gray-500">Status</label>
              <select
                {...register("member.status")}
                className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm"
                defaultValue={data?.first_name}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
              {errors.member?.status && (
                <p className="text-xs text-red-400">
                  {errors.member?.status?.message?.toString()}
                </p>
              )}
            </div>
          </div>
        )}
<div className={tabIndex === 1 ? "" : "hidden"}>
       
          <div className="flex justify-between flex-wrap gap-4">
            <InputField
              label="ID Number"
              name="member.id_number"
              register={register}
              error={errors.member?.id_number}
              defaultValue={data?.id_number}
            />
            <div className="flex flex-col gap-2 min-w-[150px] max-w-[200px] flex-1">
              <label className="text-xs text-gray-500">Citizen</label>
              <select
                {...register("member.citizen")}
                className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
                defaultValue={data?.citizen}
              >
                <option value="">Select a country</option>
                {countryList.map(({ code, name }) => (
                  <option key={code} value={name}>
                    {name}
                  </option>
                ))}
              </select>
              {errors.member?.citizen && (
                <p className="text-xs text-red-400">
                  {errors.member?.citizen?.message?.toString()}
                </p>
              )}
            </div>

            <InputField
              label="Phone Number"
              name="member.phone_number"
              register={register}
              error={errors.member?.phone_number}
              defaultValue={data?.phone_number}
            />
            <InputField
              label="Wereda"
              name="member.wereda"
              register={register}
              error={errors.member?.wereda}
              defaultValue={data?.wereda}
            />
            <InputField
              label="Zone / District"
              name="member.zone_or_district"
              register={register}
              error={errors.member?.zone_or_district}
              defaultValue={data?.zone_or_district}
            />
            <InputField
              label="Kebele"
              name="member.kebele"
              register={register}
              error={errors.member?.kebele}
              defaultValue={data?.kebele}
            />
            <div className="flex flex-col gap-2 w-full max-w-md">
              <label className="text-xs text-gray-500">Remark</label>
              <textarea
                {...register("member.remark")}
                rows={4}
                className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm"
                defaultValue={data?.remark}
              />
              {errors.member?.remark && (
                <p className="text-xs text-red-400">
                  {errors.member?.remark?.message?.toString()}
                </p>
              )}
            </div>
          </div>
     
        </div>
        {tabIndex === 2 && (
          <div className="w-full relative">
            <button
              type="button"
              onClick={() => openRelativesDialog()}
              className="absolute top-4 right-4 px-4 py-2 bg-blue-600 text-white rounded"
            >
              Add Relative
            </button>

            <table className="table w-full border border-base-300 mt-16">
              <thead>
                <tr>
                  <th>No</th>
                  <th>First Name</th>
                  <th>Second Name</th>
                  <th>Last Name</th>
                  <th>Relation</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {relatives.map((relative, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{relative.first_name}</td>
                    <td>{relative.second_name}</td>
                    <td>{relative.last_name}</td>
                    <td>{relative.relation_type}</td>
                    <td>{relative.status}</td>
                    <td className="flex gap-2">
                      <button
                        type="button"
                        className="btn btn-xs btn-info"
                        onClick={() => openRelativesDialog(index)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-xs btn-error"
                        onClick={() => openDeleteDialog(index)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
                {relatives.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-4">
                      No relatives added yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Add/Edit Relative Dialog */}
            <dialog
              ref={relativesDialogRef}
              className="modal backdrop:bg-black/50 rounded-lg max-w-full min-w-[800px] w-full"
            >
              <div className="modal-box w-full">
                <h2 className="text-xl font-semibold mb-4">
                  {editIndex !== null ? "Edit Relative" : "Add New Relative"}
                </h2>

                <div className="flex flex-col gap-6 w-full">
                  <div className="flex gap-6">
                    <div className="flex flex-col w-1/3">
                      <label htmlFor="first_name">First name</label>
                      <input
                        className="input input-bordered w-full"
                        type="text"
                        name="first_name"
                        value={relativeFormData.first_name}
                        onChange={handleRelativeChange}
                        placeholder="First name"
                      />
                    </div>
                    <div className="flex flex-col w-1/3">
                      <label htmlFor="second_name">Second name</label>
                      <input
                        className="input input-bordered w-full"
                        type="text"
                        name="second_name"
                        value={relativeFormData.second_name}
                        onChange={handleRelativeChange}
                        placeholder="Second name"
                      />
                    </div>
                    <div className="flex flex-col w-1/3">
                      <label htmlFor="last_name">Last name</label>
                      <input
                        className="input input-bordered w-full"
                        type="text"
                        name="last_name"
                        value={relativeFormData.last_name}
                        onChange={handleRelativeChange}
                        placeholder="Last name"
                      />
                    </div>
                  </div>

                  <div className="flex gap-6">
                    <div className="flex flex-col w-1/2">
                      <label htmlFor="relation_type">Relation</label>
                      <select
                        name="relation_type"
                        value={relativeFormData.relation_type}
                        onChange={handleRelativeChange}
                        className="select select-bordered w-full"
                      >
                        <option value="" disabled>
                          Select relation
                        </option>
                        <option>mother</option>
                        <option>father</option>
                        <option>sister</option>
                        <option>brother</option>
                        <option>son</option>
                        <option>daughter</option>
                        <option>spouse</option>
                        <option>spouse-brother</option>
                        <option>spouse-sister</option>
                        <option>spouse-mother</option>
                        <option>spouse-father</option>
                      </select>
                    </div>
                    <div className="flex flex-col w-1/2">
                      <label htmlFor="status">Status</label>
                      <select
                        name="status"
                        value={relativeFormData.status}
                        onChange={handleRelativeChange}
                        className="select select-bordered w-full"
                      >
                        <option value="" disabled>
                          Select status
                        </option>
                        <option>Alive</option>
                        <option>Deceased</option>
                        <option>Sick</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-2">
                  {relativeError && (
                    <p className="text-red-500">{relativeError}</p>
                  )}
                  <button
                    type="button"
                    onClick={closeRelativesDialog}
                    className="btn btn-ghost"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={saveRelative}
                    className="btn btn-primary"
                  >
                    Save
                  </button>
                </div>
              </div>
            </dialog>

            {/* Delete Confirmation Dialog */}
            <dialog ref={deleteDialogRef} className="modal">
              <div className="modal-box">
                <h3 className="font-bold text-lg">Confirm Delete</h3>
                <p className="py-4">
                  Are you sure you want to delete this relative?
                </p>
                <div className="modal-action">
                  <button className="btn" onClick={cancelDelete} type="button">
                    Cancel
                  </button>
                  <button
                    className="btn btn-error"
                    onClick={confirmDelete}
                    type="button"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </dialog>
          </div>
        )}
        {state.error && (
          <span className="text-red-500">Something went wrong!</span>
        )}
        <button
          className="bg-blue-500 text-white py-2 px-4 rounded-md mt-4 w-fit self-end"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting
            ? "submitting"
            : type === "create"
            ? "Create"
            : "Update"}
        </button>
      </form>
    </div>
  );
};
export default MemberForm;

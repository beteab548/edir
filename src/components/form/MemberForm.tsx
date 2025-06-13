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
import UploadFile from "../FileUpload/page";
import Image from "next/image";
import SelectField from "../SelectField";
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
  const formatDate = (dateStr?: string) =>
    dateStr ? new Date(dateStr).toISOString().split("T")[0] : "";
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
  });
  const [image, setImageUrl] = useState<{ Url: string; fileId: string } | null>(
    null
  );
  const [imageReady, setImageReady] = useState(true);
  const [document, SetDocumentUrl] = useState<{
    Url: string;
    fileId: string;
  } | null>(null);
  const [documentReady, setDocumentReady] = useState(true);
  const [tabIndex, setTabIndex] = useState(0);
  const [state, formAction] = useFormState(
    type === "create" ? createMember : updateMember,
    { success: false, error: false }
  );
  useEffect(() => {
    if (data) {
      setRelatives(data.relative || []);
    }
  }, [data, reset]);
  console.log("data", data);
  const getImageUrl = async (newImage: { Url: string; fileId: string }) => {
    try {
      if (data?.image_url && data?.image_url !== newImage.Url) {
        console.log("existing image data to be deleted", data?.image_url);
        await fetch("/api/imageKit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: data?.image_url,
            fileId: data?.image_file_id,
          }),
        });
      }
      setImageUrl({ Url: newImage.Url, fileId: newImage.fileId });
    } catch (err) {
      console.error("Failed to handle image:", err);
    }
  };
  const getDocument = async (newImage: { Url: string; fileId: string }) => {
    try {
      if (data?.document && data?.document !== document?.Url) {
        await fetch("/api/imageKit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: data?.document,
            fileId: data?.document_file_id,
          }),
        });
      }
      SetDocumentUrl({ Url: newImage.Url, fileId: newImage.fileId });
    } catch (err) {
      console.error("Failed to handle image:", err);
    }
  };
  const onSubmit = handleSubmit(
    (formData) => {
      const submissionData = {
        member: {
          ...formData.member,
          document: document?.Url ?? undefined,
          document_file_id: document?.fileId ?? undefined,
          image_url: image?.Url ?? undefined,
          image_file_id: image?.fileId ?? undefined,
        },
        relatives: relatives,
      };
      console.log("Submitting:", submissionData);
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
      if (type === "update") {
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
  console.log(imageReady);
  return (
    <div className="max-h-[80vh] overflow-y-auto">
      <div className="sticky top-0 bg-white pt-4 pb-2 z-10">
        <div className="flex gap-4 border-b">
          {tabs.map((tab, index) => (
            <button
              key={tab}
              className={`pb-2 px-4 transition-colors text-sm font-medium ${
                tabIndex === index
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setTabIndex(index)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <form className="flex flex-col p-6" onSubmit={onSubmit}>
        {tabIndex === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
              defaultValue={formatDate(data?.birth_date)}
              error={errors?.member?.birth_date}
            />

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Sex</label>
              <select
                {...register("member.sex")}
                className="border border-gray-300 rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
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
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                {...register("member.status")}
                className="border border-gray-300 rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                defaultValue={data?.status ?? "Active"}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
              {errors.member?.status && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.member?.status?.message?.toString()}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Member Type
              </label>
              <select
                {...register("member.member_type")}
                className="border border-gray-300 rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                defaultValue={data?.member_type || "New"}
              >
                <option value="New">New</option>
                <option value="Existing">Existing</option>
              </select>
              {errors.member?.member_type && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.member?.member_type?.message?.toString()}
                </p>
              )}
            </div>
            {data && (
              <InputField
                label=""
                name="member.id"
                register={register}
                error={errors?.member?.id}
                hidden={true}
                defaultValue={data?.id}
              />
            )}
          </div>
        )}
        <div className={tabIndex === 1 ? "" : "hidden"}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="ID Number"
              name="member.id_number"
              register={register}
              error={errors.member?.id_number}
              defaultValue={data?.id_number}
            />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Citizen
              </label>
              <select
                {...register("member.citizen")}
                className="border border-gray-300 rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
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
                <p className="text-xs text-red-500 mt-1">
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
              label="Second Phone Number "
              name="member.phone_number_2"
              register={register}
              error={errors.member?.phone_number_2}
              defaultValue={data?.phone_number_2}
            />
            <InputField
              label="Email "
              name="member.email"
              register={register}
              error={errors.member?.email}
              defaultValue={data?.email}
            />
            <InputField
              label="Email "
              name="member.email_2"
              register={register}
              error={errors.member?.email_2}
              defaultValue={data?.email_2}
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
            {/* //bank name should be a select field with options  */}

            <SelectField
              label="Bank Name"
              name="member.bank_name"
              register={register}
              error={errors.member?.bank_name}
              options={[
                { value: "", label: "Select Bank Name" },
                {
                  value: "Commercial Bank of Ethiopia",
                  label: "Commercial Bank of Ethiopia",
                },
                { value: "Dashen Bank", label: "Dashen Bank" },
                { value: "Awash Bank", label: "Awash Bank" },
                {
                  value: "Nib International Bank",
                  label: "Nib International Bank",
                },
                { value: "Wegagen Bank", label: "Wegagen Bank" },
                { value: "United Bank", label: "United Bank" },
                { value: "Bank of Abyssinia", label: "Bank of Abyssinia" },
                { value: "Zemen Bank", label: "Zemen Bank" },
                { value: "Berhan Bank", label: "Berhan Bank" },
                {
                  value: "Cooperative Bank of Oromia",
                  label: "Cooperative Bank of Oromia",
                },
                {
                  value: "Lion International Bank",
                  label: "Lion International Bank",
                },
                { value: "Enat Bank", label: "Enat Bank" },
                {
                  value: "Addis International Bank",
                  label: "Addis International Bank",
                },
                {
                  value: "Bunna International Bank",
                  label: "Bunna International Bank",
                },
                { value: "Debub Global Bank", label: "Debub Global Bank" },
                { value: "Abay Bank", label: "Abay Bank" },
                {
                  value: "Oromia International Bank",
                  label: "Oromia International Bank",
                },
                { value: "Hijra Bank", label: "Hijra Bank" },
                { value: "ZamZam Bank", label: "ZamZam Bank" },
                { value: "Goh Betoch Bank", label: "Goh Betoch Bank" },
                { value: "Siinqee Bank", label: "Siinqee Bank" },
                { value: "Shabelle Bank", label: "Shabelle Bank" },
                { value: "Tsedey Bank", label: "Tsedey Bank" },
              ]}
              selectProps={{
                className:
                  "w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500",
              }}
            />
            <InputField
              label="Bank Account Number"
              name="member.bank_account_number"
              register={register}
              error={errors.member?.bank_account_number}
              defaultValue={data?.bank_account_number}
            />
            <InputField
              label="Bank Account Name"
              name="member.bank_account_name"
              register={register}
              error={errors.member?.bank_account_name}
              defaultValue={data?.bank_account_name}
            />

            {/* Image preview if imageUrl exists */}
            {data?.image_url && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Current Profile Image
                </label>
                <Image
                  width={200}
                  height={200}
                  src={data?.image_url ?? "profile image"}
                  alt="Profile preview"
                  className="mt-2 h-32 w-32 object-cover rounded-full border"
                />
              </div>
            )}

            {/* Upload file component - pass getImageUrl to update imageUrl */}
            <UploadFile
              text="profile"
              getImageUrl={getImageUrl}
              setImageReady={setImageReady}
            />
            {/* Image preview if imageUrl exists */}
            {data?.document && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Current Document
                </label>
                <Image
                  width={200}
                  height={200}
                  src={data?.document ?? "profile image"}
                  alt="Profile preview"
                  className="mt-2 h-32 w-32 object-cover rounded-full border"
                />
              </div>
            )}

            {/* Upload file component - pass getImageUrl to update imageUrl */}
            <UploadFile
              text="document"
              getImageUrl={getDocument}
              setImageReady={setDocumentReady}
            />
            <div className="md:col-span-2 flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">
                Remark
              </label>
              <textarea
                {...register("member.remark")}
                rows={3}
                className="border border-gray-300 rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                defaultValue={data?.remark}
              />
              {errors.member?.remark && (
                <p className="text-xs text-red-500 mt-1">
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
              className="absolute top-0 right-0 px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
            >
              Add Relative
            </button>

            <div className="mt-12 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      No
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      First Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Second Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Relation
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
                  {relatives.map((relative, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {relative.first_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {relative.second_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {relative.last_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {relative.relation_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {relative.status}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="text-blue-600 hover:text-blue-900"
                            onClick={() => openRelativesDialog(index)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="text-red-600 hover:text-red-900"
                            onClick={() => openDeleteDialog(index)}
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {relatives.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-4 text-center text-sm text-gray-500"
                      >
                        No relatives added yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Add/Edit Relative Dialog */}
            <dialog
              ref={relativesDialogRef}
              className="modal backdrop:bg-black/50 rounded-lg shadow-xl"
            >
              <div className="modal-box max-w-md">
                <h2 className="text-lg font-semibold mb-4">
                  {editIndex !== null ? "Edit Relative" : "Add New Relative"}
                </h2>

                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium text-gray-700">
                        First name
                      </label>
                      <input
                        className="border border-gray-300 rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                        type="text"
                        name="first_name"
                        value={relativeFormData.first_name}
                        onChange={handleRelativeChange}
                        placeholder="First name"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium text-gray-700">
                        Second name
                      </label>
                      <input
                        className="border border-gray-300 rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                        type="text"
                        name="second_name"
                        value={relativeFormData.second_name}
                        onChange={handleRelativeChange}
                        placeholder="Second name"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium text-gray-700">
                        Last name
                      </label>
                      <input
                        className="border border-gray-300 rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                        type="text"
                        name="last_name"
                        value={relativeFormData.last_name}
                        onChange={handleRelativeChange}
                        placeholder="Last name"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium text-gray-700">
                        Relation
                      </label>
                      <select
                        name="relation_type"
                        value={relativeFormData.relation_type}
                        onChange={handleRelativeChange}
                        className="border border-gray-300 rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="" disabled>
                          Select relation
                        </option>
                        <option>Mother</option>
                        <option>Father</option>
                        <option>Sister</option>
                        <option>Brother</option>
                        <option>Son</option>
                        <option>Daughter</option>
                        <option>Spouse</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium text-gray-700">
                        Status
                      </label>
                      <select
                        name="status"
                        value={relativeFormData.status}
                        onChange={handleRelativeChange}
                        className="border border-gray-300 rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500"
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
                    <p className="text-red-500 text-sm">{relativeError}</p>
                  )}
                  <button
                    type="button"
                    onClick={closeRelativesDialog}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={saveRelative}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
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
                  <button
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    onClick={cancelDelete}
                    type="button"
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
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

        <div className="mt-6 flex justify-end border-t pt-4">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mr-3 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            disabled={!imageReady || !documentReady || isSubmitting}
            type="submit"
          >
            {isSubmitting
              ? "Processing..."
              : type === "create"
              ? "Create Member"
              : "Update Member"}
          </button>
        </div>
      </form>
    </div>
  );
};
export default MemberForm;

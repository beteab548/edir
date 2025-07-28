"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { FieldError, useForm, useWatch } from "react-hook-form";
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
import Link from "next/link";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
const tabs = ["Principal Info", "Principal detail", "Principal Relatives"];
import "./phone-input.css";
import SmallCheckbox from "../ui/checkbox";
const MemberForm = ({
  type,
  data,
  setOpen,
}: {
  type: "create" | "update";
  data?: any;
  setOpen?: Dispatch<SetStateAction<boolean>>;
}) => {
  const formatDate = (dateStr?: string) =>
    dateStr ? new Date(dateStr).toISOString().split("T")[0] : "";
  const [relatives, setRelatives] = useState<any[]>(data?.relatives || []);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [confirmDeleteIndex, setConfirmDeleteIndex] = useState<number | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
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
    setValue,
    getValues,
    handleSubmit,
    watch,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CombinedSchema>({
    resolver: zodResolver(combinedSchema),
  });

  const [image, setImageUrl] = useState<{ Url: string; fileId: string } | null>(
    null
  );
  const [phone, setPhone] = useState<string | undefined>(data?.phone_number);
  const [phone2, setPhone2] = useState<string | undefined>(
    data?.phone_number_2
  );

  const [imageReady, setImageReady] = useState(true);
  const [identificationReady, setIdetificationReady] = useState(true);
  const [document, SetDocumentUrl] = useState<{
    Url: string;
    fileId: string;
  } | null>(null);
  const [documentReady, setDocumentReady] = useState(true);
  const [identificationImage, setIdentificationUrl] = useState<{
    Url: string;
    fileId: string;
  } | null>(null);
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

  const selectedIdType = useWatch({
    control,
    name: "member.identification_type",
  });
  useEffect(() => {
    // Clear ID number when type changes
    setValue("member.identification_number", "");
  }, [selectedIdType, setValue]);

  const getImageUrl = async (newImage: { Url: string; fileId: string }) => {
    try {
      if (data?.image_url && data?.image_url !== newImage.Url) {
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
  const getidentificationImage = async (newImage: {
    Url: string;
    fileId: string;
  }) => {
    try {
      if (
        data?.identification_image &&
        data?.identification_image !== identificationImage?.Url
      ) {
        await fetch("/api/imageKit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: data?.identification_image,
            fileId: data?.identification_file_id,
          }),
        });
      }
      setIdentificationUrl({ Url: newImage.Url, fileId: newImage.fileId });
    } catch (err) {
      console.error("Failed to handle Identification image:", err);
    }
  };

  const onSubmit = handleSubmit(
    async (formData) => {
      setIsLoading(true);
      const submissionData = {
        member: {
          ...formData.member,
          document: document?.Url ?? undefined,
          document_file_id: document?.fileId ?? undefined,
          image_url: image?.Url ?? undefined,
          image_file_id: image?.fileId ?? undefined,
          identification_image: identificationImage?.Url ?? undefined,
          identification_file_id: identificationImage?.fileId ?? undefined,
        },
        relatives: relatives,
      };
      console.log(submissionData);
      await formAction(submissionData);
    },

    (errors) => {
      const memberErrors = errors?.member;

      if (memberErrors && typeof memberErrors === "object") {
        const errorMessages = Object.values(memberErrors)
          .filter(
            (error): error is FieldError =>
              typeof error === "object" && error !== null && "message" in error
          )
          .map((error) => error.message);

        if (errorMessages.length > 0) {
          errorMessages.forEach((msg) => toast.error(msg));
        } else {
          toast.error("Please correct the highlighted errors.");
        }
      } else {
        toast.error("Please correct the highlighted errors.");
      }

      console.error("Validation errors:", errors);
    }
  );
  const router = useRouter();
  useEffect(() => {
    if (state.success) {
      setIsLoading(false);
      toast.success(
        `Member has been ${type === "create" ? "created" : "updated"}!`
      );
      router.push("/list/members");
      router.refresh();
      if (type === "update") {
        if (setOpen) setOpen(false);
      }
    }
    if (state.error) {
      setIsLoading(false);
      toast.error("Something went wrong");
    }
  }, [state, router, type, setOpen]);

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
  useEffect(() => {
    setValue("member.phone_number", phone ?? "");
    setValue("member.phone_number_2", phone2 ?? "");
  }, [phone, setValue, phone2]);
  return (
    <div
      className={`${
        type === "update" ? "h-[570px] w-[770px]" : ""
      } overflow-y-hidden rounded-lg bg-white`}
    >
      <div className="sticky top-0  pt-4 pb-2 z-10 border-b border-gray-200">
        <div className="flex gap-4 px-6">
          {tabs.map((tab, index) => (
            <button
              key={tab}
              className={`pb-3 px-2 transition-colors text-sm font-medium relative ${
                tabIndex === index
                  ? "text-blue-600 after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setTabIndex(index)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <form className="flex flex-col p-6 w-full" onSubmit={onSubmit}>
        {tabIndex === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[400px] overflow-y-auto custom-scrollbar pr-4">
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
              inputProps={{
                max: formatDate(new Date().toISOString()),
              }}
            />

            <div className="flex flex-col gap-2 ">
              <label className="text-sm font-medium text-gray-700">Sex</label>
              <select
                {...register("member.sex")}
                className="border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                defaultValue={data?.sex}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <SelectField
              label="Marital Status"
              name="member.marital_status"
              register={register}
              error={errors.member?.marital_status}
              defaultValue={data?.marital_status}
              options={[
                { value: "", label: "Select Marital Status" },
                { value: "married", label: "Married" },
                { value: "divorced", label: "Divorced" },
                { value: "single", label: "Single" },
                { value: "widowed", label: "Widowed" },
              ]}
            />
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
              label="Registered Date"
              name="member.registered_date"
              type="date"
              register={register}
              error={errors.member?.registered_date}
              defaultValue={formatDate(data?.registered_date ?? new Date())}
            />
            <InputField
              label="End Date"
              name="member.end_date"
              type="date"
              register={register}
              error={errors.member?.end_date}
              defaultValue={formatDate(data?.end_date)}
            />

            <div className="flex flex-col gap-2 ">
              <label className="text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                {...register("member.status")}
                className="border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                defaultValue={data?.status ?? "Active"}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Deceased">Deceased</option>
                <option value="Left">Left</option>
              </select>
              {errors.member?.status && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.member?.status?.message?.toString()}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">
                Member Type
              </label>
              <select
                {...register("member.member_type")}
                className="border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
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
            <div className="h-8 flex items-end justify-start mt-6">
              <SmallCheckbox
                name="member.founding_member"
                label="Founding Member"
                register={register}
                error={errors?.member?.founding_member}
                defaultChecked={data?.founding_member}
              />
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
          <div
            className={`max-h-[400px] overflow-y-auto custom-scrollbar pr-4`}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 ">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Citizen
                </label>
                <select
                  {...register("member.citizen")}
                  className="border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  defaultValue={data?.citizen ?? "Ethiopia"}
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
              <PhoneInputField
                value={phone ?? ""}
                onChange={(val) => setPhone(val)}
                error={errors?.member?.phone_number?.message}
              />

              <PhoneInputField
                value={phone2 ?? ""}
                onChange={(val) => setPhone2(val)}
                error={errors?.member?.phone_number_2?.message}
              />

              <InputField
                label="Email"
                name="member.email"
                register={register}
                error={errors.member?.email}
                defaultValue={data?.email}
              />

              <InputField
                label="Second Email"
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
              <SelectField
                label="Green Area"
                name="member.green_area"
                register={register}
                error={errors.member?.green_area}
                defaultValue={data?.green_area}
                options={[
                  { value: "", label: "Select Green Area Number" },
                  { value: "1", label: "1" },
                  { value: "2", label: "2" },
                  { value: "3", label: "3" },
                  { value: "4", label: "4" },
                  { value: "5", label: "5" },
                  { value: "6", label: "6" },
                  { value: "7", label: "7" },
                  { value: "8", label: "8" },
                  { value: "9", label: "9" },
                  { value: "10", label: "10" },
                  { value: "11", label: "11" },
                  { value: "12", label: "12" },
                ]}
              />
              <InputField
                label="Block"
                name="member.block"
                register={register}
                error={errors.member?.block}
                defaultValue={data?.block}
              />
              <InputField
                label="House Number"
                name="member.house_number"
                register={register}
                error={errors.member?.house_number}
                defaultValue={data?.house_number}
              />

              <SelectField
                label="Bank Name"
                name="member.bank_name"
                register={register}
                error={errors.member?.bank_name}
                defaultValue={data?.bank_name || ""}
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
                    "w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white",
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Image
                </label>
                {data?.image_url && (
                  <div className="mb-4 flex items-center gap-4">
                    <Image
                      width={50}
                      height={50}
                      src={data?.image_url}
                      alt="Profile preview"
                      className="h-10 w-10 object-cover"
                    />
                    <span className="text-sm text-gray-500">
                      Current profile image
                    </span>
                  </div>
                )}
                <UploadFile
                  text="Upload new profile image"
                  getImageUrl={getImageUrl}
                  setImageReady={setImageReady}
                  accept="image/*"
                />
              </div>

              {/* Document upload section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document
                </label>
                {data?.document && (
                  <div className="mb-4 flex items-center gap-4">
                    <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-gray-200">
                      <Link href={data.document} target="blanck">
                        <svg
                          className="w-8 h-8 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                          ></path>
                        </svg>
                      </Link>
                    </div>
                    <span className="text-sm text-gray-500">
                      Current document
                    </span>
                  </div>
                )}
                <UploadFile
                  text="Upload new document"
                  getImageUrl={getDocument}
                  setImageReady={setDocumentReady}
                   accept="application/pdf,.pdf" 
                />
              </div>
              <div>
                <SelectField
                  label="Identification Type"
                  name="member.identification_type"
                  register={register}
                  error={errors.member?.identification_type}
                  options={[
                    { value: "", label: "Select ID Type" },
                    { value: "FAYDA", label: "Fayda" },
                    { value: "KEBELE_ID", label: "Kebel ID" },
                    { value: "PASSPORT", label: "Passport" },
                  ]}
                  defaultValue={data?.identification_type}
                  required
                  registerOptions={{ required: "Please select an ID type" }}
                />
              </div>
              {selectedIdType && (
                <InputField
                  label={
                    selectedIdType === "FAYDA"
                      ? "Fayda ID Number"
                      : selectedIdType === "KEBELE_ID"
                      ? "Kebele ID Number"
                      : "Passport Number"
                  }
                  name="identification_number"
                  register={register}
                  error={errors.member?.identification_number}
                  inputProps={{
                    placeholder: "Enter ID number",
                  }}
                />
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Identification Image
                </label>
                {data?.identification_image && (
                  <div className="mb-4 flex items-center gap-4">
                    <Image
                      width={50}
                      height={50}
                      src={data?.identification_image}
                      alt="Profile preview"
                      className="h-10 w-10 object-cover"
                    />
                    <span className="text-sm text-gray-500">
                      Current Identification image
                    </span>
                  </div>
                )}
                <UploadFile
                  text="Upload Identification Image"
                  getImageUrl={getidentificationImage}
                  setImageReady={setIdetificationReady}
                    accept="image/*,.pdf"
                />

                {errors.member?.identification_image && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.member?.identification_image.message}
                  </p>
                )}
              </div>
              <div className="md:col-span-1 flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Remark
                </label>
                <textarea
                  {...register("member.remark")}
                  rows={5}
                  className="border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
        </div>

        {tabIndex === 2 && (
          <div className="w-full bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-[400px] flex flex-col relative custom-scrollbar">
            <button
              type="button"
              onClick={() => openRelativesDialog()}
              className="absolute top-3 right-6 px-4 py-2  bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-1"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                ></path>
              </svg>
              Add Relative
            </button>
            <div className="mt-8 overflow-x-auto">
              {relatives.length === 0 ? (
                <div className="text-center py-8">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1"
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    ></path>
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No relatives
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Add a relative to get started.
                  </p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        No
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
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
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 font-medium">
                            {relative.first_name} {relative.second_name}{" "}
                            {relative.last_name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {relative.relation_type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              relative.status === "Alive"
                                ? "bg-green-100 text-green-800"
                                : relative.status === "Deceased"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {relative.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex gap-3">
                            <button
                              type="button"
                              className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                              onClick={() => openRelativesDialog(index)}
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                ></path>
                              </svg>
                              Edit
                            </button>
                            <button
                              type="button"
                              className="text-red-600 hover:text-red-900 flex items-center gap-1"
                              onClick={() => openDeleteDialog(index)}
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                ></path>
                              </svg>
                              Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <dialog
              ref={relativesDialogRef}
              className="modal backdrop:bg-black/30 rounded-lg shadow-xl "
            >
              <div className="modal-box bg-white p-6 rounded-lg max-w-none w-full">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {editIndex !== null ? "Edit Relative" : "Add New Relative"}
                  </h2>
                  <button
                    type="button"
                    onClick={closeRelativesDialog}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      ></path>
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium text-gray-700">
                        First name <span className="text-red-500">*</span>
                      </label>
                      <input
                        className="border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                        className="border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        type="text"
                        name="second_name"
                        value={relativeFormData.second_name}
                        onChange={handleRelativeChange}
                        placeholder="Second name"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium text-gray-700">
                        Last name <span className="text-red-500">*</span>
                      </label>
                      <input
                        className="border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        type="text"
                        name="last_name"
                        value={relativeFormData.last_name}
                        onChange={handleRelativeChange}
                        placeholder="Last name"
                      />
                    </div>
                  </div>

                  {/* Horizontal row for relation/status */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium text-gray-700">
                        Relation <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="relation_type"
                        value={relativeFormData.relation_type}
                        onChange={handleRelativeChange}
                        className="border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="Mother">Mother</option>
                        <option value="Father">Father</option>
                        <option value="Sister">Sister</option>
                        <option value="Brother">Brother</option>
                        <option value="Son">Son</option>
                        <option value="Daughter">Daughter</option>
                        <option value="Spouse">Spouse</option>
                        <option value="Spouse_Mother">Spouse Mother</option>
                        <option value="Spouse_Father">Spouse Father</option>
                        <option value="Spouse_Sister">Spouse Sister</option>
                        <option value="Spouse_Brother">Spouse Brother</option>
                        <option value="other">other</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium text-gray-700">
                        Status <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="status"
                        value={relativeFormData.status}
                        onChange={handleRelativeChange}
                        className="border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="Alive">Alive</option>
                        <option value="Deceased">Deceased</option>
                        <option value="Sick">Sick</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  {relativeError && (
                    <p className="text-red-500 text-sm mr-auto">
                      {relativeError}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={closeRelativesDialog}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={saveRelative}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    {editIndex !== null ? "Update" : "Add"} Relative
                  </button>
                </div>
              </div>
            </dialog>
            {/* Delete Confirmation Dialog */}
            <dialog
              ref={deleteDialogRef}
              className="modal backdrop:bg-black/30"
            >
              <div className="modal-box bg-white p-6 rounded-lg max-w-sm">
                <div className="flex flex-col items-center">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
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
                      ></path>
                    </svg>
                  </div>
                  <h3 className="mt-3 text-lg font-medium text-gray-900">
                    Delete relative
                  </h3>
                  <div className="mt-2 text-sm text-gray-500 text-center">
                    Are you sure you want to delete this relative? This action
                    cannot be undone.
                  </div>
                </div>
                <div className="mt-5 flex justify-center gap-3">
                  <button
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 w-24"
                    onClick={cancelDelete}
                    type="button"
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 w-24"
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

        <div className="mt-6 flex justify-end border-t border-gray-200 pt-4 gap-3">
          <button
            type="button"
            onClick={() => {
              if (type === "update") {
                return setOpen && setOpen(false);
              } else {
                return router.back();
              }
            }}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Close
          </button>
          <button
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
            disabled={
              !imageReady || !documentReady || isLoading || !identificationReady
            }
            type="submit"
          >
            {isLoading
              ? "saving..."
              : type === "create"
              ? "Create Member"
              : "Update Member"}
          </button>
        </div>
      </form>
    </div>
  );
};

interface PhoneInputFieldProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

const PhoneInputField = ({ value, onChange, error }: PhoneInputFieldProps) => {
  return (
    <div className="flex flex-col gap-1 w-full">
      {" "}
      <label className="text-sm font-medium text-gray-700">Phone Number</label>
      <div className="w-full">
        {" "}
        <PhoneInput
          country={"et"}
          value={value}
          onChange={onChange}
          containerClass="w-full"
          inputClass="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          buttonClass="border border-gray-300 rounded-l-md"
          dropdownClass="z-20"
        />
      </div>
      {error && <span className="text-red-500 text-xs">{error}</span>}
    </div>
  );
};

export default MemberForm;

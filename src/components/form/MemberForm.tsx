"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { FieldError, useForm, useWatch } from "react-hook-form";
import { countryList } from "@/lib/countries";
import InputField from "../InputField";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import {
  FamilyMemberSchema,
  familyMemberSchema,
} from "@/lib/formValidationSchemas";
import { useFormState } from "react-dom";
import { createFamily, updateFamily } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import UploadFile from "../FileUpload/page";
import Image from "next/image";
import SelectField from "../SelectField";
import Link from "next/link";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
// import "./phone-input.css"; // Let's assume this is the correct path
import SmallCheckbox from "../ui/checkbox";

const initialTabs = [
  "Principal Info",
  "Principal detail",
  "Principal Relatives",
];
// This function can be inside your MemberForm component or outside it.
// It takes your raw server data and returns data ready for the form.

const getFormattedFormValues = (rawData: any) => {
  const formatDate = (dateStr?: string | Date): string => {
    if (!dateStr) return "";
    return new Date(dateStr).toISOString().split("T")[0];
  };

  // "Create" mode defaults remain the same
  if (!rawData || !rawData.principal) {
    return {
      principal: {
        isPrincipal: true,
        sex: "Male",
        registered_date: formatDate(new Date()),
        status: "Active",
        member_type: rawData?.principal?.member_type || "New",
      },
      spouse: undefined,
      relatives: [],
    };
  }

  // "Update" mode logic
  const formattedPrincipal = {
    ...rawData.principal,
    birth_date: formatDate(rawData.principal?.birth_date),
    registered_date: formatDate(rawData.principal?.registered_date),
    end_date: formatDate(rawData.principal?.end_date),
  };

  let formattedSpouse;
  if (rawData.spouse) {
    formattedSpouse = {
      ...rawData.spouse,
      birth_date: formatDate(rawData.spouse?.birth_date),
      registered_date: formatDate(rawData.spouse?.registered_date),
      end_date: formatDate(rawData.spouse?.end_date),
    };
  }

  return {
    principal: formattedPrincipal,
    spouse: formattedSpouse,
    relatives: rawData.principal?.family?.relatives || [],
  };
};
const MemberForm = ({
  type,
  data,
  setOpen,
}: {
  type: "create" | "update";
  data?: any;
  setOpen?: Dispatch<SetStateAction<boolean>>;
}) => {
  console.log("data is:", data);
  const formatDate = (dateStr?: string) =>
    dateStr ? new Date(dateStr).toISOString().split("T")[0] : "";

  const {
    register,
    setValue,
    getValues,
    handleSubmit,
    watch,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FamilyMemberSchema>({
    resolver: zodResolver(familyMemberSchema),
    defaultValues: getFormattedFormValues(data),
  });
  useEffect(() => {
    if (data) {
      // When data arrives, format it and then reset the form
      const formattedData = getFormattedFormValues(data);
      reset(formattedData);
    }
  }, [data, reset]);
  const maritalStatus = useWatch({
    control,
    name: "principal.marital_status",
  });
  const principalSex = useWatch({
    control,
    name: "principal.sex",
  });

  const [tabs, setTabs] = useState(initialTabs);

  useEffect(() => {
    // --- LOGIC FOR A MARRIED PRINCIPAL ---
    if (maritalStatus === "married") {
      // 1. Show the spouse tabs.
      setTabs([
        "Principal Info",
        "Principal detail",
        "Spouse Info",
        "Spouse Detail",
        "Principal Relatives",
      ]);

      // 2. Check if a spouse object already exists in the form's state.
      const existingSpouse = getValues("spouse");

      // 3. If NO spouse data exists, set all the defaults in one go.
      // This block will run for a NEW form, or if the user switches from "single" to "married".
      // It will NOT run when loading an existing married couple for an update.
      if (!existingSpouse) {
        setValue("spouse", {
          // --- Required Fields from Your Schema ---
          first_name: "",
          second_name: "",
          birth_date: new Date(),
          identification_type: "FAYDA",
          sex: principalSex === "Male" ? "Female" : "Male",
          bank_name: "Commercial Bank of Ethiopia",
          green_area: "1",
          block: "",
          phone_number: "", // <-- THIS IS THE FIX. Added the missing required field.

          // --- Your Other Defaults ---
          registered_date: new Date(),
          member_type: "New",
          status: "Active",
          marital_status: "married",
          isPrincipal: false,

          // --- Optional Fields (Good practice to set them explicitly) ---
          last_name: undefined,
          profession: undefined,
          title: undefined,
          job_business: undefined,
          identification_number: undefined,
          citizen: "Ethiopia",
          wereda: undefined,
          zone_or_district: undefined,
          kebele: undefined,
          house_number: undefined,
          phone_number_2: undefined,
          bank_account_number: undefined,
          bank_account_name: undefined,
          email: undefined,
          email_2: undefined,
          remark: undefined,
        });
      }
    } else {
      // 1. Hide the spouse tabs.
      setTabs(initialTabs);

      // 2. Clear out the entire spouse object.
      setValue("spouse", undefined, { shouldValidate: true });
    }
  }, [maritalStatus, setValue, getValues, principalSex]);
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

  const [image, setImageUrl] = useState<{ Url: string; fileId: string } | null>(
    null
  );
  const [phone, setPhone] = useState<string | undefined>(
    data?.principal?.phone_number
  );
  const [phone2, setPhone2] = useState<string | undefined>(
    data?.spouse?.phone_number_2
  );
  const [phone3, setPhone3] = useState<string | undefined>(
    data?.principal?.phone_number
  );
  const [phone4, setPhone4] = useState<string | undefined>(
    data?.spouse?.phone_number_2
  );

  const [principalImage, setPrincipalImage] = useState<{
    Url: string;
    fileId: string;
  } | null>(null);
  const [principalDocument, setPrincipalDocument] = useState<{
    Url: string;
    fileId: string;
  } | null>(null);
  const [principalIdentificationImage, setPrincipalIdentificationImage] =
    useState<{ Url: string; fileId: string } | null>(null);

  const [principalImageReady, setPrincipalImageReady] = useState(true);
  const [principalDocumentReady, setPrincipalDocumentReady] = useState(true);
  const [principalIdReady, setPrincipalIdReady] = useState(true);
  const [spouseImage, setSpouseImage] = useState<{
    Url: string;
    fileId: string;
  } | null>(null);
  const [spouseDocument, setSpouseDocument] = useState<{
    Url: string;
    fileId: string;
  } | null>(null);
  const [spouseIdentificationImage, setSpouseIdentificationImage] = useState<{
    Url: string;
    fileId: string;
  } | null>(null);

  const [spouseImageReady, setSpouseImageReady] = useState(true);
  const [spouseDocumentReady, setSpouseDocumentReady] = useState(true);
  const [spouseIdReady, setSpouseIdReady] = useState(true);

  const [tabIndex, setTabIndex] = useState(0);
  const [state, formAction] = useFormState(
    type === "create" ? createFamily : updateFamily,
    { success: false, error: false }
  );

  useEffect(() => {
    if (data) {
      const formattedData = getFormattedFormValues(data);
      reset(formattedData);

      setRelatives(data.relatives || []);
    }
  }, [data, reset]);
  const selectedIdType = useWatch({
    control,
    name: "principal.identification_type",
  });
  useEffect(() => {
    setValue("principal.identification_number", "");
  }, [selectedIdType, setValue]);

  const getPrincipalImageUrl = async (newImage: {
    Url: string;
    fileId: string;
  }) => {
    try {
      if (
        data?.principal?.image_url &&
        data?.principal?.image_url !== newImage.Url
      ) {
        await fetch("/api/imageKit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: data?.principal?.image_url,
            fileId: data?.principal?.image_file_id,
          }),
        });
      }
      setPrincipalImage({ Url: newImage.Url, fileId: newImage.fileId });
    } catch (err) {
      console.error("Failed to handle image:", err);
    }
  };

  const getPrincipalDocument = async (newDoc: {
    Url: string;
    fileId: string;
  }) => {
    try {
      if (
        data?.principal?.document &&
        data?.principal?.document !== principalDocument?.Url
      ) {
        await fetch("/api/imageKit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: data?.principal?.document,
            fileId: data?.principal?.document_file_id,
          }),
        });
      }
      setPrincipalDocument({ Url: newDoc.Url, fileId: newDoc.fileId });
    } catch (err) {
      console.error("Failed to handle image:", err);
    }
  };
  const getPrincipalIdentificationImage = async (newImage: {
    Url: string;
    fileId: string;
  }) => {
    try {
      if (
        data?.principal?.identification_image &&
        data?.principal?.identification_image !==
          principalIdentificationImage?.Url
      ) {
        await fetch("/api/imageKit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: data?.principal?.identification_image,
            fileId: data?.principal?.identification_file_id,
          }),
        });
      }
      setPrincipalIdentificationImage({
        Url: newImage.Url,
        fileId: newImage.fileId,
      });
    } catch (err) {
      console.error("Failed to handle Identification image:", err);
    }
  };
  const getSpouseImageUrl = async (newImage: {
    Url: string;
    fileId: string;
  }) => {
    try {
      if (data?.spose?.image_url && data?.spose?.image_url !== newImage.Url) {
        await fetch("/api/imageKit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: data?.spose?.image_url,
            fileId: data?.spose?.image_file_id,
          }),
        });
      }
      setSpouseImage({ Url: newImage.Url, fileId: newImage.fileId });
    } catch (err) {
      console.error("Failed to handle image:", err);
    }
  };
  const getSpouseDocument = async (newDoc: { Url: string; fileId: string }) => {
    try {
      if (
        data?.spouse?.document &&
        data?.spouse?.document !== spouseDocument?.Url
      ) {
        await fetch("/api/imageKit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: data?.spouse?.document,
            fileId: data?.spouse?.document_file_id,
          }),
        });
      }
      setSpouseDocument({ Url: newDoc.Url, fileId: newDoc.fileId });
    } catch (err) {
      console.error("Failed to handle image:", err);
    }
  };
  const getSpouseIdentificationImage = async (newImage: {
    Url: string;
    fileId: string;
  }) => {
    try {
      if (
        data?.spouse?.identification_image &&
        data?.spouse?.identification_image !== spouseIdentificationImage?.Url
      ) {
        await fetch("/api/imageKit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: data?.spouse?.identification_image,
            fileId: data?.spouse?.identification_file_id,
          }),
        });
      }
      setSpouseIdentificationImage({
        Url: newImage.Url,
        fileId: newImage.fileId,
      });
    } catch (err) {
      console.error("Failed to handle Identification image:", err);
    }
  };

  const onSubmit = handleSubmit(
    async (formData) => {
      // formData is { principal, spouse, relatives }
      setIsLoading(true);

      // --- Attach file data to the PRINCIPAL object ---
      if (principalImage) {
        formData.principal.image_url = principalImage.Url;
        formData.principal.image_file_id = principalImage.fileId;
      }
      if (principalDocument) {
        formData.principal.document = principalDocument.Url;
        formData.principal.document_file_id = principalDocument.fileId;
      }
      if (principalIdentificationImage) {
        formData.principal.identification_image =
          principalIdentificationImage.Url;
        formData.principal.identification_file_id =
          principalIdentificationImage.fileId;
      }

      // --- Attach file data to the SPOUSE object (if a spouse exists) ---
      if (formData.spouse) {
        if (spouseImage) {
          formData.spouse.image_url = spouseImage.Url;
          formData.spouse.image_file_id = spouseImage.fileId;
        }
        if (spouseDocument) {
          formData.spouse.document = spouseDocument.Url;
          formData.spouse.document_file_id = spouseDocument.fileId;
        }
        if (spouseIdentificationImage) {
          formData.spouse.identification_image = spouseIdentificationImage.Url;
          formData.spouse.identification_file_id =
            spouseIdentificationImage.fileId;
        }
      }

      const submissionData = {
        ...formData,
        relatives: relatives,
      };

      console.log("Submitting prepared data:", submissionData);
      formAction(submissionData);
    },
    // This is the onInvalid callback for handleSubmit
    // This is the onInvalid callback for handleSubmit
    (errors) => {
      // Helper function to extract and prefix error messages.
      const extractErrorMessages = (
        errorObject: Record<string, any> | undefined,
        prefix: string
      ): string[] => {
        // If the errorObject is invalid or doesn't exist, return an empty array.
        if (!errorObject || typeof errorObject !== "object") {
          return [];
        }

        // Otherwise, extract, filter, and prefix the messages.
        return Object.values(errorObject)
          .filter(
            (error): error is FieldError =>
              typeof error === "object" && error !== null && "message" in error
          )
          .map((error) => `${prefix} ${error.message as string}`);
      };

      // Get the form's current state to check the marital status.
      const currentFormValues = getValues();

      // Extract and prefix the errors for both principal and spouse.
      const principalErrorMessages = extractErrorMessages(
        errors.principal,
        "Principal:"
      );
      const spouseErrorMessages = extractErrorMessages(
        errors.spouse,
        "Spouse:"
      );

      // Start building the list of all messages to display.
      let allErrorMessages = [...principalErrorMessages];

      // Only add spouse errors to the list if the principal is married.
      if (currentFormValues.principal?.marital_status === "married") {
        allErrorMessages = [...allErrorMessages, ...spouseErrorMessages];
      }

      // Display the toasts if there are any errors to show.
      if (allErrorMessages.length > 0) {
        // Display a summary toast.
        toast.error("Please fix the following errors:", {
          toastId: "form-error-summary", // Prevents this from being dismissed by other toasts
          // The autoClose property is removed to restore default behavior.
        });

        // Display a toast for each specific validation error.
        allErrorMessages.forEach((msg) => {
          toast.error(msg, {
            toastId: msg, // Uses the message itself as an ID to prevent duplicates
            // The autoClose property is removed to restore default behavior.
          });
        });
      } else if (Object.keys(errors).length > 0) {
        // Fallback for any other unexpected errors that didn't have a message.
        toast.error("Please correct the highlighted errors in the form.", {
          toastId: "generic-form-error",
          // The autoClose property is removed to restore default behavior.
        });
      }

      // Always log the full, raw error object to the console for easier debugging.
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
    setValue("principal.phone_number", phone ?? "");
    setValue("principal.phone_number_2", phone2 ?? "");
    setValue("spouse.phone_number", phone3 ?? "");
    setValue("spouse.phone_number_2", phone4 ?? "");
  }, [phone, setValue, phone2, phone3, phone4]);
  return (
    <div
      className={`${
        type === "update" ? "h-[570px] w-[850px]" : ""
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
        {tabs[tabIndex] === "Principal Info" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[400px] overflow-y-auto custom-scrollbar pr-4">
            {/* Principal Info fields... */}
            <InputField
              label="First Name"
              name="principal.first_name"
              register={register}
              error={errors?.principal?.first_name}
            />
            <InputField
              label="Second Name"
              name="principal.second_name"
              register={register}
              error={errors?.principal?.second_name}
            />
            <InputField
              label="Last Name"
              name="principal.last_name"
              register={register}
              error={errors?.principal?.last_name}
            />
            <InputField
              label="Birth Date"
              name="principal.birth_date"
              type="date"
              register={register}
              error={errors?.principal?.birth_date}
              inputProps={{
                max: formatDate(new Date().toISOString()),
              }}
            />
            <SelectField
              label="Sex"
              name="principal.sex"
              register={register}
              error={errors.principal?.sex}
              options={[
                { value: "", label: "Select Sex" },
                { value: "Male", label: "Male" },
                { value: "Female", label: "Female" },
              ]}
            />
            <SelectField
              label="Marital Status"
              name="principal.marital_status"
              register={register}
              error={errors.principal?.marital_status}
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
              name="principal.title"
              register={register}
              error={errors.principal?.title}
            />

            <InputField
              label="Job/Business"
              name="principal.job_business"
              register={register}
              error={errors.principal?.job_business}
            />

            <InputField
              label="Profession"
              name="principal.profession"
              register={register}
              error={errors.principal?.profession}
            />

            <InputField
              label="Registered Date"
              name="principal.registered_date"
              type="date"
              register={register}
              error={errors.principal?.registered_date}
            />
            <InputField
              label="End Date"
              name="member.end_date"
              type="date"
              register={register}
              error={errors.principal?.end_date}
            />

            <SelectField
              label="Status"
              name="principal.status"
              register={register}
              error={errors.principal?.status}
              options={[
                { value: "", label: "Select Status" },
                { value: "Active", label: "Active" },
                { value: "Inactive", label: "Inactive" },
                { value: "Deceased", label: "Deceased" },
                { value: "Left", label: "Left" },
              ]}
            />

            <SelectField
              label="Status"
              name="principal.member_type"
              register={register}
              error={errors.principal?.member_type}
              options={[
                { value: "", label: "Select Member Type" },
                { value: "New", label: "New" },
                { value: "Existing", label: "Existing" },
              ]}
            />
            <div className="h-8 flex items-end justify-start mt-6">
              <SmallCheckbox
                name="principal.founding_member"
                label="Founding Member"
                register={register}
                error={errors?.principal?.founding_member}
              />
            </div>
            <div className="h-8 flex items-end justify-start mt-6">
              <div className="flex items-center gap-2 mt-6">
                <input
                  type="checkbox"
                  checked={true} // Always checked
                  disabled={true} // Always disabled
                  className="w-4 h-4 text-blue-600 bg-gray-200 border-gray-300 rounded cursor-not-allowed focus:ring-blue-500"
                />
                <label className="text-sm font-medium text-gray-700">
                  Principal
                </label>
                {/* The hidden input ensures the value is submitted correctly */}
                <input
                  type="hidden"
                  {...register("principal.isPrincipal")}
                  value="true"
                />
              </div>
            </div>
            {data && (
              <InputField
                label=""
                name="principal.id"
                register={register}
                error={errors?.principal?.id}
                hidden={true}
                defaultValue={data?.principal?.id}
              />
            )}
          </div>
        )}
        {tabs[tabIndex] === "Principal detail" && (
          <div
            className={`max-h-[400px] overflow-y-auto custom-scrollbar pr-4`}
          >
            {/* Principal detail fields... */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 ">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Citizen
                </label>
                <select
                  {...register("principal.citizen")}
                  className="border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  defaultValue={data?.principal?.citizen ?? "Ethiopia"}
                >
                  <option value="">Select a country</option>
                  {countryList.map(({ code, name }) => (
                    <option key={code} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
                {errors.principal?.citizen && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.principal?.citizen?.message?.toString()}
                  </p>
                )}
              </div>
              <PhoneInputField
                value={phone ?? ""}
                 containerClassName={type === 'update' ? 'md:w-auto' : 'w-full'}
                onChange={(val) => setPhone(val)}
                error={errors?.principal?.phone_number?.message}
              />

              <PhoneInputField
                 containerClassName={type === 'update' ? 'md:w-auto' : 'w-full'}
                value={phone2 ?? ""}
                onChange={(val) => setPhone2(val)}
                error={errors?.principal?.phone_number_2?.message}
              />

              <InputField
                label="Email"
                name="principal.email"
                register={register}
                error={errors.principal?.email}
              />

              <InputField
                label="Second Email"
                name="principal.email_2"
                register={register}
                error={errors.principal?.email_2}
              />

              <InputField
                label="Wereda"
                name="principal.wereda"
                register={register}
                error={errors.principal?.wereda}
              />

              <InputField
                label="Zone / District"
                name="principal.zone_or_district"
                register={register}
                error={errors.principal?.zone_or_district}
              />

              <InputField
                label="Kebele"
                name="principal.kebele"
                register={register}
                error={errors.principal?.kebele}
              />
              <SelectField
                label="Green Area"
                name="principal.green_area"
                register={register}
                error={errors.principal?.green_area}
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
                name="principal.block"
                register={register}
                error={errors.principal?.block}
              />
              <InputField
                label="House Number"
                name="principal.house_number"
                register={register}
                error={errors.principal?.house_number}
              />

              <SelectField
                label="Bank Name"
                name="principal.bank_name"
                register={register}
                error={errors.principal?.bank_name}
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
                name="principal.bank_account_number"
                register={register}
                error={errors.principal?.bank_account_number}
              />

              <InputField
                label="Bank Account Name"
                name="principal.bank_account_name"
                register={register}
                error={errors.principal?.bank_account_name}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Image
                </label>
                {data?.principal?.image_url && (
                  <div className="mb-4 flex items-center gap-4">
                    <Image
                      width={50}
                      height={50}
                      src={data?.principal?.image_url}
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
                  getImageUrl={getPrincipalImageUrl}
                  setImageReady={setPrincipalImageReady}
                  accept="image/*"
                />
              </div>

              {/* Document upload section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document
                </label>
                {data?.principal?.document && (
                  <div className="mb-4 flex items-center gap-4">
                    <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-gray-200">
                      <Link href={data?.principal?.document} target="blanck">
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
                  getImageUrl={getPrincipalDocument}
                  setImageReady={setPrincipalDocumentReady}
                  accept="application/pdf,.pdf"
                />
              </div>
              <div>
                <SelectField
                  label="Identification Type"
                  name="principal.identification_type"
                  register={register}
                  error={errors.principal?.identification_type}
                  options={[
                    { value: "", label: "Select ID Type" },
                    { value: "FAYDA", label: "Fayda" },
                    { value: "KEBELE_ID", label: "Kebel ID" },
                    { value: "PASSPORT", label: "Passport" },
                  ]}
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
                  name="principal.identification_number"
                  register={register}
                  error={errors.principal?.identification_number}
                  inputProps={{
                    placeholder: "Enter ID number",
                  }}
                />
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Identification Image
                </label>
                {data?.principal?.identification_image && (
                  <div className="mb-4 flex items-center gap-4">
                    <Image
                      width={50}
                      height={50}
                      src={data?.principal?.identification_image}
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
                  getImageUrl={getPrincipalIdentificationImage}
                  setImageReady={setPrincipalIdReady}
                  accept="image/*,.pdf"
                />

                {errors.principal?.identification_image && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.principal?.identification_image.message}
                  </p>
                )}
              </div>
              <div className="md:col-span-1 flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Remark
                </label>
                <textarea
                  {...register("principal.remark")}
                  rows={5}
                  className="border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  defaultValue={data?.remark}
                />
                {errors.principal?.remark && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.principal?.remark?.message?.toString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
        {tabs[tabIndex] === "Spouse Info" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[400px] overflow-y-auto custom-scrollbar pr-4">
            {/* Hidden input to ensure a spouse is never a principal from this form */}
            <input
              type="hidden"
              {...register("spouse.isPrincipal")}
              value="false"
            />
            <InputField
              label="First Name"
              name="spouse.first_name" // Changed from member.first_name
              register={register}
              error={errors?.spouse?.first_name} // Changed from errors.member
            />
            <InputField
              label="Second Name"
              name="spouse.second_name" // Changed from member.second_name
              register={register}
              error={errors?.spouse?.second_name} // Changed from errors.member
            />
            <InputField
              label="Last Name"
              name="spouse.last_name" // Changed from member.last_name
              register={register}
              error={errors?.spouse?.last_name} // Changed from errors.member
            />
            <InputField
              label="Birth Date"
              name="spouse.birth_date" // Changed from member.birth_date
              type="date"
              register={register}
              error={errors?.spouse?.birth_date} // Changed from errors.member
              inputProps={{
                max: formatDate(new Date().toISOString()),
              }}
            />

            <SelectField
              label="Sex"
              name="spouse.sex"
              register={register}
              error={errors.spouse?.sex}
              options={[
                { value: "", label: "Select Sex" },
                { value: "Male", label: "Male" },
                { value: "Female", label: "Female" },
              ]}
            />
            <SelectField
              label="Marital Status"
              name="spouse.marital_status"
              register={register}
              error={errors.spouse?.marital_status}
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
              name="spouse.title" // Changed from member.title
              register={register}
              error={errors.spouse?.title} // Changed from errors.member
            />

            <InputField
              label="Job/Business"
              name="spouse.job_business" // Changed from member.job_business
              register={register}
              error={errors.spouse?.job_business} // Changed from errors.member
            />

            <InputField
              label="Profession"
              name="spouse.profession" // Changed from member.profession
              register={register}
              error={errors.spouse?.profession} // Changed from errors.member
            />

            <InputField
              label="Registered Date"
              name="spouse.registered_date" // Changed from member.registered_date
              type="date"
              register={register}
              error={errors.spouse?.registered_date} // Changed from errors.member
            />

            <InputField
              label="End Date"
              name="spouse.end_date" // Changed from member.end_date
              type="date"
              register={register}
              error={errors.spouse?.end_date} // Changed from errors.member
            />

            <SelectField
              label="Status"
              name="spouse.status"
              register={register}
              error={errors.spouse?.status}
              options={[
                { value: "", label: "Select Status" },
                { value: "Active", label: "Active" },
                { value: "Inactive", label: "Inactive" },
                { value: "Deceased", label: "Deceased" },
                { value: "Left", label: "Left" },
              ]}
            />

            <div className="flex flex-col gap-2">
              <SelectField
                label="Status"
                name="spouse.member_type"
                register={register}
                error={errors.spouse?.member_type}
                options={[
                  { value: "", label: "Select Member Type" },
                  { value: "New", label: "New" },
                  { value: "Existing", label: "Existing" },
                ]}
              />
              {errors.spouse?.member_type && (
                <p className="text-xs text-red-500 mt-1">
                  {errors.spouse?.member_type?.message?.toString()}
                </p>
              )}
            </div>
            <div className="h-8 flex items-end justify-start mt-6">
              <SmallCheckbox
                name="spouse.founding_member" // Changed from member.founding_member
                label="Founding Member"
                register={register}
                error={errors?.spouse?.founding_member} // Changed from errors.member
              />
            </div>
            <div className="h-8 flex items-end justify-start mt-6">
              <div className="flex items-center gap-2 mt-6">
                <input
                  type="checkbox"
                  checked={false} // Always checked
                  disabled={true} // Always disabled
                  className="w-4 h-4 text-blue-600 bg-gray-200 border-gray-300 rounded cursor-not-allowed focus:ring-blue-500"
                />
                <label className="text-sm font-medium text-gray-700">
                  Principal
                </label>
                {/* The hidden input ensures the value is submitted correctly */}
                <input
                  type="hidden"
                  {...register("principal.isPrincipal")}
                  value="true"
                />
              </div>
            </div>
            {/* The 'principal' checkbox is intentionally removed for the spouse. */}

            {data?.spouse && (
              <InputField
                label=""
                name="spouse.id" // Changed from member.id
                register={register}
                error={errors?.spouse?.id} // Changed from errors.member
                hidden={true}
                defaultValue={data?.spouse?.id} // RHF handles this
              />
            )}
          </div>
        )}

        {tabs[tabIndex] === "Spouse Detail" && (
          <div
            className={`max-h-[400px] overflow-y-auto custom-scrollbar pr-4`}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 ">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Citizen
                </label>
                <select
                  {...register("spouse.citizen")} // Changed from member.citizen
                  className="border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  defaultValue={data?.spouse?.citizen ?? "Ethiopia"}
                >
                  <option value="">Select a country</option>
                  {countryList.map(({ code, name }) => (
                    <option key={code} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
                {errors.spouse?.citizen && ( // Changed from errors.member
                  <p className="text-xs text-red-500 mt-1">
                    {errors.spouse?.citizen?.message?.toString()}
                  </p>
                )}
              </div>

              {/* NOTE: You will need separate state (e.g., spousePhone, setSpousePhone) for these fields */}
              <PhoneInputField
                value={phone3 ?? ""}
 containerClassName={type === 'update' ? 'md:w-12' : 'w-full'}                onChange={(val) => setPhone3(val)}
                error={errors?.spouse?.phone_number?.message} // Changed from errors.member
              />
              <PhoneInputField
                value={phone4 ?? ""}
                containerClassName={type === "update" ? "md:w-12" : "w-full"}
                onChange={(val) => setPhone4(val)}
                error={errors?.spouse?.phone_number_2?.message} // Changed from errors.member
              />

              <InputField
                label="Email"
                name="spouse.email" // Changed from member.email
                register={register}
                error={errors.spouse?.email} // Changed from errors.member
              />

              <InputField
                label="Second Email"
                name="spouse.email_2" // Changed from member.email_2
                register={register}
                error={errors.spouse?.email_2} // Changed from errors.member
              />

              <InputField
                label="Wereda"
                name="spouse.wereda" // Changed from member.wereda
                register={register}
                error={errors.spouse?.wereda} // Changed from errors.member
              />

              <InputField
                label="Zone / District"
                name="spouse.zone_or_district" // Changed from member.zone_or_district
                register={register}
                error={errors.spouse?.zone_or_district} // Changed from errors.member
              />

              <InputField
                label="Kebele"
                name="spouse.kebele" // Changed from member.kebele
                register={register}
                error={errors.spouse?.kebele} // Changed from errors.member
              />
              <SelectField
                label="Green Area"
                name="spouse.green_area" // Changed from member.green_area
                register={register}
                error={errors.spouse?.green_area} // Changed from errors.member
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
                name="spouse.block" // Changed from member.block
                register={register}
                error={errors.spouse?.block} // Changed from errors.member
              />
              <InputField
                label="House Number"
                name="spouse.house_number" // Changed from member.house_number
                register={register}
                error={errors.spouse?.house_number} // Changed from errors.member
              />

              <SelectField
                label="Bank Name"
                name="spouse.bank_name"
                register={register}
                error={errors.spouse?.bank_name}
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
                name="spouse.bank_account_number" // Changed from member.bank_account_number
                register={register}
                error={errors.spouse?.bank_account_number} // Changed from errors.member
              />

              <InputField
                label="Bank Account Name"
                name="spouse.bank_account_name" // Changed from member.bank_account_name
                register={register}
                error={errors.spouse?.bank_account_name} // Changed from errors.member
              />

              {/* NOTE: You need separate state for spouse images */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Image
                </label>
                {data?.spouse?.image_url && (
                  <div className="mb-4 flex items-center gap-4">
                    <Image
                      width={50}
                      height={50}
                      src={data?.spouse.image_url}
                      alt="Spouse profile preview"
                      className="h-10 w-10 object-cover"
                    />
                    <span className="text-sm text-gray-500">
                      Current profile image
                    </span>
                  </div>
                )}
                <UploadFile
                  text="Upload new profile image"
                  getImageUrl={getSpouseImageUrl}
                  setImageReady={setSpouseImageReady}
                  accept="image/*"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document
                </label>
                {data?.spouse?.document && (
                  <div className="mb-4 flex items-center gap-4">
                    <Link href={data.spouse.document} target="blanck">
                      {/* ... SVG Icon ... */}
                    </Link>
                    <span className="text-sm text-gray-500">
                      Current document
                    </span>
                  </div>
                )}
                <UploadFile
                  text="Upload new document"
                  getImageUrl={getSpouseDocument}
                  setImageReady={setSpouseDocumentReady}
                  accept="application/pdf,.pdf"
                />
              </div>
              <div>
                <SelectField
                  label="Identification Type"
                  name="spouse.identification_type" // Changed from member.identification_type
                  register={register}
                  error={errors.spouse?.identification_type} // Changed from errors.member
                  options={[
                    { value: "", label: "Select ID Type" },
                    { value: "FAYDA", label: "Fayda" },
                    { value: "KEBELE_ID", label: "Kebel ID" },
                    { value: "PASSPORT", label: "Passport" },
                  ]}
                  required
                />
              </div>

              {/* NOTE: This needs to watch 'spouse.identification_type' */}
              {selectedIdType && (
                <InputField
                  label={
                    selectedIdType === "FAYDA"
                      ? "Fayda ID Number"
                      : selectedIdType === "KEBELE_ID"
                      ? "Kebele ID Number"
                      : "Passport Number"
                  }
                  name="spouse.identification_number" // Changed from member.identification_number
                  register={register}
                  error={errors.spouse?.identification_number} // Changed from errors.member
                  inputProps={{
                    placeholder: "Enter ID number",
                  }}
                />
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Identification Image
                </label>
                {data?.spouse?.identification_image && (
                  <div className="mb-4 flex items-center gap-4">
                    <Image
                      width={50}
                      height={50}
                      src={data.spouse.identification_image}
                      alt="Spouse ID preview"
                      className="h-10 w-10 object-cover"
                    />
                    <span className="text-sm text-gray-500">
                      Current Identification image
                    </span>
                  </div>
                )}
                <UploadFile
                  text="Upload Identification Image"
                  getImageUrl={getSpouseIdentificationImage}
                  setImageReady={setSpouseIdReady}
                  accept="image/*,.pdf"
                />

                {errors.spouse?.identification_image && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.spouse?.identification_image.message}
                  </p>
                )}
              </div>
              <div className="md:col-span-1 flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Remark
                </label>
                <textarea
                  {...register("spouse.remark")} // Changed from member.remark
                  rows={5}
                  className="border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  // defaultValue={data?.spouse?.remark} // RHF handles this
                />
                {errors.spouse?.remark && ( // Changed from errors.member
                  <p className="text-xs text-red-500 mt-1">
                    {errors.spouse?.remark?.message?.toString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {tabs[tabIndex] === "Principal Relatives" && (
          <div className="w-full bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-[400px] flex flex-col relative custom-scrollbar">
            {/* Relatives content... */}
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
                        <option value="Mother">Principal Mother</option>
                        <option value="Father"> Principal Father</option>
                        <option value="Sister"> Principal Sister</option>
                        <option value="Brother"> Principal Brother</option>
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
              !principalImageReady ||
              !principalDocumentReady ||
              isLoading ||
              !principalIdReady ||
              !spouseDocumentReady ||
              !spouseImageReady ||
              !spouseIdReady
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

// --- STEP 1: UPDATE THE PROPS INTERFACE ---
// Remove 'type' and add 'containerClassName'.
interface PhoneInputFieldProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  containerClassName?: string; // This will control the outer div's classes
}

const PhoneInputField = ({
  value,
  onChange,
  error,
  // Provide a default value. If no class is passed, it will be full-width.
  containerClassName = "w-full",
}: PhoneInputFieldProps) => {
  return (
    // --- STEP 2: APPLY THE containerClassName TO THE TOP-LEVEL DIV ---
    // This div now controls the overall width and layout of the component.
    <div className={`flex flex-col gap-1 ${containerClassName}`}>
      <label className="text-sm font-medium text-gray-700">Phone Number</label>
      <div className="relative w-full">
        <PhoneInput
          country={"et"}
          value={value}
          onChange={onChange}
          containerClass="w-full" // This should always be w-full to fill its parent
          // --- STEP 3: SIMPLIFY THE inputClass ---
          // The width is now controlled by the parent, so this class becomes simpler.
          inputClass={`w-full px-3 py-2 border ${
            error ? "border-red-500" : "border-gray-300"
          } rounded-md shadow-sm focus:outline-none focus:ring-2 ${
            error
              ? "focus:ring-red-500 focus:border-red-500"
              : "focus:ring-blue-500 focus:border-blue-500"
          } bg-white text-sm`}
          buttonClass="border border-gray-300 rounded-l-md"
          dropdownClass="z-20"
        />
      </div>
      {error && <span className="text-xs text-red-500 mt-1">{error}</span>}
    </div>
  );
};

export default MemberForm;

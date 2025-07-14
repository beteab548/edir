"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { Announcements } from "@prisma/client";
import { announcementSchema } from "@/lib/formValidationSchemas";
import InputField from "./InputField";

type AnnouncementFormValues = z.infer<typeof announcementSchema>;

interface AnnouncementFormModalProps {
  onSubmit: (data: Announcements) => void;
  initialData?: Announcements;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export default function AnnouncementFormModal({
  onSubmit,
  initialData,
  isOpen,
  onClose,
  title,
}: AnnouncementFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if we are editing or creating new
  const isEditing = initialData?.id && initialData.id !== 0;

  const defaultValues = initialData || {
    title: "",
    Description: "",
    calendar: new Date(),
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<z.input<typeof announcementSchema>>({
    resolver: zodResolver(announcementSchema),
    defaultValues,
  });
  useEffect(() => {
    if (initialData) {
      reset({
        title: initialData.title,
        Description: initialData.Description,
        calendar: new Date(initialData.calendar),
      });
    }
  }, [initialData, reset]);

  const handleCalendarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue("calendar", new Date(e.target.value), { shouldValidate: true });
  };

  const calendarValueRaw = watch("calendar");
  const calendarValue =
    calendarValueRaw instanceof Date ? calendarValueRaw : new Date();

  const processSubmit = async (data: AnnouncementFormValues) => {
    setIsSubmitting(true);
    try {
       onSubmit({
        ...data,
        calendar: new Date(data.calendar),
        created_at: initialData?.created_at || new Date(),
        id: initialData?.id ?? 0,
      });
      reset();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start">
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <span className="sr-only">Close</span>
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <form
            onSubmit={handleSubmit(
              processSubmit as (data: any) => Promise<void>,
              (formErrors) => {
                console.error("Validation errors:", formErrors);
              }
            )}
            className="mt-4 space-y-4"
          >
            <div>
              <InputField
                label="Title"
                name="title"
                type="text"
                register={register}
                error={errors.title}
                required
              />
            </div>

            <div>
              <InputField
                label="Description"
                name="Description"
                textarea
                register={register}
                error={errors.Description}
                required
              />
            </div>

            <div>
              <InputField
                label="Calendar Date"
                name="calendar"
                type="datetime-local"
                register={register}
                required
                inputProps={{
                  value: format(calendarValue, "yyyy-MM-dd'T'HH:mm"),
                  onChange: handleCalendarChange,
                }}
              />

              {errors.calendar && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.calendar.message}
                </p>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="inline-flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting
                  ? "Submitting..."
                  : isEditing
                  ? "Update"
                  : "Create"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

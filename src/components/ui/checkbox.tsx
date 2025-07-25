import { FieldError, UseFormRegister } from "react-hook-form";
import React from "react";

interface CheckboxFieldProps {
  name: string;
  label: string;
  register: UseFormRegister<any>;
  error?: FieldError;
  registerOptions?: Parameters<UseFormRegister<any>>[1];
  containerClass?: string;
  hidden?: boolean;
  required?: boolean;
  defaultChecked?: boolean; // <-- ✅ new prop
}

export default function CheckboxField({
  name,
  label,
  register,
  error,
  registerOptions,
  containerClass = "",
  hidden = false,
  required = false,
  defaultChecked = false, // <-- default to false
}: CheckboxFieldProps) {
  return (
    <div
      className={`flex flex-col gap-1 ${containerClass} ${hidden ? "hidden" : ""}`}
    >
      <label className="inline-flex items-center text-sm cursor-pointer">
        <input
          type="checkbox"
          defaultChecked={defaultChecked} // <-- ✅ applied here
          {...register(name, registerOptions)}
          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
        />
        <span className="ml-2 text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </span>
      </label>
      {error && <p className="text-xs text-red-500 mt-1">{error.message}</p>}
    </div>
  );
}

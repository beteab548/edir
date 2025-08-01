import { FieldError, UseFormRegister } from "react-hook-form";
import React from "react";

interface CheckboxFieldProps {
  name: string;
  label: string;
  register: UseFormRegister<any>;
  error?: FieldError;
  defaultChecked?: boolean;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
}

export default function SmallCheckbox({
  name,
  label,
  register,
  error,
  defaultChecked = false,
  inputProps = {},
}: CheckboxFieldProps) {
  
  // Determine if the checkbox should be disabled from the inputProps.
  const isDisabled = inputProps.disabled || inputProps.readOnly;

  return (
    <>
      {/* 
        If disabled, we render a hidden input to ensure the value is submitted.
        This is because disabled inputs are not sent with form submissions.
        We use String() to be safe, and z.coerce.boolean() will handle it.
      */}
      {isDisabled && (
        <input type="hidden" {...register(name)} value={String(defaultChecked)} />
      )}

      <label className="inline-flex items-center text-sm cursor-pointer">
        <input
          type="checkbox"
          // We only register the input if it's NOT disabled.
          // The hidden input handles submission for disabled fields.
          {...(isDisabled ? {} : register(name))}
          // Apply any other inputProps, like className.
          {...inputProps}
          // Set the default checked state.
          defaultChecked={defaultChecked}
          // *** THE CRITICAL FIX ***
          // Explicitly apply the 'disabled' attribute AFTER the register spread.
          // This guarantees that our 'disabled' prop wins and is not overridden.
          disabled={isDisabled}
          className={`w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 ${
            isDisabled ? "cursor-not-allowed opacity-70" : ""
          } ${inputProps.className || ""}`}
        />
        <span
          className={`ml-2 text-gray-700 ${
            isDisabled ? "opacity-70" : ""
          }`}
        >
          {label}
        </span>
      </label>
      {error && <p className="text-xs text-red-500 mt-1">{error.message}</p>}
    </>
  );
}
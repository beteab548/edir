"use client";

import { FieldError, UseFormRegister } from "react-hook-form";
import React from "react";

// --- STEP 1: UPDATE THE PROPS INTERFACE ---
interface CheckboxFieldProps {
  name: string;
  label: string;
  
  // Make RHF props OPTIONAL, as they won't be used in the FilterBar
  register?: UseFormRegister<any>;
  error?: FieldError;
  
  // Add standard "controlled component" props, also OPTIONAL
  checked?: boolean;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  
  // Keep other props for flexibility
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
}

export default function SmallCheckbox({
  name,
  label,
  register,
  error,
  checked,
  onChange,
  inputProps = {},
}: CheckboxFieldProps) {
  
  // If the register function is provided, spread its props. Otherwise, do nothing.
  const registrationProps = register ? register(name) : {};
  const isDisabled = inputProps.disabled || inputProps.readOnly;

  return (
    <>
      {/* This logic for a disabled/readonly state is still useful */}
      {isDisabled && (
        <input
          type="hidden"
          {...registrationProps}
          name={name}
          value={String(checked)}
        />
      )}

      <label className="inline-flex items-center text-sm cursor-pointer">
        <input
          type="checkbox"
          id={name}
          
          // --- STEP 2: APPLY PROPS CORRECTLY ---
          
          // 1. Spread any props from React Hook Form's register function
          {...registrationProps}
          
          // 2. Apply the controlled component props. If provided, `checked` and `onChange`
          //    from here will correctly control the input's state.
          checked={checked}
          onChange={onChange}
          
          // 3. Spread any other native input props like disabled, className, etc.
          {...inputProps}
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
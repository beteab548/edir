// components/SelectField.tsx
import { FieldError, UseFormRegister } from "react-hook-form";
import { ReactNode } from "react";

interface SelectFieldProps {
  label: string;
  name: string;
  register: UseFormRegister<any>;
  error?: FieldError;
  options: { value: string; label: string }[];
  selectProps?: React.SelectHTMLAttributes<HTMLSelectElement>;
  defaultValue?: string;
  containerClass?: string;
  required?: boolean;
  icon?: ReactNode;
  registerOptions?: Parameters<UseFormRegister<any>>[1];
}

export default function SelectField({
  label,
  name,
  register,
  error,
  options,
  selectProps = {},
  defaultValue = "",
  containerClass = "",
  required = false,
  icon,
  registerOptions,
}: SelectFieldProps) {
  return (
    <div className={`flex flex-col gap-1 ${containerClass}`}>
      {label && (
        <label htmlFor={name} className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className={`relative ${icon ? "flex items-center" : ""}`}>
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        <select
          id={name}
          {...register(name, registerOptions)}
          {...selectProps}
          defaultValue={defaultValue}
          className={`w-full px-3 py-2 border ${
            error ? "border-red-500" : "border-gray-300"
          } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:${
            error ? "ring-red-500" : "ring-blue-500"
          } focus:border-${error ? "red-500" : "blue-500"} bg-white ${
            icon ? "pl-2" : ""
          } ${selectProps.className ? selectProps.className : ""}`}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error.message}</p>}
    </div>
  );
}

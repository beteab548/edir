import { FieldError, UseFormRegister } from "react-hook-form";
import { ReactNode } from "react";

interface InputFieldProps {
  label?: string;
  name: string;
  type?: string;
  register: UseFormRegister<any>;
  error?: FieldError;
  inputProps?: React.InputHTMLAttributes<
    HTMLInputElement | HTMLTextAreaElement
  >;
  defaultValue?: string | number;
  hidden?: boolean;
  containerClass?: string;
  required?: boolean;
  icon?: ReactNode;
  registerOptions?: Parameters<UseFormRegister<any>>[1];
  textarea?: boolean;
}

export default function InputField({
  label,
  name,
  type = "text",
  register,
  error,
  inputProps = {},
  defaultValue = "",
  hidden = false,
  containerClass = "",
  required = false,
  icon,
  registerOptions,
  textarea = false,
}: InputFieldProps) {
  return (
    <div
      className={`flex flex-col gap-1 ${containerClass} ${
        hidden ? "hidden" : ""
      }`}
    >
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
        {textarea ? (
          <textarea
            id={name}
            {...register(name, registerOptions)}
            {...inputProps}
            defaultValue={defaultValue}
            className={`w-full px-3 py-2 border ${
              error ? "border-red-500" : "border-gray-300"
            } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:${
              error ? "ring-red-500" : "ring-blue-500"
            } focus:border-${error ? "red-500" : "blue-500"} ${
              icon ? "pl-2" : ""
            } ${inputProps.className ? inputProps.className : ""}`}
          />
        ) : (
          <input
            id={name}
            type={type}
            {...register(name, registerOptions)}
            {...inputProps}
            defaultValue={defaultValue}
            className={`w-full px-3 py-2 border ${
              error ? "border-red-500" : "border-gray-300"
            } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:${
              error ? "ring-red-500" : "ring-blue-500"
            } focus:border-${error ? "red-500" : "blue-500"} ${
              icon ? "pl-2" : ""
            } ${inputProps.className ? inputProps.className : ""}`}
          />
        )}
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error.message}</p>}
    </div>
  );
}

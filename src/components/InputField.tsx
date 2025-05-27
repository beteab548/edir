// components/InputField.tsx
import { FieldError, UseFormRegister } from "react-hook-form";

interface InputFieldProps {
  label: string;
  name: string;
  type?: string;
  register: UseFormRegister<any>;
  error?: FieldError;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
defaultValue?: string | number;
hidden?: boolean;
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
}: InputFieldProps) {
  return (
    <div className="flex flex-col w-48">
      <label htmlFor={name} className="mb-1 font-medium">
        {label}
      </label>
      <input
        id={name}
        type={type}
        hidden={hidden}
        {...register(name)}
        {...inputProps}
        defaultValue={defaultValue}
        className={`input input-bordered w-full ${
          error ? "input-error" : ""
        }`}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error.message}</p>}
    </div>
  );
}

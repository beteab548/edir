// components/SelectField.tsx
import { FieldError, UseFormRegister } from "react-hook-form";

interface SelectFieldProps {
  label: string;
  name: string;
  register: UseFormRegister<any>;
  error?: FieldError;
  options: { value: string; label: string }[];
  selectProps?: React.SelectHTMLAttributes<HTMLSelectElement>;
  defaultValue?: string;
}

export default function SelectField({
  label,
  name,
  register,
  error,
  options,
  selectProps = {},
  defaultValue = "",
}: SelectFieldProps) {
  return (
    <div className="form-control w-full">
      <label className="label">
        <span className="label-text">{label}</span>
      </label>
      <select
        id={name}
        {...register(name)}
        {...selectProps}
        defaultValue={defaultValue}
        className={`select select-bordered w-full ${error ? 'select-error' : ''}`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <span className="text-error text-sm">{error.message}</span>}
    </div>
  );
}
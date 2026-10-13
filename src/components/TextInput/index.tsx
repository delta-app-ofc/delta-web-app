import type { InputHTMLAttributes } from "react";
import "./style.css";

interface TextInputProps {
  id: string;
  label: string;
  type: "text" | "email" | "password" | "tel" | "date";
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"];
  maxLength?: number;
}

export function TextInput({
  id,
  label,
  type,
  placeholder,
  value,
  onChange,
  autoComplete,
  inputMode,
  maxLength,
}: TextInputProps) {
  return (
    <div className="text-input-group">
      <label className="sr-only" htmlFor={id}>
        {label}
      </label>

      <input
        id={id}
        className="text-input"
        type={type}
        placeholder={placeholder}
        value={value}
        autoComplete={autoComplete}
        inputMode={inputMode}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
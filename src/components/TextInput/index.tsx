import "./style.css";

interface TextInputProps {
  id: string;
  label: string;
  type: "text" | "email" | "password";
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  required?: boolean;
  disabled?: boolean;
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
  required,
  disabled,
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
        required={required}
        disabled={disabled}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

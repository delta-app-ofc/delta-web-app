import "./style.css";

interface TextInputProps {
  id: string;
  label: string;
  type: "text" | "email" | "password";
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
}

export function TextInput({
  id,
  label,
  type,
  placeholder,
  value,
  onChange,
  autoComplete,
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
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
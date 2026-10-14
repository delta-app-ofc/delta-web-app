import "./style.css";

interface RegisterButtonProps {
  children?: string;
  disabled?: boolean;
}

export function RegisterButton({
  children = "Continuar",
  disabled = false,
}: RegisterButtonProps) {
  return (
    <button className="register-button" type="submit" disabled={disabled}>
      <span>{children}</span>
      <span className="register-button__arrow" aria-hidden="true">
        →
      </span>
    </button>
  );
}

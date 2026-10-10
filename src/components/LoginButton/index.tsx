import "./style.css";

interface LoginButtonProps {
  isLoading?: boolean;
}

export function LoginButton({
  isLoading = false,
}: LoginButtonProps) {
  return (
    <button
      className="login-button"
      type="submit"
      disabled={isLoading}
    >
      <span>
        {isLoading ? "Entrando..." : "Entrar"}
      </span>

      {!isLoading && (
        <span
          className="login-button__arrow"
          aria-hidden="true"
        >
          →
        </span>
      )}
    </button>
  );
}
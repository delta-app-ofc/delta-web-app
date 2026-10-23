import styles from "./styles.module.css";

interface AsyncFeedbackProps {
  status: "loading" | "error";
  message: string;
  onRetry?: () => void;
}

export function AsyncFeedback({ status, message, onRetry }: AsyncFeedbackProps) {
  return (
    <section className={styles.feedback} role={status === "error" ? "alert" : "status"} aria-live={status === "error" ? "assertive" : "polite"}>
      {status === "loading" && <span className={styles.spinner} aria-hidden="true" />}
      <p>{message}</p>
      {status === "error" && onRetry && <button type="button" onClick={onRetry}>Tentar novamente</button>}
    </section>
  );
}

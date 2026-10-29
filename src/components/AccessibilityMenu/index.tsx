import { useEffect, useState } from "react";

import { useDialogFocus } from "../../hooks/useDialogFocus";

import "./style.css";

interface AccessibilityPreferences {
  version: 1;
  highContrast: boolean;
  largeText: boolean;
  grayscale: boolean;
  reducedMotion: boolean;
  underlineLinks: boolean;
}

type PreferenceName = Exclude<keyof AccessibilityPreferences, "version">;

const STORAGE_KEY = "delta.accessibility";
const defaultPreferences: AccessibilityPreferences = {
  version: 1,
  highContrast: false,
  largeText: false,
  grayscale: false,
  reducedMotion: false,
  underlineLinks: false,
};

function readPreferences(): AccessibilityPreferences {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    if (typeof value !== "object" || value === null || !("version" in value) || value.version !== 1) {
      return defaultPreferences;
    }
    const candidate = value as Record<string, unknown>;
    const names: PreferenceName[] = ["highContrast", "largeText", "grayscale", "reducedMotion", "underlineLinks"];
    if (names.some((name) => typeof candidate[name] !== "boolean")) return defaultPreferences;
    return { ...defaultPreferences, ...candidate, version: 1 } as AccessibilityPreferences;
  } catch {
    return defaultPreferences;
  }
}

const options: readonly { name: PreferenceName; label: string; description: string }[] = [
  { name: "highContrast", label: "Alto contraste", description: "Reforça cores, textos e contornos." },
  { name: "largeText", label: "Aumentar textos", description: "Amplia a interface para facilitar a leitura." },
  { name: "grayscale", label: "Escala de cinza", description: "Remove as cores do conteúdo principal." },
  { name: "reducedMotion", label: "Reduzir animações", description: "Minimiza movimentos e transições." },
  { name: "underlineLinks", label: "Destacar links", description: "Sublinha links para facilitar a identificação." },
] as const;

export function AccessibilityMenu() {
  const [open, setOpen] = useState(false);
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(readPreferences);
  const dialogRef = useDialogFocus<HTMLElement>(open, () => setOpen(false));

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("a11y-high-contrast", preferences.highContrast);
    root.classList.toggle("a11y-large-text", preferences.largeText);
    root.classList.toggle("a11y-grayscale", preferences.grayscale);
    root.classList.toggle("a11y-reduced-motion", preferences.reducedMotion);
    root.classList.toggle("a11y-underline-links", preferences.underlineLinks);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences]);

  function toggle(name: PreferenceName) {
    setPreferences((current) => ({ ...current, [name]: !current[name] }));
  }

  function reset() {
    setPreferences(defaultPreferences);
  }

  return (
    <>
      <button
        className="accessibility-trigger"
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="accessibility-panel"
        onClick={() => setOpen(true)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <circle cx="12" cy="4" r="2" />
          <path d="M5 7.5h14M12 7.5v5.25m0 0-4 7.25m4-7.25L16 20M8.25 9.5 6.5 14m9.25-4.5 1.75 4.5" />
        </svg>
        <span>Acessibilidade</span>
      </button>

      {open && (
        <div className="accessibility-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
          <section
            ref={dialogRef}
            id="accessibility-panel"
            className="accessibility-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="accessibility-title"
          >
            <header>
              <div>
                <h2 id="accessibility-title">Acessibilidade</h2>
                <p>Personalize a visualização da plataforma.</p>
              </div>
              <button className="accessibility-close" type="button" aria-label="Fechar painel de acessibilidade" onClick={() => setOpen(false)}>
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m6 6 12 12M18 6 6 18" /></svg>
              </button>
            </header>

            <div className="accessibility-options">
              {options.map((option) => (
                <div className="accessibility-option" key={option.name}>
                  <div>
                    <strong>{option.label}</strong>
                    <span>{option.description}</span>
                  </div>
                  <button
                    className="accessibility-switch"
                    type="button"
                    role="switch"
                    aria-checked={preferences[option.name]}
                    aria-label={option.label}
                    onClick={() => toggle(option.name)}
                  >
                    <span aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>

            <footer>
              <button type="button" onClick={reset}>Restaurar padrão</button>
              <button className="accessibility-done" type="button" onClick={() => setOpen(false)}>Concluído</button>
            </footer>
          </section>
        </div>
      )}
    </>
  );
}

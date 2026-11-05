import { FormEvent, useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { AppSidebar } from "../../components/AppSidebar";
import { AsyncFeedback } from "../../components/AsyncFeedback";
import { createDevice } from "../../services/devices";
import { listInstallations } from "../../services/installations";
import { ApiError } from "../../services/http";
import type { InstallationRecord } from "../../types/installation";
import { formatInstallationLabel } from "../../utils/installations";
import backArrowIcon from "../../assets/devices/arrow2.png";
import selectArrowIcon from "../../assets/devices/arrow.png";

import "./style.css";

interface Installation {
  id: number;
  name: string;
  region: string | null;
}

interface DeviceLinkLocationState {
  installation?: Installation;
}

export function DeviceLinkPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as DeviceLinkLocationState | null;
  const initialInstallation = locationState?.installation;
  const [installations, setInstallations] = useState<Installation[]>(initialInstallation ? [{ ...initialInstallation, name: formatInstallationLabel(initialInstallation.name) ?? initialInstallation.name }] : []);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState("");
  const [installationId, setInstallationId] = useState<number | null>(initialInstallation?.id ?? null);
  const [isInstallationListOpen, setIsInstallationListOpen] = useState(false);
  const listboxId = useId();
  const selectTriggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const selectedInstallation = installations.find((installation) => installation.id === installationId) ?? installations[0];

  useEffect(() => {
    const controller = new AbortController();
    async function load(): Promise<void> {
      try {
        const records = await listInstallations(controller.signal);
        if (controller.signal.aborted) return;
        const values = records.map((record: InstallationRecord) => ({ id: record.id, name: formatInstallationLabel(record.name) ?? record.name, region: null }));
        setInstallations(values);
        setInstallationId((current) => current !== null && values.some((item) => item.id === current) ? current : values[0]?.id ?? null);
      } catch (error: unknown) {
        if (!controller.signal.aborted) setLoadError(error instanceof ApiError ? error.message : "Não foi possível carregar as instalações.");
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!isInstallationListOpen) return;
    const selectedIndex = Math.max(0, installations.findIndex((item) => item.id === installationId));
    requestAnimationFrame(() => optionRefs.current[selectedIndex]?.focus());
  }, [installationId, installations, isInstallationListOpen]);

  function closeInstallationList(returnFocus = false) {
    setIsInstallationListOpen(false);
    if (returnFocus) requestAnimationFrame(() => selectTriggerRef.current?.focus());
  }

  function handleOptionKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = index;
    if (event.key === "ArrowDown") next = (index + 1) % installations.length;
    else if (event.key === "ArrowUp") next = (index + installations.length - 1) % installations.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = installations.length - 1;
    else if (event.key === "Escape") { event.preventDefault(); closeInstallationList(true); return; }
    else return;
    event.preventDefault();
    optionRefs.current[next]?.focus();
  }

  async function saveDevice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedDeviceId = deviceId.trim().toUpperCase();
    const installation = installations.find((item) => item.id === installationId);

    if (!normalizedDeviceId || !installation || installationId === null || isSaving) {
      return;
    }
    setSaveError(null);
    setIsSaving(true);
    try {
      await createDevice(installationId, normalizedDeviceId, new AbortController().signal);
      navigate("/dispositivos");
    } catch (error: unknown) {
      setSaveError(error instanceof ApiError ? error.message : "Não foi possível salvar o dispositivo.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="device-link-page">
      <div className="device-link-page__sidebar">
        <AppSidebar label="Navegação principal" />
      </div>

      <section id="page-content" tabIndex={-1} className="device-link-page__content" aria-labelledby="device-link-page-title">
        <h1 id="device-link-page-title">Dispositivos</h1>

        <button className="device-link-page__back" type="button" onClick={() => navigate("/dispositivos")}>
          <img src={backArrowIcon} alt="" />
          <span>Vincular novo dispositivo</span>
        </button>

        {isLoading && <AsyncFeedback status="loading" message="Carregando instalações…" />}
        {loadError && <AsyncFeedback status="error" message={loadError} onRetry={() => window.location.reload()} />}
        {saveError && <p className="device-link-error" role="alert">{saveError}</p>}
        <form className="device-link-form" onSubmit={saveDevice}>
          <div className="device-link-form__fields">
            <section className="device-link-card" aria-labelledby="device-data-title">
              <h2 id="device-data-title">Vincular dispositivo</h2>
              <label htmlFor="device-id">ID do hidrômetro</label>
              <input
                id="device-id"
                value={deviceId}
                onChange={(event) => setDeviceId(event.target.value)}
                placeholder="Ex. DELTA-ESP32-000184"
                autoComplete="off"
                maxLength={100}
                required
              />
            </section>

            <section className="device-link-card" aria-labelledby="installation-data-title">
              <h2 id="installation-data-title">Vincular à instalação</h2>
              <div
                className={`device-link-select ${isInstallationListOpen ? "device-link-select--open" : ""}`}
                onBlur={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget)) {
                    setIsInstallationListOpen(false);
                  }
                }}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    setIsInstallationListOpen(false);
                  }
                }}
              >
                <button
                  ref={selectTriggerRef}
                  className="device-link-select__trigger"
                  type="button"
                  aria-haspopup="listbox"
                  aria-expanded={isInstallationListOpen}
                  aria-controls={listboxId}
                  onClick={() => setIsInstallationListOpen((currentValue) => !currentValue)}
                >
                  <span>{selectedInstallation?.name ?? "Selecione uma instalação"}</span>
                  <img src={selectArrowIcon} alt="" aria-hidden="true" />
                </button>

                {isInstallationListOpen && (
                  <ul id={listboxId} className="device-link-select__options" role="listbox" aria-label="Instalação">
                    {installations.map((installation, index) => (
                      <li key={installation.id} role="presentation">
                        <button
                          ref={(element) => { optionRefs.current[index] = element; }}
                          type="button"
                          role="option"
                          aria-selected={installation.id === installationId}
                          onClick={() => {
                            setInstallationId(installation.id);
                            closeInstallationList(true);
                          }}
                          onKeyDown={(event) => handleOptionKeyDown(event, index)}
                        >
                          {installation.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <p>O vínculo será salvo no backend. Status de conectividade e bateria dependem de leituras que ainda não fazem parte deste contrato.</p>
            </section>
          </div>

          <button className="device-link-form__submit" type="submit" disabled={!deviceId.trim() || !selectedInstallation || isLoading || isSaving}>
            {isSaving ? "Salvando…" : "Salvar dispositivo"}
          </button>
        </form>
      </section>
    </main>
  );
}


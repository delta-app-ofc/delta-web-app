import { FormEvent, useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { AppSidebar } from "../../components/AppSidebar";
import backArrowIcon from "../../assets/devices/arrow2.png";
import selectArrowIcon from "../../assets/devices/arrow.png";

import "./style.css";

interface Installation {
  id: string;
  name: string;
  region: string;
}

interface DeviceLinkLocationState {
  installation?: Installation;
}

const installations: readonly Installation[] = [
  { id: "vila-leopoldina", name: "Loja swift - Vila Leopoldina", region: "São Paulo - SP" },
  { id: "vila-romana", name: "Loja swift - Vila Romana", region: "São Paulo - SP" },
  { id: "perdizes", name: "Loja swift - Perdizes", region: "São Paulo - SP" },
  { id: "pinheiros", name: "Loja swift - Pinheiros", region: "São Paulo - SP" },
  { id: "moema", name: "Loja swift - Moema", region: "São Paulo - SP" },
  { id: "sorocaba", name: "Loja swift - Sorocaba", region: "São Paulo - SP" },
  { id: "mooca", name: "Loja swift - Mooca", region: "São Paulo - SP" },
];

export function DeviceLinkPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as DeviceLinkLocationState | null;
  const initialInstallation = locationState?.installation ?? installations[0];
  const [deviceId, setDeviceId] = useState("");
  const [installationId, setInstallationId] = useState(initialInstallation.id);
  const [isInstallationListOpen, setIsInstallationListOpen] = useState(false);
  const listboxId = useId();
  const selectTriggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const selectedInstallation = installations.find((installation) => installation.id === installationId)
    ?? installations[0];

  useEffect(() => {
    if (!isInstallationListOpen) return;
    const selectedIndex = Math.max(0, installations.findIndex((item) => item.id === installationId));
    requestAnimationFrame(() => optionRefs.current[selectedIndex]?.focus());
  }, [installationId, isInstallationListOpen]);

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

  function saveDevice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedDeviceId = deviceId.trim().toUpperCase();
    const installation = installations.find((item) => item.id === installationId);

    if (!normalizedDeviceId || !installation) {
      return;
    }

    navigate("/dispositivos", {
      state: {
        linkedDevice: {
          id: normalizedDeviceId,
          installationId: installation.id,
          installation: installation.name,
          region: installation.region,
        },
      },
    });
  }

  return (
    <main className="device-link-page">
      <div className="device-link-page__sidebar">
        <AppSidebar
          label="Navegação principal"
          profile={{ name: "Talita", email: "talita@delta.com.br" }}
        />
      </div>

      <section id="page-content" tabIndex={-1} className="device-link-page__content" aria-labelledby="device-link-page-title">
        <h1 id="device-link-page-title">Dispositivos</h1>

        <button className="device-link-page__back" type="button" onClick={() => navigate("/dispositivos")}>
          <img src={backArrowIcon} alt="" />
          <span>Vincular novo dispositivo</span>
        </button>

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
                  <span>{selectedInstallation.name}</span>
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
              <p>
                Depois de pareado, o dispositivo aparece conectado e com bateria 100%; o status real passa a
                ser reportado nas próximas leituras.
              </p>
            </section>
          </div>

          <button className="device-link-form__submit" type="submit" disabled={!deviceId.trim()}>
            Salvar dispositivo
          </button>
        </form>
      </section>
    </main>
  );
}


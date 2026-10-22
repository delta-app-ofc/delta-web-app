import { FormEvent, useState } from "react";
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
  const selectedInstallation = installations.find((installation) => installation.id === installationId)
    ?? installations[0];

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

      <section className="device-link-page__content" aria-labelledby="device-link-page-title">
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
                  className="device-link-select__trigger"
                  type="button"
                  aria-haspopup="listbox"
                  aria-expanded={isInstallationListOpen}
                  onClick={() => setIsInstallationListOpen((currentValue) => !currentValue)}
                >
                  <span>{selectedInstallation.name}</span>
                  <img src={selectArrowIcon} alt="" aria-hidden="true" />
                </button>

                {isInstallationListOpen && (
                  <ul className="device-link-select__options" role="listbox" aria-label="Instalação">
                    {installations.map((installation) => (
                      <li key={installation.id} role="presentation">
                        <button
                          type="button"
                          role="option"
                          aria-selected={installation.id === installationId}
                          onClick={() => {
                            setInstallationId(installation.id);
                            setIsInstallationListOpen(false);
                          }}
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


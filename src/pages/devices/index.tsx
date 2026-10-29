import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { AppSidebar } from "../../components/AppSidebar";
import devicesIcon from "../../assets/devices/devices.png";
import onlineIcon from "../../assets/devices/online.png";
import lowBatteryIcon from "../../assets/devices/low-battery.png";
import noLinkIcon from "../../assets/devices/no-link.png";
import linkIcon from "../../assets/devices/link.png";
import batteryFullIcon from "../../assets/devices/battery1.png";
import batteryLowIcon from "../../assets/devices/battery2.png";
import batteryMediumIcon from "../../assets/devices/battery3.png";
import batteryCriticalIcon from "../../assets/devices/battery4.png";
import batteryGoodIcon from "../../assets/devices/baterry5.png";

import "./style.css";

interface Device {
  id: string;
  installation: string;
  location: string;
  connectivity: "Online" | "Offline";
  battery: number;
  batteryIcon: string;
  batteryType: "good" | "warning" | "critical";
}

interface UnlinkedInstallation {
  id: string;
  name: string;
  region: string;
}

interface DevicesLocationState {
  linkedDevice?: {
    id: string;
    installationId: string;
    installation: string;
    region: string;
  };
}

const initialDevices: readonly Device[] = [
  {
    id: "DELTA-ESP32-000184",
    installation: "Loja swift - Vila Leopoldina",
    location: "São Paulo - SP",
    connectivity: "Online",
    battery: 100,
    batteryIcon: batteryFullIcon,
    batteryType: "good",
  },
  {
    id: "DELTA-ESP32-000067",
    installation: "Loja swift - Vila Romana",
    location: "São Paulo - SP",
    connectivity: "Online",
    battery: 20,
    batteryIcon: batteryLowIcon,
    batteryType: "critical",
  },
  {
    id: "DELTA-ESP32-000133",
    installation: "Loja swift - Perdizes",
    location: "São Paulo - SP",
    connectivity: "Online",
    battery: 67,
    batteryIcon: batteryMediumIcon,
    batteryType: "warning",
  },
  {
    id: "DELTA-ESP32-000143",
    installation: "Loja swift - Pinheiros",
    location: "São Paulo - SP",
    connectivity: "Offline",
    battery: 85,
    batteryIcon: batteryGoodIcon,
    batteryType: "good",
  },
  {
    id: "DELTA-ESP32-000134",
    installation: "Loja swift - Moema",
    location: "São Paulo - SP",
    connectivity: "Offline",
    battery: 10,
    batteryIcon: batteryCriticalIcon,
    batteryType: "critical",
  },
];

const initialUnlinkedInstallations: readonly UnlinkedInstallation[] = [
  { id: "sorocaba", name: "Loja swift - Sorocaba", region: "São Paulo - SP" },
  { id: "mooca", name: "Loja swift - Mooca", region: "São Paulo - SP" },
];

export function DevicesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as DevicesLocationState | null;
  const linkedDevice = locationState?.linkedDevice;
  const [search, setSearch] = useState("");
  const [devices] = useState<readonly Device[]>(() => linkedDevice
    ? [
        ...initialDevices,
        {
          id: linkedDevice.id,
          installation: linkedDevice.installation,
          location: linkedDevice.region,
          connectivity: "Online",
          battery: 100,
          batteryIcon: batteryFullIcon,
          batteryType: "good",
        },
      ]
    : initialDevices,
  );
  const [unlinkedInstallations] = useState<readonly UnlinkedInstallation[]>(() =>
    linkedDevice
      ? initialUnlinkedInstallations.filter((installation) => installation.id !== linkedDevice.installationId)
      : initialUnlinkedInstallations,
  );

  const filteredDevices = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR");

    if (!normalizedSearch) {
      return devices;
    }

    return devices.filter((device) =>
      `${device.id} ${device.installation}`.toLocaleLowerCase("pt-BR").includes(normalizedSearch),
    );
  }, [devices, search]);

  const indicators = [
    { id: "paired", label: "Dispositivos pareados", value: `${linkedDevice ? 9 : 8} de 10`, icon: devicesIcon },
    { id: "online", label: "Online agora", value: `${linkedDevice ? 8 : 7} de 8`, icon: onlineIcon },
    { id: "battery", label: "Bateria baixa", value: "2", detail: "Trocar em breve", icon: lowBatteryIcon },
    { id: "unlinked", label: "Sem vínculo", value: `${unlinkedInstallations.length} de 10`, icon: noLinkIcon },
  ] as const;

  return (
    <main className="devices-page">
      <div className="devices-page__sidebar">
        <AppSidebar
          label="Navegação principal"
          profile={{ name: "Talita", email: "talita@delta.com.br" }}
        />
      </div>

      <section id="page-content" tabIndex={-1} className="devices-page__content" aria-labelledby="devices-title">
        <header className="devices-header">
          <h1 id="devices-title">Dispositivos</h1>
          <div className="devices-header__controls">
            <label className="devices-search" htmlFor="device-search">
              <span aria-hidden="true" />
              <input
                id="device-search"
                type="search"
                placeholder="Buscar por ID ou instalação"
                value={search}
                maxLength={100}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            <button className="devices-link-button devices-link-button--primary" type="button" onClick={() => navigate("/dispositivos/vincular")}>
              <img src={linkIcon} alt="" />
              <span>Vincular dispositivo</span>
            </button>
          </div>
        </header>

        <section className="devices-indicators" aria-label="Resumo dos dispositivos">
          {indicators.map((indicator) => (
            <article className="devices-card devices-indicator" key={indicator.id}>
              <div className="devices-indicator__label">
                <img src={indicator.icon} alt="" />
                <span>{indicator.label}</span>
              </div>
              <strong>{indicator.value}</strong>
              {"detail" in indicator && <small>{indicator.detail}</small>}
            </article>
          ))}
        </section>

        <div className="devices-card devices-table-wrapper">
          <table className="devices-table">
            <caption className="sr-only">Dispositivos vinculados às instalações</caption>
            <thead>
              <tr>
                <th scope="col">Dispositivo</th>
                <th scope="col">Instalação</th>
                <th scope="col">Conectividade</th>
                <th scope="col">Bateria</th>
              </tr>
            </thead>
            <tbody>
              {filteredDevices.map((device) => (
                <tr key={device.id}>
                  <td>{device.id}</td>
                  <td>
                    <strong>{device.installation}</strong>
                    <small>{device.location}</small>
                  </td>
                  <td>
                    <span className={`devices-connectivity devices-connectivity--${device.connectivity.toLowerCase()}`}>
                      {device.connectivity}
                    </span>
                  </td>
                  <td>
                    <span className={`devices-battery devices-battery--${device.batteryType}`}>
                      <img src={device.batteryIcon} alt="" />
                      <span>{device.battery}%</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredDevices.length === 0 && <p className="devices-empty">Nenhum dispositivo encontrado.</p>}
        </div>

        <section className="devices-unlinked" aria-labelledby="unlinked-installations-title">
          <h2 id="unlinked-installations-title">Instalações sem dispositivo vinculado</h2>
          <div className="devices-card devices-unlinked__table-wrapper">
            <table>
              <caption className="sr-only">Instalações sem dispositivo vinculado</caption>
              <thead>
                <tr>
                  <th scope="col">Instalação</th>
                  <th scope="col">Região</th>
                  <th scope="col"><span className="sr-only">Ações</span></th>
                </tr>
              </thead>
              <tbody>
                {unlinkedInstallations.map((installation) => (
                  <tr key={installation.id}>
                    <td>{installation.name}</td>
                    <td>{installation.region}</td>
                    <td>
                      <button
                        className="devices-link-button"
                        type="button"
                        onClick={() => navigate("/dispositivos/vincular", { state: { installation } })}
                      >
                        <img src={linkIcon} alt="" />
                        <span>Vincular dispositivo</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {unlinkedInstallations.length === 0 && (
              <p className="devices-empty">Todas as instalações possuem dispositivo vinculado.</p>
            )}
          </div>
        </section>
      </section>

    </main>
  );
}


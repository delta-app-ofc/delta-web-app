import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { AppSidebar } from "../../components/AppSidebar";
import { AsyncFeedback } from "../../components/AsyncFeedback";
import { useDevices } from "../../hooks/useDevices";
import devicesIcon from "../../assets/devices/devices.png";
import onlineIcon from "../../assets/devices/online.png";
import lowBatteryIcon from "../../assets/devices/low-battery.png";
import noLinkIcon from "../../assets/devices/no-link.png";
import linkIcon from "../../assets/devices/link.png";

import "./style.css";

function formatDate(value: string | null): string {
  if (!value) return "Não informado";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("pt-BR").format(date);
}

function batteryClass(level: number): "good" | "warning" | "critical" {
  return level <= 20 ? "critical" : level <= 50 ? "warning" : "good";
}

function isOnline(status: string | undefined): boolean {
  return status?.toLocaleLowerCase("pt-BR") === "online" || status?.toLocaleLowerCase("pt-BR") === "connected";
}

export function DevicesPage() {
  const navigate = useNavigate();
  const { state, retry } = useDevices();
  const [search, setSearch] = useState("");
  const filteredDevices = useMemo(() => {
    if (state.status !== "success") return [];
    const query = search.trim().toLocaleLowerCase("pt-BR");
    return state.data.devices.filter(({ record, installationName }) => `${record.deviceId} ${installationName}`.toLocaleLowerCase("pt-BR").includes(query));
  }, [search, state]);

  return (
    <main className="devices-page">
      <div className="devices-page__sidebar"><AppSidebar label="Navegação principal" /></div>
      <section id="page-content" tabIndex={-1} className="devices-page__content" aria-labelledby="devices-title">
        <header className="devices-header">
          <h1 id="devices-title">Dispositivos</h1>
          <div className="devices-header__controls">
            <label className="devices-search" htmlFor="device-search"><span aria-hidden="true" /><input id="device-search" type="search" placeholder="Buscar por ID ou instalação" value={search} maxLength={100} onChange={(event) => setSearch(event.target.value)} /></label>
            <button className="devices-link-button devices-link-button--primary" type="button" onClick={() => navigate("/dispositivos/vincular")}><img src={linkIcon} alt="" /><span>Vincular dispositivo</span></button>
          </div>
        </header>

        {state.status === "loading" && <AsyncFeedback status="loading" message="Carregando dispositivos…" />}
        {state.status === "error" && <AsyncFeedback status="error" message={state.error} onRetry={retry} />}
        {state.status === "success" && <>
          {state.data.warnings.map((warning) => <p className="devices-data-warning" role="alert" key={warning}>{warning}</p>)}
          <section className="devices-indicators" aria-label="Resumo dos dispositivos">
            {[
              { id: "paired", label: "Dispositivos pareados", value: String(state.data.devices.filter(({ record }) => record.isActive).length), icon: devicesIcon },
              { id: "online", label: "Online agora", value: String(state.data.devices.filter(({ telemetry }) => isOnline(telemetry?.connectivityStatus)).length), icon: onlineIcon },
              { id: "battery", label: "Bateria baixa", value: String(state.data.devices.filter(({ telemetry }) => telemetry !== null && telemetry.batteryLevel <= 20).length), icon: lowBatteryIcon },
              { id: "unlinked", label: "Sem vínculo", value: String(state.data.unlinkedInstallations.length), icon: noLinkIcon },
            ].map((indicator) => <article className="devices-card devices-indicator" key={indicator.id}><div className="devices-indicator__label"><img src={indicator.icon} alt="" /><span>{indicator.label}</span></div><strong>{indicator.value}</strong>{indicator.id === "online" || indicator.id === "battery" ? <small>Com base na última telemetria recebida</small> : null}</article>)}
          </section>

          <div className="devices-card devices-table-wrapper">
            <table className="devices-table"><caption className="sr-only">Dispositivos vinculados às instalações</caption><thead><tr><th scope="col">Dispositivo</th><th scope="col">Instalação</th><th scope="col">Conectividade</th><th scope="col">Bateria</th><th scope="col">Último ping</th></tr></thead>
              <tbody>{filteredDevices.map(({ record, installationName, region, telemetry }) => <tr key={record.id}><td>{record.deviceId}</td><td><strong>{installationName}</strong><small>{region ?? "Região não informada"}</small></td><td><span className={`devices-connectivity devices-connectivity--${isOnline(telemetry?.connectivityStatus) ? "online" : "offline"}`}>{telemetry?.connectivityStatus ?? "Sem telemetria"}</span></td><td>{telemetry ? <span className={`devices-battery devices-battery--${batteryClass(telemetry.batteryLevel)}`}><span>{telemetry.batteryLevel}%</span></span> : "Não informado"}</td><td>{telemetry ? formatDate(telemetry.lastPingAt) : formatDate(record.installationDate)}</td></tr>)}</tbody>
            </table>
            {filteredDevices.length === 0 && <p className="devices-empty">Nenhum dispositivo encontrado.</p>}
          </div>

          <section className="devices-unlinked" aria-labelledby="unlinked-installations-title"><h2 id="unlinked-installations-title">Instalações sem dispositivo vinculado</h2><div className="devices-card devices-unlinked__table-wrapper">
            <table><caption className="sr-only">Instalações sem dispositivo vinculado</caption><thead><tr><th scope="col">Instalação</th><th scope="col">Região</th><th scope="col"><span className="sr-only">Ações</span></th></tr></thead><tbody>{state.data.unlinkedInstallations.map((installation) => <tr key={installation.id}><td>{installation.name}</td><td>{installation.region ?? "Região não informada"}</td><td><button className="devices-link-button" type="button" onClick={() => navigate("/dispositivos/vincular", { state: { installation } })}><img src={linkIcon} alt="" /><span>Vincular dispositivo</span></button></td></tr>)}</tbody></table>
            {state.data.unlinkedInstallations.length === 0 && <p className="devices-empty">Todas as instalações possuem dispositivo vinculado.</p>}
          </div></section>
        </>}
      </section>
    </main>
  );
}

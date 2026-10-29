import { FormEvent, useEffect, useId, useMemo, useRef, useState } from "react";

import { AppSidebar } from "../../components/AppSidebar";
import arrowIcon from "../../assets/settings/Arrow 1.png";
import organizationIcon from "../../assets/settings/organizations.png";
import plusIcon from "../../assets/settings/plus.png";
import settingsIcon from "../../assets/settings/settings.png";
import xIcon from "../../assets/settings/x.png";
import { useDialogFocus } from "../../hooks/useDialogFocus";
import { validateOrganization, validatePasswordChange, validateProfile, validateRecipients } from "../../utils/settingsValidation";

import "./style.css";

type AlertLevel = "critical" | "attention" | "informative";
type NotificationChannel = "email" | "whatsapp" | "push";

interface NotificationRule {
  label: string;
  channels: Record<NotificationChannel, boolean>;
  recipients: readonly string[];
}

interface ScheduledReport {
  id: number;
  report: string;
  frequency: string;
  channel: string;
  recipients: string;
}

interface SessionItem {
  id: number;
  device: string;
  location: string;
  current?: boolean;
}

const recipientOptions = ["Gestor da unidade", "Gestor regional", "Diretoria"] as const;

const initialNotifications: Record<AlertLevel, NotificationRule> = {
  critical: {
    label: "Crítico",
    channels: { email: true, whatsapp: true, push: true },
    recipients: ["Gestor da unidade", "Gestor regional"],
  },
  attention: {
    label: "Atenção",
    channels: { email: true, whatsapp: false, push: true },
    recipients: ["Gestor da unidade"],
  },
  informative: {
    label: "Informativo",
    channels: { email: true, whatsapp: false, push: false },
    recipients: ["Gestor da unidade"],
  },
};

const initialReports: readonly ScheduledReport[] = [
  { id: 1, report: "Dashboard geral", frequency: "Semanal · segunda-feira", channel: "E-mail", recipients: "diretoria@swift.com.br" },
  { id: 2, report: "Ranking de unidades", frequency: "Mensal · dia 1", channel: "E-mail", recipients: "diretoria@swift.com.br" },
];

const initialSessions: readonly SessionItem[] = [
  { id: 1, device: "Chrome · Windows", location: "São Paulo, SP · agora", current: true },
  { id: 2, device: "App Delta · iPhone 14", location: "São Paulo, SP · há 2 horas" },
  { id: 3, device: "Edge · Windows", location: "Campinas, SP · há 3 dias" },
];

function Toggle({ checked, label, onChange }: { checked: boolean; label: string; onChange: () => void }) {
  return (
    <button
      className={`settings-toggle ${checked ? "settings-toggle--active" : ""}`}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
    >
      <span />
    </button>
  );
}

interface SettingsSelectProps {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  className?: string;
}

function SettingsSelect({ label, value, options, onChange, className = "" }: SettingsSelectProps) {
  const [open, setOpen] = useState(false);
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const selectedIndex = Math.max(0, options.indexOf(value));
    requestAnimationFrame(() => optionRefs.current[selectedIndex]?.focus());
  }, [open, options, value]);

  function closeAndReturnFocus() {
    setOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  }

  function handleOptionKeyDown(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = index;
    if (event.key === "ArrowDown") next = (index + 1) % options.length;
    else if (event.key === "ArrowUp") next = (index + options.length - 1) % options.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = options.length - 1;
    else if (event.key === "Escape") { event.preventDefault(); closeAndReturnFocus(); return; }
    else return;
    event.preventDefault();
    optionRefs.current[next]?.focus();
  }

  return (
    <div className={`settings-custom-select ${open ? "settings-custom-select--open" : ""} ${className}`} ref={rootRef}>
      <div className="settings-custom-select__field">
        <span>{value}</span>
        <button ref={triggerRef} type="button" aria-label={`Abrir opções de ${label}`} aria-haspopup="listbox" aria-expanded={open} aria-controls={listboxId} onClick={() => setOpen((current) => !current)} onKeyDown={(event) => { if (!open && (event.key === "ArrowDown" || event.key === "ArrowUp")) { event.preventDefault(); setOpen(true); } }}>
          <img src={arrowIcon} alt="" />
        </button>
      </div>
      {open && (
        <div className="settings-custom-select__options" id={listboxId} role="listbox" aria-label={label}>
          {options.map((option) => (
            <button
              ref={(element) => { optionRefs.current[options.indexOf(option)] = element; }}
              type="button"
              role="option"
              aria-selected={option === value}
              className={option === value ? "selected" : ""}
              key={option}
              onClick={() => { onChange(option); closeAndReturnFocus(); }}
              onKeyDown={(event) => handleOptionKeyDown(event, options.indexOf(option))}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function SettingsPage() {
  const [profile, setProfile] = useState({
    name: "Carlos Alberto Rodrigues",
    email: "carlos.rodrigues@swift.com.br",
    phone: "(11) 95064-6508",
  });
  const [notifications, setNotifications] = useState(initialNotifications);
  const [organizationOpen, setOrganizationOpen] = useState(false);
  const [organization, setOrganization] = useState({
    legalName: "Swift Distribuidora de Alimentos Ltda.",
    tradeName: "Swift Distribuidora",
    cnpj: "12.345.678/0001-90",
    segment: "Distribuição e logística de alimentos",
  });
  const [organizationDraft, setOrganizationDraft] = useState(organization);
  const [generalOpen, setGeneralOpen] = useState(false);
  const [general, setGeneral] = useState({
    language: "Português (Brasil)",
    timezone: "América/São Paulo (GMT-3)",
    dateFormat: "DD/MM/AAAA",
    unit: "Metros cúbicos (m³)",
  });
  const [escalationEnabled, setEscalationEnabled] = useState(true);
  const [escalationChannel, setEscalationChannel] = useState("WhatsApp");
  const [attachReport, setAttachReport] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordLastChanged, setPasswordLastChanged] = useState("Última alteração há 94 dias");
  const [passwords, setPasswords] = useState({ current: "", next: "", confirmation: "" });
  const [passwordError, setPasswordError] = useState("");
  const [deleteAccountModalOpen, setDeleteAccountModalOpen] = useState(false);
  const [deleteAccountPassword, setDeleteAccountPassword] = useState("");
  const [reports, setReports] = useState<readonly ScheduledReport[]>(initialReports);
  const [sessions, setSessions] = useState<readonly SessionItem[]>(initialSessions);
  const [newReport, setNewReport] = useState({
    report: "Dashboard geral",
    frequency: "Semanal · segunda-feira",
    channel: "E-mail",
    recipients: "",
  });
  const [feedback, setFeedback] = useState("");
  const [formError, setFormError] = useState("");
  const generalDialogRef = useDialogFocus<HTMLElement>(generalOpen, () => setGeneralOpen(false));
  const passwordDialogRef = useDialogFocus<HTMLFormElement>(passwordModalOpen, closePasswordModal);
  const deleteDialogRef = useDialogFocus<HTMLFormElement>(deleteAccountModalOpen, closeDeleteAccountModal);

  const generalSummary = useMemo(
    () => `${general.language} · ${general.timezone.replace("América/São Paulo ", "")}`,
    [general.language, general.timezone],
  );

  function showFeedback(message: string) {
    setFormError("");
    setFeedback(message);
    window.setTimeout(() => setFeedback(""), 3000);
  }

  function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const error = validateProfile(profile);
    if (error) { setFormError(error); return; }
    setProfile((current) => ({ ...current, name: current.name.trim(), email: current.email.trim() }));
    showFeedback("Alterações do perfil salvas.");
  }

  function openOrganization() {
    setOrganizationDraft(organization);
    setOrganizationOpen(true);
  }

  function closeOrganization() {
    setOrganizationDraft(organization);
    setOrganizationOpen(false);
  }

  function saveOrganization(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const error = validateOrganization(organizationDraft);
    if (error) { setFormError(error); return; }
    setOrganization(organizationDraft);
    setOrganizationOpen(false);
    showFeedback("Dados da organização salvos.");
  }

  function toggleChannel(level: AlertLevel, channel: NotificationChannel) {
    setNotifications((current) => ({
      ...current,
      [level]: {
        ...current[level],
        channels: { ...current[level].channels, [channel]: !current[level].channels[channel] },
      },
    }));
  }

  function toggleRecipient(level: AlertLevel, recipient: string) {
    setNotifications((current) => {
      const selected = current[level].recipients.includes(recipient);
      return {
        ...current,
        [level]: {
          ...current[level],
          recipients: selected
            ? current[level].recipients.filter((item) => item !== recipient)
            : [...current[level].recipients, recipient],
        },
      };
    });
  }

  function addReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const error = validateRecipients(newReport.recipients);
    if (error) { setFormError(error); return; }
    setReports((current) => [...current, { ...newReport, id: Date.now(), recipients: newReport.recipients.trim() }]);
    setNewReport((current) => ({ ...current, recipients: "" }));
    showFeedback("Relatório agendado.");
  }

  function openPasswordModal() {
    setPasswords({ current: "", next: "", confirmation: "" });
    setPasswordError("");
    setPasswordModalOpen(true);
  }

  function closePasswordModal() {
    setPasswordModalOpen(false);
    setPasswordError("");
  }

  function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const error = validatePasswordChange(passwords);
    if (error) { setPasswordError(error); return; }
    setPasswordLastChanged("Última alteração agora");
    closePasswordModal();
    showFeedback("Senha alterada com sucesso.");
  }

  function openDeleteAccountModal() {
    setDeleteAccountPassword("");
    setDeleteAccountModalOpen(true);
  }

  function closeDeleteAccountModal() {
    setDeleteAccountModalOpen(false);
    setDeleteAccountPassword("");
  }

  function confirmAccountDeletion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    closeDeleteAccountModal();
    showFeedback("Solicitação de exclusão enviada para confirmação administrativa.");
  }

  function exportData() {
    const data = JSON.stringify({ profile, preferences: general, notifications, reports }, null, 2);
    const url = URL.createObjectURL(new Blob([data], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "meus-dados-delta.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="settings-page">
      <div className="settings-page__sidebar">
        <AppSidebar label="Navegação principal" profile={{ name: "Talita", email: "talita@delta.com.br" }} />
      </div>

      <section id="page-content" tabIndex={-1} className="settings-page__content" aria-labelledby="settings-title">
        <header className="settings-header">
          <div>
            <h1 id="settings-title">Configurações</h1>
            <p>Gerencie seu perfil, preferências, notificações e segurança.</p>
          </div>
          {feedback && <span className="settings-feedback" role="status">{feedback}</span>}
          {formError && <span className="settings-feedback settings-feedback--error" role="alert">{formError}</span>}
        </header>

        <div className="settings-top-grid">
          <form className="settings-card settings-profile" onSubmit={saveProfile}>
            <h2>Perfil do gestor</h2>
            <div className="settings-field-label"><label htmlFor="settings-profile-name">Nome completo</label><input id="settings-profile-name" value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} maxLength={100} required /></div>
            <div className="settings-field-label"><label htmlFor="settings-profile-email">E-mail</label><input id="settings-profile-email" type="email" value={profile.email} onChange={(event) => setProfile({ ...profile, email: event.target.value })} maxLength={255} required /></div>
            <div className="settings-field-label"><label htmlFor="settings-profile-phone">Telefone</label><input id="settings-profile-phone" type="tel" value={profile.phone} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} maxLength={20} /></div>
            <button className="settings-primary-button" type="submit">Salvar alterações</button>
          </form>

          <section className="settings-card settings-preferences" aria-labelledby="preferences-title">
            <div className="settings-card-title"><h2 id="preferences-title">Organização e preferências</h2></div>
            {organizationOpen ? (
              <form className="settings-organization-editor" onSubmit={saveOrganization}>
                <header>
                  <h3>Organização</h3>
                  <button className="settings-icon-button" type="button" aria-label="Fechar edição da organização" onClick={closeOrganization}><img src={xIcon} alt="" /></button>
                </header>
                <div className="settings-field-label"><label htmlFor="settings-legal-name">Razão social</label><input id="settings-legal-name" value={organizationDraft.legalName} onChange={(event) => setOrganizationDraft({ ...organizationDraft, legalName: event.target.value })} maxLength={150} required /></div>
                <div className="settings-field-label"><label htmlFor="settings-trade-name">Nome fantasia</label><input id="settings-trade-name" value={organizationDraft.tradeName} onChange={(event) => setOrganizationDraft({ ...organizationDraft, tradeName: event.target.value })} maxLength={100} required /></div>
                <div className="settings-field-label"><label htmlFor="settings-cnpj">CNPJ</label><input id="settings-cnpj" value={organizationDraft.cnpj} onChange={(event) => setOrganizationDraft({ ...organizationDraft, cnpj: event.target.value })} inputMode="numeric" maxLength={18} required /></div>
                <div className="settings-field-label"><label htmlFor="settings-segment">Segmento</label><input id="settings-segment" value={organizationDraft.segment} onChange={(event) => setOrganizationDraft({ ...organizationDraft, segment: event.target.value })} maxLength={120} required /></div>
                <footer><button className="settings-secondary-button" type="button" onClick={closeOrganization}>Cancelar</button><button className="settings-primary-button" type="submit">Salvar</button></footer>
              </form>
            ) : (
              <div className="settings-preference-row">
                <img src={organizationIcon} alt="" />
                <div><strong>Organização</strong><span>{organization.tradeName}</span></div>
                <button className="settings-row-arrow" type="button" aria-label="Editar organização" onClick={openOrganization}><img className="settings-inline-arrow" src={arrowIcon} alt="" /></button>
              </div>
            )}
            <div className="settings-preference-row">
              <img src={settingsIcon} alt="" /><div><strong>Configurações gerais</strong><span>{generalSummary}</span></div>
              <button className="settings-row-arrow" type="button" aria-label="Editar configurações gerais" onClick={() => setGeneralOpen(true)}><img className="settings-inline-arrow" src={arrowIcon} alt="" /></button>
            </div>
          </section>
        </div>

        <section className="settings-section" aria-labelledby="notifications-title">
          <h2 id="notifications-title">Notificações e relatórios</h2>
          <div className="settings-card notification-card">
            <div className="settings-card-title"><div><h3>Notificações por canal</h3><p>Escolha por onde cada tipo de alerta chega, e para quem.</p></div></div>
            <div className="notification-table-scroll"><div className="notification-table" role="table" aria-label="Notificações por tipo de alerta">
              <div className="notification-row notification-row--header" role="row"><span role="columnheader">Tipo de alerta</span><span role="columnheader">E-mail</span><span role="columnheader">WhatsApp</span><span role="columnheader">Push</span><span role="columnheader">Destinatários</span></div>
              {(Object.entries(notifications) as [AlertLevel, NotificationRule][]).map(([level, rule]) => (
                <div className="notification-row" role="row" key={level}>
                  <strong role="rowheader" className={`notification-level notification-level--${level}`}>{rule.label}</strong>
                  {(["email", "whatsapp", "push"] as const).map((channel) => <span role="cell" key={channel}><Toggle checked={rule.channels[channel]} label={`${channel} para alertas ${rule.label}`} onChange={() => toggleChannel(level, channel)} /></span>)}
                  <div className="notification-recipients" role="cell">
                    {recipientOptions.map((recipient) => <button className={rule.recipients.includes(recipient) ? "selected" : ""} type="button" key={recipient} aria-pressed={rule.recipients.includes(recipient)} onClick={() => toggleRecipient(level, recipient)}>{recipient}</button>)}
                  </div>
                </div>
              ))}
            </div></div>
          </div>

          <div className="settings-paired-grid">
            <section className="settings-card settings-escalation">
              <div className="settings-card-title settings-card-title--action"><div><div><h3>Escalonamento automático</h3><p>Se um alerta crítico não for tratado, o sistema escala sozinho.</p></div></div><Toggle checked={escalationEnabled} label="Ativar escalonamento automático" onChange={() => setEscalationEnabled((value) => !value)} /></div>
              <div className="escalation-rule"><span>Sem resposta por</span><input aria-label="Horas sem resposta" type="number" min="1" defaultValue="4" /><span>horas → notifica o gestor regional por</span><SettingsSelect className="settings-custom-select--compact" label="Canal de escalonamento" value={escalationChannel} options={["WhatsApp", "E-mail", "Push"]} onChange={setEscalationChannel} /></div>
              <div className="settings-switch-label"><Toggle checked={attachReport} label="Anexar relatório da unidade" onChange={() => setAttachReport((value) => !value)} /><span>Anexar relatório da unidade junto com a notificação de escalonamento</span></div>
            </section>

            <section className="settings-card settings-tariffs">
              <div className="settings-card-title"><div><h3>Tarifas por região</h3><p>Tarifa vigente por m³, conforme cadastro de cada região.</p></div></div>
              {[['São Paulo (Capital)', 'Sabesp · vigente desde 01/07/2026', 'R$ 15,08'], ['Interior de SP', 'Sabesp / autarquias municipais · vigente desde 15/06/2026', 'R$ 13,42'], ['Litoral de SP', 'Sabesp · vigente desde 01/08/2026', 'R$ 16,35']].map(([region, note, value]) => <div className="tariff-row" key={region}><div><strong>{region}</strong><span>{note}</span></div><strong>{value}<small>/m³</small></strong></div>)}
            </section>
          </div>

          <section className="settings-card scheduled-reports">
            <div className="settings-card-title"><div><h3>Relatórios agendados</h3><p>Escolha quais relatórios enviar automaticamente, com que frequência e por qual canal.</p></div></div>
            <div className="report-table-scroll"><div className="report-table" role="table" aria-label="Relatórios agendados">
              <div className="report-row report-row--header" role="row"><span role="columnheader">Relatório</span><span role="columnheader">Frequência</span><span role="columnheader">Canal</span><span role="columnheader">Destinatários</span><span role="columnheader"><span className="sr-only">Ações</span></span></div>
              {reports.map((report) => <div className="report-row" role="row" key={report.id}><strong role="cell">{report.report}</strong><strong role="cell">{report.frequency}</strong><strong role="cell">{report.channel}</strong><strong role="cell">{report.recipients}</strong><span role="cell"><button className="settings-icon-button" type="button" aria-label={`Remover ${report.report}`} onClick={() => setReports((current) => current.filter((item) => item.id !== report.id))}><img src={xIcon} alt="" /></button></span></div>)}
            </div></div>
            <form className="report-form" onSubmit={addReport}>
              <SettingsSelect label="Relatório" value={newReport.report} options={["Dashboard geral", "Ranking de unidades", "Consumo mensal"]} onChange={(value) => setNewReport({ ...newReport, report: value })} />
              <SettingsSelect label="Frequência" value={newReport.frequency} options={["Semanal · segunda-feira", "Mensal · dia 1", "Diário"]} onChange={(value) => setNewReport({ ...newReport, frequency: value })} />
              <SettingsSelect label="Canal" value={newReport.channel} options={["E-mail", "WhatsApp"]} onChange={(value) => setNewReport({ ...newReport, channel: value })} />
              <input aria-label="Destinatários" placeholder="E-mail ou lista de destinatários" value={newReport.recipients} onChange={(event) => setNewReport({ ...newReport, recipients: event.target.value })} maxLength={500} required />
              <button className="settings-primary-button settings-schedule-button" type="submit"><img src={plusIcon} alt="" />Agendar</button>
            </form>
          </section>
        </section>

        <section className="settings-section" aria-labelledby="security-title">
          <h2 id="security-title">Segurança</h2>
          <div className="settings-paired-grid">
            <section className="settings-card settings-security-card">
              <div className="settings-card-title"><h3>Login e senha</h3></div>
              <button className="security-row" type="button" onClick={openPasswordModal}><div><strong>Alterar senha</strong><span>{passwordLastChanged}</span></div><img className="settings-inline-arrow" src={arrowIcon} alt="" /></button>
              <div className="security-row"><div><strong>Autenticação em duas etapas</strong><span>{twoFactor ? "Ativada" : "Desativada"}</span></div><Toggle checked={twoFactor} label="Autenticação em duas etapas" onChange={() => setTwoFactor((value) => !value)} /></div>
            </section>

            <section className="settings-card settings-sessions">
              <div className="settings-card-title settings-card-title--action"><div><div><h3>Sessões ativas</h3><p>Dispositivos com acesso à sua conta no momento.</p></div></div><button className="settings-secondary-button" type="button" onClick={() => setSessions((current) => current.filter((session) => session.current))}>Encerrar todas as outras</button></div>
              {sessions.map((session) => <div className="session-row" key={session.id}><div><strong>{session.device}</strong><span>{session.location}</span></div>{session.current ? <em>Sessão atual</em> : <button type="button" onClick={() => setSessions((current) => current.filter((item) => item.id !== session.id))}>Encerrar sessão</button>}</div>)}
            </section>
          </div>
        </section>

        <section className="settings-section settings-data" aria-labelledby="data-title">
          <h2 id="data-title">Dados</h2>
          <section className="settings-card">
            <div className="settings-card-title settings-danger-title"><h3>Dados &amp; privacidade</h3></div>
            <div className="data-row"><div><strong>Exportar meus dados</strong><span>Baixe um arquivo com seu perfil, instalações e histórico de alertas.</span></div><button className="settings-secondary-button" type="button" onClick={exportData}>Exportar</button></div>
            <div className="data-row"><div><strong>Excluir conta</strong><span>Ação permanente e irreversível</span></div><button className="settings-danger-button" type="button" onClick={openDeleteAccountModal}>Excluir</button></div>
          </section>
        </section>
      </section>

      {generalOpen && <div className="settings-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setGeneralOpen(false); }}>
        <section ref={generalDialogRef} className="settings-modal" role="dialog" aria-modal="true" aria-labelledby="general-settings-title">
          <header><h2 id="general-settings-title">Configurações gerais</h2><button className="settings-icon-button" type="button" aria-label="Fechar" onClick={() => setGeneralOpen(false)}><img src={xIcon} alt="" /></button></header>
          <div className="settings-field-label"><span>Idioma</span><SettingsSelect label="Idioma" value={general.language} options={["Português (Brasil)", "English", "Español"]} onChange={(value) => setGeneral({ ...general, language: value })} /></div>
          <div className="settings-field-label"><span>Fuso horário</span><SettingsSelect label="Fuso horário" value={general.timezone} options={["América/São Paulo (GMT-3)", "América/Manaus (GMT-4)", "UTC"]} onChange={(value) => setGeneral({ ...general, timezone: value })} /></div>
          <div className="settings-field-label"><span>Formato de data</span><SettingsSelect label="Formato de data" value={general.dateFormat} options={["DD/MM/AAAA", "MM/DD/AAAA", "AAAA-MM-DD"]} onChange={(value) => setGeneral({ ...general, dateFormat: value })} /></div>
          <div className="settings-field-label"><span>Unidade de medida</span><SettingsSelect label="Unidade de medida" value={general.unit} options={["Metros cúbicos (m³)", "Litros (L)", "Galões (US gal)"]} onChange={(value) => setGeneral({ ...general, unit: value })} /></div>
          <footer><button className="settings-secondary-button" type="button" onClick={() => setGeneralOpen(false)}>Cancelar</button><button className="settings-primary-button" type="button" onClick={() => { setGeneralOpen(false); showFeedback("Configurações gerais salvas."); }}>Salvar</button></footer>
        </section>
      </div>}

      {passwordModalOpen && <div className="settings-modal-backdrop settings-modal-backdrop--centered" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closePasswordModal(); }}>
        <form ref={passwordDialogRef} className="settings-modal settings-password-modal" role="dialog" aria-modal="true" aria-labelledby="password-modal-title" onSubmit={changePassword}>
          <header><div><h2 id="password-modal-title">Alterar senha</h2><p>Crie uma nova senha segura para acessar sua conta.</p></div><button className="settings-icon-button" type="button" aria-label="Fechar" onClick={closePasswordModal}><img src={xIcon} alt="" /></button></header>
          <div className="settings-field-label"><label htmlFor="settings-current-password">Senha atual</label><input id="settings-current-password" type="password" autoComplete="current-password" maxLength={256} value={passwords.current} onChange={(event) => setPasswords({ ...passwords, current: event.target.value })} required /></div>
          <div className="settings-field-label"><label htmlFor="settings-new-password">Nova senha</label><input id="settings-new-password" type="password" autoComplete="new-password" minLength={8} maxLength={128} value={passwords.next} onChange={(event) => { setPasswords({ ...passwords, next: event.target.value }); setPasswordError(""); }} required /></div>
          <div className="settings-field-label"><label htmlFor="settings-confirm-password">Confirmar nova senha</label><input id="settings-confirm-password" type="password" autoComplete="new-password" minLength={8} maxLength={128} value={passwords.confirmation} onChange={(event) => { setPasswords({ ...passwords, confirmation: event.target.value }); setPasswordError(""); }} required /></div>
          {passwordError && <p className="settings-form-error" role="alert">{passwordError}</p>}
          <footer><button className="settings-secondary-button" type="button" onClick={closePasswordModal}>Cancelar</button><button className="settings-primary-button" type="submit">Alterar senha</button></footer>
        </form>
      </div>}

      {deleteAccountModalOpen && <div className="settings-modal-backdrop settings-modal-backdrop--centered" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeDeleteAccountModal(); }}>
        <form ref={deleteDialogRef} className="settings-modal settings-delete-modal" role="alertdialog" aria-modal="true" aria-labelledby="delete-account-title" aria-describedby="delete-account-description" onSubmit={confirmAccountDeletion}>
          <header><div><h2 id="delete-account-title">Excluir conta</h2><p id="delete-account-description">Esta ação é permanente e não poderá ser desfeita. Digite sua senha para confirmar.</p></div><button className="settings-icon-button" type="button" aria-label="Fechar" onClick={closeDeleteAccountModal}><img src={xIcon} alt="" /></button></header>
          <div className="settings-field-label"><label htmlFor="settings-delete-password">Senha</label><input id="settings-delete-password" type="password" autoComplete="current-password" maxLength={256} value={deleteAccountPassword} onChange={(event) => setDeleteAccountPassword(event.target.value)} required /></div>
          <footer><button className="settings-secondary-button" type="button" onClick={closeDeleteAccountModal}>Cancelar</button><button className="settings-danger-button" type="submit">Excluir conta</button></footer>
        </form>
      </div>}
    </main>
  );
}

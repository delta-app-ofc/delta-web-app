import { FormEvent, useEffect, useId, useMemo, useRef, useState } from "react";

import { AppSidebar } from "../../components/AppSidebar";
import arrowIcon from "../../assets/settings/Arrow 1.png";
import organizationIcon from "../../assets/settings/organizations.png";
import plusIcon from "../../assets/settings/plus.png";
import settingsIcon from "../../assets/settings/settings.png";
import xIcon from "../../assets/settings/x.png";

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

  return (
    <div className={`settings-custom-select ${open ? "settings-custom-select--open" : ""} ${className}`} ref={rootRef}>
      <div className="settings-custom-select__field">
        <span>{value}</span>
        <button type="button" aria-label={`Abrir opções de ${label}`} aria-expanded={open} aria-controls={listboxId} onClick={() => setOpen((current) => !current)}>
          <img src={arrowIcon} alt="" />
        </button>
      </div>
      {open && (
        <div className="settings-custom-select__options" id={listboxId} role="listbox" aria-label={label}>
          {options.map((option) => (
            <button
              type="button"
              role="option"
              aria-selected={option === value}
              className={option === value ? "selected" : ""}
              key={option}
              onClick={() => { onChange(option); setOpen(false); }}
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

  const generalSummary = useMemo(
    () => `${general.language} · ${general.timezone.replace("América/São Paulo ", "")}`,
    [general.language, general.timezone],
  );

  function showFeedback(message: string) {
    setFeedback(message);
    window.setTimeout(() => setFeedback(""), 3000);
  }

  function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
    if (!newReport.recipients.trim()) return;
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
    if (passwords.next.length < 8) {
      setPasswordError("A nova senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (passwords.next !== passwords.confirmation) {
      setPasswordError("A confirmação não corresponde à nova senha.");
      return;
    }
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

      <section className="settings-page__content" aria-labelledby="settings-title">
        <header className="settings-header">
          <div>
            <h1 id="settings-title">Configurações</h1>
            <p>Gerencie seu perfil, preferências, notificações e segurança.</p>
          </div>
          {feedback && <span className="settings-feedback" role="status">{feedback}</span>}
        </header>

        <div className="settings-top-grid">
          <form className="settings-card settings-profile" onSubmit={saveProfile}>
            <h2>Perfil do gestor</h2>
            <label>Nome completo<input value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} required /></label>
            <label>E-mail<input type="email" value={profile.email} onChange={(event) => setProfile({ ...profile, email: event.target.value })} required /></label>
            <label>Telefone<input type="tel" value={profile.phone} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} /></label>
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
                <label>Razão social<input value={organizationDraft.legalName} onChange={(event) => setOrganizationDraft({ ...organizationDraft, legalName: event.target.value })} required /></label>
                <label>Nome fantasia<input value={organizationDraft.tradeName} onChange={(event) => setOrganizationDraft({ ...organizationDraft, tradeName: event.target.value })} required /></label>
                <label>CNPJ<input value={organizationDraft.cnpj} onChange={(event) => setOrganizationDraft({ ...organizationDraft, cnpj: event.target.value })} inputMode="numeric" required /></label>
                <label>Segmento<input value={organizationDraft.segment} onChange={(event) => setOrganizationDraft({ ...organizationDraft, segment: event.target.value })} required /></label>
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
              <div className="notification-row notification-row--header" role="row"><span>Tipo de alerta</span><span>E-mail</span><span>WhatsApp</span><span>Push</span><span>Destinatários</span></div>
              {(Object.entries(notifications) as [AlertLevel, NotificationRule][]).map(([level, rule]) => (
                <div className="notification-row" role="row" key={level}>
                  <strong className={`notification-level notification-level--${level}`}>{rule.label}</strong>
                  {(["email", "whatsapp", "push"] as const).map((channel) => <Toggle key={channel} checked={rule.channels[channel]} label={`${channel} para alertas ${rule.label}`} onChange={() => toggleChannel(level, channel)} />)}
                  <div className="notification-recipients">
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
              <label className="settings-switch-label"><Toggle checked={attachReport} label="Anexar relatório da unidade" onChange={() => setAttachReport((value) => !value)} /><span>Anexar relatório da unidade junto com a notificação de escalonamento</span></label>
            </section>

            <section className="settings-card settings-tariffs">
              <div className="settings-card-title"><div><h3>Tarifas por região</h3><p>Tarifa vigente por m³, conforme cadastro de cada região.</p></div></div>
              {[['São Paulo (Capital)', 'Sabesp · vigente desde 01/07/2026', 'R$ 15,08'], ['Interior de SP', 'Sabesp / autarquias municipais · vigente desde 15/06/2026', 'R$ 13,42'], ['Litoral de SP', 'Sabesp · vigente desde 01/08/2026', 'R$ 16,35']].map(([region, note, value]) => <div className="tariff-row" key={region}><div><strong>{region}</strong><span>{note}</span></div><strong>{value}<small>/m³</small></strong></div>)}
            </section>
          </div>

          <section className="settings-card scheduled-reports">
            <div className="settings-card-title"><div><h3>Relatórios agendados</h3><p>Escolha quais relatórios enviar automaticamente, com que frequência e por qual canal.</p></div></div>
            <div className="report-table-scroll"><div className="report-table">
              <div className="report-row report-row--header"><span>Relatório</span><span>Frequência</span><span>Canal</span><span>Destinatários</span><span /></div>
              {reports.map((report) => <div className="report-row" key={report.id}><strong>{report.report}</strong><strong>{report.frequency}</strong><strong>{report.channel}</strong><strong>{report.recipients}</strong><button className="settings-icon-button" type="button" aria-label={`Remover ${report.report}`} onClick={() => setReports((current) => current.filter((item) => item.id !== report.id))}><img src={xIcon} alt="" /></button></div>)}
            </div></div>
            <form className="report-form" onSubmit={addReport}>
              <SettingsSelect label="Relatório" value={newReport.report} options={["Dashboard geral", "Ranking de unidades", "Consumo mensal"]} onChange={(value) => setNewReport({ ...newReport, report: value })} />
              <SettingsSelect label="Frequência" value={newReport.frequency} options={["Semanal · segunda-feira", "Mensal · dia 1", "Diário"]} onChange={(value) => setNewReport({ ...newReport, frequency: value })} />
              <SettingsSelect label="Canal" value={newReport.channel} options={["E-mail", "WhatsApp"]} onChange={(value) => setNewReport({ ...newReport, channel: value })} />
              <input aria-label="Destinatários" placeholder="E-mail ou lista de destinatários" value={newReport.recipients} onChange={(event) => setNewReport({ ...newReport, recipients: event.target.value })} required />
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
        <section className="settings-modal" role="dialog" aria-modal="true" aria-labelledby="general-settings-title">
          <header><h2 id="general-settings-title">Configurações gerais</h2><button className="settings-icon-button" type="button" aria-label="Fechar" onClick={() => setGeneralOpen(false)}><img src={xIcon} alt="" /></button></header>
          <label>Idioma<SettingsSelect label="Idioma" value={general.language} options={["Português (Brasil)", "English", "Español"]} onChange={(value) => setGeneral({ ...general, language: value })} /></label>
          <label>Fuso horário<SettingsSelect label="Fuso horário" value={general.timezone} options={["América/São Paulo (GMT-3)", "América/Manaus (GMT-4)", "UTC"]} onChange={(value) => setGeneral({ ...general, timezone: value })} /></label>
          <label>Formato de data<SettingsSelect label="Formato de data" value={general.dateFormat} options={["DD/MM/AAAA", "MM/DD/AAAA", "AAAA-MM-DD"]} onChange={(value) => setGeneral({ ...general, dateFormat: value })} /></label>
          <label>Unidade de medida<SettingsSelect label="Unidade de medida" value={general.unit} options={["Metros cúbicos (m³)", "Litros (L)", "Galões (US gal)"]} onChange={(value) => setGeneral({ ...general, unit: value })} /></label>
          <footer><button className="settings-secondary-button" type="button" onClick={() => setGeneralOpen(false)}>Cancelar</button><button className="settings-primary-button" type="button" onClick={() => { setGeneralOpen(false); showFeedback("Configurações gerais salvas."); }}>Salvar</button></footer>
        </section>
      </div>}

      {passwordModalOpen && <div className="settings-modal-backdrop settings-modal-backdrop--centered" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closePasswordModal(); }}>
        <form className="settings-modal settings-password-modal" role="dialog" aria-modal="true" aria-labelledby="password-modal-title" onSubmit={changePassword}>
          <header><div><h2 id="password-modal-title">Alterar senha</h2><p>Crie uma nova senha segura para acessar sua conta.</p></div><button className="settings-icon-button" type="button" aria-label="Fechar" onClick={closePasswordModal}><img src={xIcon} alt="" /></button></header>
          <label>Senha atual<input type="password" autoComplete="current-password" value={passwords.current} onChange={(event) => setPasswords({ ...passwords, current: event.target.value })} required /></label>
          <label>Nova senha<input type="password" autoComplete="new-password" minLength={8} value={passwords.next} onChange={(event) => { setPasswords({ ...passwords, next: event.target.value }); setPasswordError(""); }} required /></label>
          <label>Confirmar nova senha<input type="password" autoComplete="new-password" minLength={8} value={passwords.confirmation} onChange={(event) => { setPasswords({ ...passwords, confirmation: event.target.value }); setPasswordError(""); }} required /></label>
          {passwordError && <p className="settings-form-error" role="alert">{passwordError}</p>}
          <footer><button className="settings-secondary-button" type="button" onClick={closePasswordModal}>Cancelar</button><button className="settings-primary-button" type="submit">Alterar senha</button></footer>
        </form>
      </div>}

      {deleteAccountModalOpen && <div className="settings-modal-backdrop settings-modal-backdrop--centered" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeDeleteAccountModal(); }}>
        <form className="settings-modal settings-delete-modal" role="alertdialog" aria-modal="true" aria-labelledby="delete-account-title" aria-describedby="delete-account-description" onSubmit={confirmAccountDeletion}>
          <header><div><h2 id="delete-account-title">Excluir conta</h2><p id="delete-account-description">Esta ação é permanente e não poderá ser desfeita. Digite sua senha para confirmar.</p></div><button className="settings-icon-button" type="button" aria-label="Fechar" onClick={closeDeleteAccountModal}><img src={xIcon} alt="" /></button></header>
          <label>Senha<input type="password" autoComplete="current-password" value={deleteAccountPassword} onChange={(event) => setDeleteAccountPassword(event.target.value)} required /></label>
          <footer><button className="settings-secondary-button" type="button" onClick={closeDeleteAccountModal}>Cancelar</button><button className="settings-danger-button" type="submit">Excluir conta</button></footer>
        </form>
      </div>}
    </main>
  );
}

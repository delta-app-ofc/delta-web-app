import { FormEvent, useEffect, useId, useMemo, useRef, useState } from "react";

import { AppSidebar } from "../../components/AppSidebar";
import { AsyncFeedback } from "../../components/AsyncFeedback";
import arrowIcon from "../../assets/settings/Arrow 1.png";
import organizationIcon from "../../assets/settings/organizations.png";
import settingsIcon from "../../assets/settings/settings.png";
import xIcon from "../../assets/settings/x.png";
import { useDialogFocus } from "../../hooks/useDialogFocus";
import { useSettingsData } from "../../hooks/useSettingsData";
import { updateCurrentUser } from "../../services/auth";
import { ApiError } from "../../services/http";
import { validateOrganization, validatePasswordChange, validateProfile } from "../../utils/settingsValidation";

import "./style.css";

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
    name: "",
    email: "",
    phone: "",
    birthDate: "",
  });
  const [settingsRequestVersion, setSettingsRequestVersion] = useState(0);
  const settingsState = useSettingsData(settingsRequestVersion);
  const [profileSaving, setProfileSaving] = useState(false);
  const profileRequestRef = useRef<AbortController | null>(null);
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
  const [twoFactor, setTwoFactor] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordLastChanged, setPasswordLastChanged] = useState("Última alteração há 94 dias");
  const [passwords, setPasswords] = useState({ current: "", next: "", confirmation: "" });
  const [passwordError, setPasswordError] = useState("");
  const [deleteAccountModalOpen, setDeleteAccountModalOpen] = useState(false);
  const [deleteAccountPassword, setDeleteAccountPassword] = useState("");
  const [feedback, setFeedback] = useState("");
  const [formError, setFormError] = useState("");
  const generalDialogRef = useDialogFocus<HTMLElement>(generalOpen, () => setGeneralOpen(false));
  const passwordDialogRef = useDialogFocus<HTMLFormElement>(passwordModalOpen, closePasswordModal);
  const deleteDialogRef = useDialogFocus<HTMLFormElement>(deleteAccountModalOpen, closeDeleteAccountModal);

  useEffect(() => () => profileRequestRef.current?.abort(), []);

  useEffect(() => {
    if (settingsState.status !== "success") return;
    setProfile({
      name: settingsState.user.name,
      email: settingsState.user.email,
      phone: settingsState.user.phone ?? "",
      birthDate: settingsState.user.birthDate ?? "",
    });
    const firstOrganization = settingsState.organizations[0];
    if (firstOrganization) {
      setOrganization({
        legalName: firstOrganization.corporateName,
        tradeName: firstOrganization.tradeName,
        cnpj: firstOrganization.cnpj,
        segment: firstOrganization.businessSegment ?? "Não informado",
      });
    } else {
      setOrganization({ legalName: "", tradeName: "Não disponível", cnpj: "", segment: "Não informado" });
    }
  }, [settingsState]);

  const generalSummary = useMemo(
    () => `${general.language} · ${general.timezone.replace("América/São Paulo ", "")}`,
    [general.language, general.timezone],
  );

  function showFeedback(message: string) {
    setFormError("");
    setFeedback(message);
    window.setTimeout(() => setFeedback(""), 3000);
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const error = validateProfile(profile);
    if (error) { setFormError(error); return; }
    if (!profile.birthDate) { setFormError("A data de nascimento do perfil não foi disponibilizada pela API."); return; }
    profileRequestRef.current?.abort();
    const controller = new AbortController();
    profileRequestRef.current = controller;
    setProfileSaving(true);
    try {
      const updated = await updateCurrentUser(profile, controller.signal);
      if (!controller.signal.aborted) {
        setProfile({ name: updated.name, email: updated.email, phone: updated.phone ?? "", birthDate: updated.birthDate ?? "" });
        showFeedback("Alterações do perfil salvas.");
      }
    } catch (requestError: unknown) {
      if (!controller.signal.aborted) setFormError(requestError instanceof ApiError ? requestError.message : "Não foi possível salvar o perfil.");
    } finally {
      if (profileRequestRef.current === controller) profileRequestRef.current = null;
      if (!controller.signal.aborted) setProfileSaving(false);
    }
  }

  function openOrganization() {
    setFormError("A API permite consultar a organização, mas ainda não permite editá-la.");
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
    const data = JSON.stringify({ profile, preferences: general }, null, 2);
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
        <AppSidebar label="Navegação principal" />
      </div>

      <section id="page-content" tabIndex={-1} className="settings-page__content" aria-labelledby="settings-title">
        <header className="settings-header">
          <div>
            <h1 id="settings-title">Configurações</h1>
            <p>Gerencie seu perfil, preferências e segurança.</p>
          </div>
          {feedback && <span className="settings-feedback" role="status">{feedback}</span>}
          {formError && <span className="settings-feedback settings-feedback--error" role="alert">{formError}</span>}
        </header>

        {settingsState.status === "loading" && <AsyncFeedback status="loading" message="Carregando configurações…" />}
        {settingsState.status === "error" && <AsyncFeedback status="error" message={settingsState.error} onRetry={() => setSettingsRequestVersion((version) => version + 1)} />}
        {settingsState.status === "success" && settingsState.warnings.map((warning) => <p className="settings-data-warning" role="alert" key={warning}>{warning}</p>)}

        <div className="settings-top-grid">
          <form className="settings-card settings-profile" onSubmit={saveProfile}>
            <h2>Perfil do gestor</h2>
            <div className="settings-field-label"><label htmlFor="settings-profile-name">Nome completo</label><input id="settings-profile-name" value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} maxLength={100} required /></div>
            <div className="settings-field-label"><label htmlFor="settings-profile-email">E-mail</label><input id="settings-profile-email" type="email" value={profile.email} onChange={(event) => setProfile({ ...profile, email: event.target.value })} maxLength={255} required /></div>
            <div className="settings-field-label"><label htmlFor="settings-profile-phone">Telefone</label><input id="settings-profile-phone" type="tel" value={profile.phone} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} maxLength={20} /></div>
            <button className="settings-primary-button" type="submit" disabled={profileSaving || settingsState.status !== "success"}>{profileSaving ? "Salvando…" : "Salvar alterações"}</button>
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

        <section className="settings-section" aria-labelledby="security-title">
          <h2 id="security-title">Segurança</h2>
          <div className="settings-paired-grid">
            <section className="settings-card settings-security-card">
              <div className="settings-card-title"><h3>Login e senha</h3></div>
              <button className="security-row" type="button" onClick={openPasswordModal}><div><strong>Alterar senha</strong><span>{passwordLastChanged}</span></div><img className="settings-inline-arrow" src={arrowIcon} alt="" /></button>
              <div className="security-row"><div><strong>Autenticação em duas etapas</strong><span>{twoFactor ? "Ativada" : "Desativada"}</span></div><Toggle checked={twoFactor} label="Autenticação em duas etapas" onChange={() => setTwoFactor((value) => !value)} /></div>
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

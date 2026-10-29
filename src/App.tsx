import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { RegisterProvider } from "./contexts/RegisterContext";
import { CompanyRegisterProvider } from "./contexts/CompanyRegisterContext";
import { AuthProvider } from "./contexts/AuthContext";

import { LoadingPage } from "./pages/loading";
import { RequireAuth } from "./components/RequireAuth";
import { AccessibilityMenu } from "./components/AccessibilityMenu";

const RegisterPage = lazy(() => import("./pages/registerUser").then(({ RegisterPage }) => ({ default: RegisterPage })));
const RegisterCredentialsPage = lazy(() => import("./pages/registerCredentials").then(({ RegisterCredentialsPage }) => ({ default: RegisterCredentialsPage })));
const LoginPage = lazy(() => import("./pages/login").then(({ LoginPage }) => ({ default: LoginPage })));
const CompanyRegisterPage = lazy(() => import("./pages/companyRegister").then(({ CompanyRegisterPage }) => ({ default: CompanyRegisterPage })));
const RegisterSuccessPage = lazy(() => import("./pages/registerSuccess").then(({ RegisterSuccessPage }) => ({ default: RegisterSuccessPage })));
const DashboardPage = lazy(() => import("./pages/dashboard").then(({ DashboardPage }) => ({ default: DashboardPage })));
const MonitoringPage = lazy(() => import("./pages/monitoring").then(({ MonitoringPage }) => ({ default: MonitoringPage })));
const RankingPage = lazy(() => import("./pages/ranking").then(({ RankingPage }) => ({ default: RankingPage })));
const AlertsPage = lazy(() => import("./pages/alerts").then(({ AlertsPage }) => ({ default: AlertsPage })));
const LeaksPage = lazy(() => import("./pages/leaks").then(({ LeaksPage }) => ({ default: LeaksPage })));
const GoalsPage = lazy(() => import("./pages/goals").then(({ GoalsPage }) => ({ default: GoalsPage })));
const ChatbotPage = lazy(() => import("./pages/chatbot").then(({ ChatbotPage }) => ({ default: ChatbotPage })));
const ChatbotHistoryPage = lazy(() => import("./pages/chatbotHistory").then(({ ChatbotHistoryPage }) => ({ default: ChatbotHistoryPage })));
const DevicesPage = lazy(() => import("./pages/devices").then(({ DevicesPage }) => ({ default: DevicesPage })));
const DeviceLinkPage = lazy(() => import("./pages/deviceLink").then(({ DeviceLinkPage }) => ({ default: DeviceLinkPage })));
const InvestmentsPage = lazy(() => import("./pages/investments").then(({ InvestmentsPage }) => ({ default: InvestmentsPage })));
const SettingsPage = lazy(() => import("./pages/settings").then(({ SettingsPage }) => ({ default: SettingsPage })));
const InstallationsPage = lazy(() => import("./pages/Installations"));
const InstallationRegistrationPage = lazy(() => import("./pages/InstallationRegistration"));
const InstallationDetailsPage = lazy(() => import("./pages/InstallationDetails"));
const InstallationEditingPage = lazy(() => import("./pages/InstallationEditing"));
const NotFoundPage = lazy(() => import("./pages/NotFound"));

function RouteFallback() {
  return <div className="route-loading" role="status"><span>Carregando página…</span></div>;
}

function App() {
  return (
    <BrowserRouter>
      <RegisterProvider>
        <CompanyRegisterProvider>
          <AuthProvider>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route
                path="/"
                element={<RegisterPage />}
              />

              <Route
                path="/cadastro/credenciais"
                element={<RegisterCredentialsPage />}
              />

              <Route
                path="/cadastro/loading"
                element={
                  <LoadingPage
                    title="Cadastrando seus dados..."
                    redirectTo="/cadastro/empresa"
                  />
                }
              />

              <Route
                path="/cadastro/empresa"
                element={<CompanyRegisterPage step="company" />}
              />

              <Route
                path="/cadastro/empresa/unidade"
                element={<CompanyRegisterPage step="unit" />}
              />

              <Route
                path="/cadastro/empresa/classificacao"
                element={<CompanyRegisterPage step="classification" />}
              />

              <Route
                path="/cadastro/empresa/operacao"
                element={<CompanyRegisterPage step="operation" />}
              />

              <Route
                path="/cadastro/empresa/turnos"
                element={<CompanyRegisterPage step="shifts" />}
              />

              <Route
                path="/cadastro/empresa/agua"
                element={<CompanyRegisterPage step="water" />}
              />

              <Route
                path="/cadastro/empresa/consumo"
                element={<CompanyRegisterPage step="consumption" />}
              />

              <Route
                path="/cadastro/empresa/dispositivo"
                element={<CompanyRegisterPage step="device" />}
              />

              <Route
                path="/cadastro/empresa/vinculando"
                element={
                  <LoadingPage
                    title="Vinculando dispositivo..."
                    redirectTo="/cadastro/empresa/concluido"
                  />
                }
              />

              <Route
                path="/cadastro/empresa/concluido"
                element={<RegisterSuccessPage />}
              />

              <Route
                path="/login"
                element={<LoginPage />}
              />

              <Route element={<RequireAuth />}>
                <Route path="/instalacoes" element={<InstallationsPage />} />
                <Route path="/instalacoes/cadastrar" element={<InstallationRegistrationPage />} />
                <Route path="/instalacoes/:installationId" element={<InstallationDetailsPage />} />
                <Route path="/instalacoes/:installationId/editar" element={<InstallationEditingPage />} />
                <Route path="/metas" element={<GoalsPage />} />
                <Route path="/gluh" element={<ChatbotPage />} />
                <Route path="/gluh/historico" element={<ChatbotHistoryPage />} />
                <Route
                  path="/dashboard"
                  element={<DashboardPage />}
                />

                <Route
                  path="/monitoramento"
                  element={<MonitoringPage />}
                />
                <Route
                  path="/ranking"
                  element={<RankingPage />}
                />

                <Route
                  path="/alertas"
                  element={<AlertsPage />}
                />

                <Route
                  path="/vazamentos"
                  element={<LeaksPage />}
                />

                <Route
                  path="/dispositivos"
                  element={<DevicesPage />}
                />

                <Route
                  path="/dispositivos/vincular"
                  element={<DeviceLinkPage />}
                />

                <Route
                  path="/investimentos"
                  element={<InvestmentsPage />}
                />

                <Route
                  path="/configuracoes"
                  element={<SettingsPage />}
                />

                <Route
                  path="/loading"
                  element={<Navigate to="/instalacoes" replace />}
                />
              </Route>
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
          <AccessibilityMenu />
          </AuthProvider>
        </CompanyRegisterProvider>
      </RegisterProvider>
    </BrowserRouter>
  );
}

export default App;

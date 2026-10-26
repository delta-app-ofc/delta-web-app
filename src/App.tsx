import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { RegisterProvider } from "./contexts/RegisterContext";
import { CompanyRegisterProvider } from "./contexts/CompanyRegisterContext";

import { RegisterPage } from "./pages/registerUser";
import { RegisterCredentialsPage } from "./pages/registerCredentials";
import { LoginPage } from "./pages/login";
import { LoadingPage } from "./pages/loading";
import { CompanyRegisterPage } from "./pages/companyRegister";
import { RegisterSuccessPage } from "./pages/registerSuccess";
import { DashboardPage } from "./pages/dashboard";
import { MonitoringPage } from "./pages/monitoring";
import { RankingPage } from "./pages/ranking";
import { AlertsPage } from "./pages/alerts";
import { LeaksPage } from "./pages/leaks";
import { GoalsPage } from "./pages/goals";
import { ChatbotPage } from "./pages/chatbot";
import { ChatbotHistoryPage } from "./pages/chatbotHistory";
import { DevicesPage } from "./pages/devices";
import { DeviceLinkPage } from "./pages/deviceLink";
import { InvestmentsPage } from "./pages/investments";
import { RequireAuth } from "./components/RequireAuth";

const InstallationsPage = lazy(() => import("./pages/Installations"));
const InstallationRegistrationPage = lazy(() => import("./pages/InstallationRegistration"));
const InstallationDetailsPage = lazy(() => import("./pages/InstallationDetails"));
const InstallationEditingPage = lazy(() => import("./pages/InstallationEditing"));
const NotFoundPage = lazy(() => import("./pages/NotFound"));

function App() {
  return (
    <BrowserRouter>
      <RegisterProvider>
        <CompanyRegisterProvider>
          <Suspense fallback={<LoadingPage />}>
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
                  path="/loading"
                  element={<Navigate to="/instalacoes" replace />}
                />
              </Route>
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </CompanyRegisterProvider>
      </RegisterProvider>
    </BrowserRouter>
  );
}

export default App;

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";

import { LoginPage } from "./pages/login";
import { LoadingPage } from "./pages/loading";
import { RequireAuth } from "./components/RequireAuth";

const InstallationsPage = lazy(() => import("./pages/Installations"));
const InstallationRegistrationPage = lazy(() => import("./pages/InstallationRegistration"));
const InstallationDetailsPage = lazy(() => import("./pages/InstallationDetails"));
const InstallationEditingPage = lazy(() => import("./pages/InstallationEditing"));
const NotFoundPage = lazy(() => import("./pages/NotFound"));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingPage />}>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route element={<RequireAuth />}>
            <Route path="/loading" element={<Navigate to="/instalacoes" replace />} />
            <Route path="/instalacoes" element={<InstallationsPage />} />
            <Route path="/instalacoes/cadastrar" element={<InstallationRegistrationPage />} />
            <Route path="/instalacoes/:installationId" element={<InstallationDetailsPage />} />
            <Route path="/instalacoes/:installationId/editar" element={<InstallationEditingPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;

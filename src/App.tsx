import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";

import { LoginPage } from "./pages/login";
import { LoadingPage } from "./pages/loading";
import { RequireAuth } from "./components/RequireAuth";

const InstallationsPage = lazy(() => import("./pages/Installations"));
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
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";

import { LoginPage } from "./pages/login";
import { LoadingPage } from "./pages/loading";

const InstallationsPage = lazy(() => import("./pages/Installations"));
const NotFoundPage = lazy(() => import("./pages/NotFound"));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingPage />}>
        <Routes>
          <Route path="/" element={<LoginPage />} />

          <Route path="/loading" element={<LoadingPage />} />
            <Route path="/instalacoes" element={<InstallationsPage />} />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;

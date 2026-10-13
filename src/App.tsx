import { BrowserRouter, Route, Routes } from "react-router-dom";

import { RegisterProvider } from "./contexts/RegisterContext";

import { RegisterPage } from "./pages/registerUser";
import { RegisterCredentialsPage } from "./pages/registerCredentials";
import { LoginPage } from "./pages/login";
import { LoadingPage } from "./pages/loading";

function App() {
  return (
    <BrowserRouter>
      <RegisterProvider>
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
              <LoadingPage title="Cadastrando seus dados..." />
            }
          />

          <Route
            path="/login"
            element={<LoginPage />}
          />

          <Route
            path="/loading"
            element={<LoadingPage />}
          />
        </Routes>
      </RegisterProvider>
    </BrowserRouter>
  );
}

export default App;
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { LoginPage } from "./pages/login";
import { LoadingPage } from "./pages/loading";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/loading" element={<LoadingPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext/useAuth";

export function RequireAuth() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

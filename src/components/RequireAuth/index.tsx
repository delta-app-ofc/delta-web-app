import { useSyncExternalStore } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { getSession, subscribeSession } from "../../services/session";

export function RequireAuth() {
  const session = useSyncExternalStore(subscribeSession, getSession);
  return session ? <Outlet /> : <Navigate to="/login" replace />;
}

import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useEnvironment } from "@/contexts/EnvironmentContext";

/** Auditoria ainda não existe para o ambiente Ideali. */
const RequireNotIdeali = ({ children }: { children: ReactNode }) => {
  const { environment } = useEnvironment();
  if (environment === "Ideali") return <Navigate to="/carteira-ideali" replace />;
  return <>{children}</>;
};

export default RequireNotIdeali;
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export const ENVIRONMENTS = ["Rotina", "Alugar", "Ideali"] as const;
export type Environment = (typeof ENVIRONMENTS)[number];

const STORAGE_KEY = "kmr:environment";

interface EnvironmentContextValue {
  environment: Environment;
  setEnvironment: (env: Environment) => void;
}

const EnvironmentContext = createContext<EnvironmentContextValue>({
  environment: "Rotina",
  setEnvironment: () => {},
});

function readStored(): Environment {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw && (ENVIRONMENTS as readonly string[]).includes(raw)) return raw as Environment;
  } catch {
    /* ignore */
  }
  return "Rotina";
}

export function EnvironmentProvider({ children }: { children: ReactNode }) {
  const [environment, setEnvironmentState] = useState<Environment>(() => readStored());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, environment);
    } catch {
      /* ignore */
    }
  }, [environment]);

  const setEnvironment = useCallback((env: Environment) => setEnvironmentState(env), []);

  const value = useMemo(() => ({ environment, setEnvironment }), [environment, setEnvironment]);

  return <EnvironmentContext.Provider value={value}>{children}</EnvironmentContext.Provider>;
}

export function useEnvironment() {
  return useContext(EnvironmentContext);
}
import { useNavigate } from "react-router-dom";
import { Building2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ENVIRONMENTS, useEnvironment, type Environment } from "@/contexts/EnvironmentContext";

export function EnvironmentSelect() {
  const { environment, setEnvironment } = useEnvironment();
  const navigate = useNavigate();

  const handleChange = (value: string) => {
    const env = value as Environment;
    if (env === environment) return;
    setEnvironment(env);
    if (env === "Ideali") navigate("/carteira-ideali");
    else if (environment === "Ideali") navigate("/dashboard");
  };

  return (
    <Select value={environment} onValueChange={handleChange}>
      <SelectTrigger
        aria-label="Selecionar ambiente"
        className="h-9 w-[140px] gap-2 text-sm"
      >
        <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end" className="bg-popover z-50">
        {ENVIRONMENTS.map((env) => (
          <SelectItem key={env} value={env}>
            {env}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
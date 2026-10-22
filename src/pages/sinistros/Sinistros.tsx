import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { garantidoraColor } from "@/pages/auditoria/lib/garantidoras";
import {
  useSinistrosEnriquecidos,
  statusSinistroLabel,
  GARANTIDORAS_FILTRO,
  GARANTIDORA_NAO_IDENTIFICADA,
} from "./lib/sinistrosEnriquecidos";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ArrowLeft, LogOut, Plus, Eye, Search } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import logoKMR from "@/assets/Logo_KMR.png";
import { useEnvironment } from "@/contexts/EnvironmentContext";

const SINISTRO_STATUS_CLASS: Record<string, string> = {
  em_analise: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200",
  pagamento: "bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200",
  pago: "bg-green-100 text-green-800 hover:bg-green-100 border-green-200",
  cancelado: "bg-red-100 text-red-800 hover:bg-red-100 border-red-200",
};

const GarantidoraBadge = ({ g }: { g: string }) => {
  if (g === "Alerta")
    return <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100">Alerta</Badge>;
  if (g === GARANTIDORA_NAO_IDENTIFICADA)
    return <Badge variant="outline" className="bg-muted text-muted-foreground">{g}</Badge>;
  const c = garantidoraColor(g);
  return <Badge style={{ backgroundColor: c.bg, color: c.text }} className="border-0">{c.label}</Badge>;
};

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const getStatusBadge = (status: string) => {
  const key = status === "rascunho" || status === "aberto" ? "em_analise" : status;
  return { label: statusSinistroLabel(status), className: SINISTRO_STATUS_CLASS[key] ?? "bg-muted text-muted-foreground" };
};

const getImovelLabel = (status: string) =>
  status === "desocupado" ? "Rescindido" : status === "ocupado" ? "Ocupado" : status;

const Sinistros = () => {
  const navigate = useNavigate();
  const { environment } = useEnvironment();
  const { data, loading } = useSinistrosEnriquecidos(environment);
  const [search, setSearch] = useState("");
  const [filtroGar, setFiltroGar] = useState("todas");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/login");
    });
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const filtered = data.filter((s) => {
    const q = search.toLowerCase();
    if (filtroGar !== "todas" && s.garantidora !== filtroGar) return false;
    return (
      !q ||
      s.inquilino_nome.toLowerCase().includes(q) ||
      s.inquilino_cpf.includes(q) ||
      s.codigo_contrato.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="bg-card border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <img src={logoKMR} alt="KMR" className="h-8 w-auto hidden sm:block" />
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-1" />
            Sair
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">Sinistros</h1>
          <Button
            onClick={() => navigate("/novo-sinistro")}
            className="min-h-[44px] w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-1" />
            Registrar novo sinistro
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, CPF ou contrato..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 min-h-[44px]"
          />
        </div>
          <Select value={filtroGar} onValueChange={setFiltroGar}>
            <SelectTrigger className="sm:w-56 min-h-[44px]" aria-label="Garantidora">
              <SelectValue placeholder="Garantidora" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as garantidoras</SelectItem>
              {GARANTIDORAS_FILTRO.map((g) => (
                <SelectItem key={g} value={g}>{g}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Inquilino</TableHead>
                <TableHead className="hidden md:table-cell">Contrato</TableHead>
                <TableHead>Garantidora</TableHead>
                <TableHead className="hidden lg:table-cell">Vencimento(s)</TableHead>
                <TableHead className="hidden lg:table-cell">Imóvel</TableHead>
                <TableHead className="hidden sm:table-cell text-right">Valor total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell">Criado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    {search || filtroGar !== "todas" ? "Nenhum resultado encontrado." : "Nenhum sinistro registrado."}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((s) => {
                  const badge = getStatusBadge(s.status);
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.inquilino_nome}</TableCell>
                      <TableCell className="hidden md:table-cell">{s.codigo_contrato}</TableCell>
                      <TableCell><GarantidoraBadge g={s.garantidora} /></TableCell>
                      <TableCell className="hidden lg:table-cell text-sm whitespace-nowrap">
                        {s.vencimentos.length ? s.vencimentos.join(", ") : <span className="text-muted-foreground">Sem débitos</span>}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge variant="outline">{getImovelLabel(s.status_imovel)}</Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-right whitespace-nowrap">{brl(s.valor_total_sinistro)}</TableCell>
                      <TableCell>
                        <Badge className={badge.className} variant="outline">
                          {badge.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                        {format(new Date(s.created_at), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/novo-sinistro/resumo/${s.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  );
};

export default Sinistros;
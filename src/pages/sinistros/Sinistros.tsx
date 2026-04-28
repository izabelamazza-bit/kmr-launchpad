import { useEffect, useState } from "react";
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

interface SinistroRow {
  id: string;
  inquilino_nome: string;
  inquilino_cpf: string;
  codigo_contrato: string;
  status_imovel: string;
  status: string;
  created_at: string;
}

const SINISTRO_STATUS: Record<string, { label: string; className: string }> = {
  em_analise: {
    label: "Em análise",
    className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200",
  },
  pagamento: {
    label: "Em pagamento",
    className: "bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200",
  },
  pago: {
    label: "Pago",
    className: "bg-green-100 text-green-800 hover:bg-green-100 border-green-200",
  },
  cancelado: {
    label: "Cancelado",
    className: "bg-red-100 text-red-800 hover:bg-red-100 border-red-200",
  },
};

const getStatusBadge = (status: string) => {
  // Compatibilidade: registros legados (rascunho/aberto) viram "Em análise"
  if (status === "rascunho" || status === "aberto") return SINISTRO_STATUS.em_analise;
  return (
    SINISTRO_STATUS[status] ?? {
      label: status,
      className: "bg-muted text-muted-foreground",
    }
  );
};

const getImovelLabel = (status: string) =>
  status === "desocupado" ? "Rescindido" : status === "ocupado" ? "Ocupado" : status;

const Sinistros = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<SinistroRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/login");
    });
  }, [navigate]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("sinistros")
        .select("id, inquilino_nome, inquilino_cpf, codigo_contrato, status_imovel, status, created_at")
        .order("created_at", { ascending: false });
      setData((data ?? []) as SinistroRow[]);
      setLoading(false);
    })();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const filtered = data.filter((s) => {
    const q = search.toLowerCase();
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

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, CPF ou contrato..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 min-h-[44px]"
          />
        </div>

        <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Inquilino</TableHead>
                <TableHead className="hidden md:table-cell">Contrato</TableHead>
                <TableHead>Imóvel</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell">Criado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {search ? "Nenhum resultado encontrado." : "Nenhum sinistro registrado."}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((s) => {
                  const badge = getStatusBadge(s.status);
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.inquilino_nome}</TableCell>
                      <TableCell className="hidden md:table-cell">{s.codigo_contrato}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{getImovelLabel(s.status_imovel)}</Badge>
                      </TableCell>
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
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import CrudLayout from "@/components/crud/CrudLayout";
import DataTable, { Column } from "@/components/crud/DataTable";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { GarantidoraBadge } from "./components/GarantidoraBadge";
import { ImportImoviewModal } from "./components/ImportImoviewModal";
import { reprocessAddressNok } from "./lib/reprocessAddress";
import { Button } from "@/components/ui/button";
import { FileUp } from "lucide-react";

interface ContractRow {
  id: string;
  imoview_number: string;
  garantidora: string | null;
  ocupacao: string | null;
  status_contrato: string | null;
  analyst_id: string | null;
  analyst_name: string | null;
  audit_status: string;
  updated_at: string;
  empresa: string | null;
  locatarios: string | null;
  endereco_imovel: string | null;
  garantidora_normalizada: string | null;
  total_items: number;
  ok_items: number;
  has_alert: boolean;
}

const Auditoria = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<ContractRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filtroGar, setFiltroGar] = useState("todos");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroOcup, setFiltroOcup] = useState("todos");
  const [filtroProg, setFiltroProg] = useState("todos");
  const [filtroAnalista, setFiltroAnalista] = useState("todos");
  const [filtroEmpresa, setFiltroEmpresa] = useState("todos");
  const [analistas, setAnalistas] = useState<{ value: string; label: string }[]>([]);
  const [importOpen, setImportOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/login");
    });
  }, [navigate]);


  const load = async () => {
      setLoading(true);
      const { data: contracts } = await supabase
        .from("audit_contracts")
        .select("*")
        .order("updated_at", { ascending: false });

      const list = (contracts ?? []) as any[];
      const ids = list.map((c) => c.id);

      const [extractedRes, itemsRes] = await Promise.all([
        ids.length
          ? supabase
              .from("audit_contract_extracted_data")
              .select("contract_id, locatarios, endereco_imovel, garantidora_normalizada")
              .in("contract_id", ids)
          : Promise.resolve({ data: [] as any[] }),
        ids.length
          ? supabase
              .from("audit_checklist_items")
              .select("contract_id, status")
              .in("contract_id", ids)
          : Promise.resolve({ data: [] as any[] }),
      ]);

      const extractedMap = new Map<string, any>();
      (extractedRes.data ?? []).forEach((e: any) => extractedMap.set(e.contract_id, e));
      const itemsByContract = new Map<string, { total: number; ok: number }>();
      (itemsRes.data ?? []).forEach((i: any) => {
        const cur = itemsByContract.get(i.contract_id) ?? { total: 0, ok: 0 };
        cur.total += 1;
        if (i.status === "ok") cur.ok += 1;
        itemsByContract.set(i.contract_id, cur);
      });

      const merged: ContractRow[] = list.map((c) => {
        const ex = extractedMap.get(c.id);
        const counts = itemsByContract.get(c.id) ?? { total: 0, ok: 0 };
        const gNorm = ex?.garantidora_normalizada ?? null;
        const divergente =
          gNorm && c.garantidora && gNorm !== c.garantidora && gNorm !== "Quintocred";
        const has_alert =
          c.garantidora === "Alerta" ||
          gNorm === "Quintocred" ||
          gNorm === "Outra" ||
          gNorm === "Não identificada" ||
          divergente;
        return {
          id: c.id,
          imoview_number: c.imoview_number,
          garantidora: c.garantidora,
          ocupacao: c.ocupacao,
          status_contrato: c.status_contrato,
          analyst_id: c.analyst_id,
          analyst_name: c.analyst_name,
          audit_status: c.audit_status,
          updated_at: c.updated_at,
          empresa: c.empresa ?? null,
          locatarios: c.locatario_nome ?? ex?.locatarios ?? null,
          endereco_imovel: c.endereco_imovel ?? ex?.endereco_imovel ?? null,
          garantidora_normalizada: gNorm,
          total_items: counts.total,
          ok_items: counts.ok,
          has_alert,
        };
      });

      setRows(merged);

      const uniqueAnalistas = new Map<string, string>();
      merged.forEach((r) => {
        if (r.analyst_id) uniqueAnalistas.set(r.analyst_id, r.analyst_name ?? "—");
      });
      setAnalistas(
        Array.from(uniqueAnalistas.entries()).map(([value, label]) => ({ value, label }))
      );
      setLoading(false);
    };

  useEffect(() => {
    (async () => {
      await reprocessAddressNok();
      await load();
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter((r) => {
      if (q) {
        const hay = `${r.imoview_number} ${r.locatarios ?? ""} ${r.endereco_imovel ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filtroGar !== "todos" && r.garantidora !== filtroGar) return false;
      if (filtroStatus !== "todos" && r.status_contrato !== filtroStatus) return false;
      if (filtroOcup !== "todos" && r.ocupacao !== filtroOcup) return false;
      if (filtroEmpresa !== "todos" && r.empresa !== filtroEmpresa) return false;
      if (filtroProg === "completo" && r.audit_status !== "Completa") return false;
      if (
        filtroProg === "incompleto" &&
        !["Em andamento", "Nao iniciada"].includes(r.audit_status)
      )
        return false;
      if (filtroProg === "alerta" && !r.has_alert && r.audit_status !== "Com pendencia")
        return false;
      if (filtroAnalista !== "todos" && r.analyst_id !== filtroAnalista)
        return false;
      return true;
    });
  }, [rows, search, filtroGar, filtroStatus, filtroOcup, filtroEmpresa, filtroProg, filtroAnalista]);

  const totals = useMemo(() => {
    const t = {
      total: rows.length,
      completa: 0,
      pendencia: 0,
      alerta: 0,
      loft: 0,
      credaluga: 0,
      kmr: 0,
    };
    const scope = rows.filter((r) => filtroEmpresa === "todos" || r.empresa === filtroEmpresa);
    t.total = scope.length;
    scope.forEach((r) => {
      if (r.audit_status === "Completa") t.completa += 1;
      if (r.audit_status === "Com pendencia" || (r.audit_status !== "Completa" && r.total_items > 0 && r.ok_items < r.total_items)) t.pendencia += 1;
      if (r.has_alert) t.alerta += 1;
      if (r.garantidora === "Loft") t.loft += 1;
      if (r.garantidora === "Credaluga") t.credaluga += 1;
      if (r.garantidora === "KMR") t.kmr += 1;
    });
    return t;
  }, [rows, filtroEmpresa]);

  const columns: Column<ContractRow>[] = [
    {
      key: "imoview_number",
      label: "Nº Imoview",
      render: (r) => <span className="font-mono font-medium">{r.imoview_number}</span>,
    },
    { key: "locatarios", label: "Locatário", render: (r) => r.locatarios ?? "—" },
    {
      key: "endereco",
      label: "Endereço",
      render: (r) => (
        <span className="text-sm text-muted-foreground line-clamp-1">
          {r.endereco_imovel ?? "—"}
        </span>
      ),
      hideOnMobile: true,
    },
    {
      key: "garantidora",
      label: "Garantidora",
      render: (r) => (
        <div className="flex items-center gap-2">
          <GarantidoraBadge value={r.garantidora === "Alerta" ? "Alerta" : r.has_alert ? "Quintocred" : r.garantidora} />
        </div>
      ),
    },
    {
      key: "empresa",
      label: "Empresa",
      render: (r) => r.empresa ?? "—",
    },
    {
      key: "ocupacao",
      label: "Ocupação",
      render: (r) => r.ocupacao ?? "—",
      hideOnMobile: true,
    },
    {
      key: "status_contrato",
      label: "Status",
      render: (r) =>
        r.status_contrato === "Saudavel" ? (
          <Badge className="bg-[#27AE60] hover:bg-[#27AE60]/90 text-white">Saudável</Badge>
        ) : r.status_contrato === "Inadimplente" ? (
          <Badge variant="destructive">Inadimplente</Badge>
        ) : (
          "—"
        ),
    },
    {
      key: "progresso",
      label: "Progresso",
      render: (r) => {
        const pct = r.total_items ? Math.round((r.ok_items / r.total_items) * 100) : 0;
        return (
          <div className="min-w-[120px]">
            <div className="text-xs text-muted-foreground mb-1">
              {r.ok_items}/{r.total_items} itens
            </div>
            <Progress value={pct} className="h-1.5" />
          </div>
        );
      },
    },
    {
      key: "updated_at",
      label: "Atualização",
      render: (r) => format(new Date(r.updated_at), "dd/MM/yyyy HH:mm"),
      hideOnMobile: true,
    },
  ];

  return (
    <CrudLayout
      title="Auditoria de Contratos"
      searchValue={search}
      onSearchChange={setSearch}
      onNewClick={() => navigate("/auditoria/novo")}
      newLabel="Novo contrato"
      extraActions={
        <Button
          variant="outline"
          className="min-h-[44px] w-full sm:w-auto"
          onClick={() => setImportOpen(true)}
        >
          <FileUp className="h-4 w-4 mr-1" />
          Importar planilha Imoview
        </Button>
      }
    >
      <ImportImoviewModal open={importOpen} onOpenChange={setImportOpen} onDone={load} />
      {(
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <KpiCard label="Total" value={totals.total} color="#0F2A44" />
            <KpiCard label="Auditoria completa" value={totals.completa} color="#27AE60" />
            <KpiCard label="Com pendências" value={totals.pendencia} color="#F2994A" />
            <KpiCard label="Com alerta" value={totals.alerta} color="#EB5757" />
          </div>
          <div className="grid grid-cols-3 gap-3 mb-6">
            <KpiCard label="Loft" value={totals.loft} color="#2F80ED" />
            <KpiCard label="Credaluga" value={totals.credaluga} color="#27AE60" />
            <KpiCard label="KMR" value={totals.kmr} color="#F2C94C" />
          </div>

          {/* Filters */}
          <Card className="mb-4">
            <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Empresa</div>
                <SearchableSelect
                  value={filtroEmpresa}
                  onChange={setFiltroEmpresa}
                  options={[
                    { value: "todos", label: "Todas" },
                    { value: "Rotina", label: "Rotina" },
                    { value: "Alugar", label: "Alugar" },
                  ]}
                  placeholder="Todas"
                />
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Garantidora</div>
                <SearchableSelect
                  value={filtroGar}
                  onChange={setFiltroGar}
                  options={[
                    { value: "todos", label: "Todas" },
                    { value: "Loft", label: "Loft" },
                    { value: "Credaluga", label: "Credaluga" },
                    { value: "KMR", label: "KMR" },
                  ]}
                  placeholder="Todas"
                />
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Status</div>
                <SearchableSelect
                  value={filtroStatus}
                  onChange={setFiltroStatus}
                  options={[
                    { value: "todos", label: "Todos" },
                    { value: "Saudavel", label: "Saudável" },
                    { value: "Inadimplente", label: "Inadimplente" },
                  ]}
                  placeholder="Todos"
                />
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Ocupação</div>
                <SearchableSelect
                  value={filtroOcup}
                  onChange={setFiltroOcup}
                  options={[
                    { value: "todos", label: "Todas" },
                    { value: "Ocupado", label: "Ocupado" },
                    { value: "Desocupado", label: "Desocupado" },
                  ]}
                  placeholder="Todas"
                />
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Progresso</div>
                <Tabs value={filtroProg} onValueChange={setFiltroProg}>
                  <TabsList className="w-full">
                    <TabsTrigger value="todos" className="flex-1">Todos</TabsTrigger>
                    <TabsTrigger value="completo" className="flex-1">Completo</TabsTrigger>
                    <TabsTrigger value="incompleto" className="flex-1">Incompleto</TabsTrigger>
                    <TabsTrigger value="alerta" className="flex-1">Alerta</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <div>
                  <div className="text-xs text-muted-foreground mb-1">Analista</div>
                  <SearchableSelect
                    value={filtroAnalista}
                    onChange={setFiltroAnalista}
                    options={[{ value: "todos", label: "Todos" }, ...analistas]}
                    placeholder="Todos"
                  />
              </div>
            </CardContent>
          </Card>

          <DataTable
            columns={columns}
            data={filtered}
            onEdit={(item) => navigate(`/auditoria/${item.id}`)}
            onDelete={() => {}}
            loading={loading}
            isFiltered={search.length > 0 || filtroGar !== "todos"}
            emptyMessage="Nenhum contrato de auditoria cadastrado ainda."
            onRowClick={(item) => navigate(`/auditoria/${item.id}`)}
          />
        </>
      )}
    </CrudLayout>
  );
};

function KpiCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-2xl font-bold mt-1" style={{ color }}>
          {value}
        </div>
      </CardContent>
    </Card>
  );
}

export default Auditoria;
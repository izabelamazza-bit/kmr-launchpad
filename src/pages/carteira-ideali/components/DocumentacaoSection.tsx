import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertTriangle, Star, Search, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DRIVE_STATUS, STATUS_FILA, type DriveStatus, type StatusFila } from "../lib/documentosImport";
import type { DocumentoRecord, FilaRecord } from "../lib/useDocumentosIdeali";

const STATUS_STYLE: Record<DriveStatus, string> = {
  "Não existe no Drive": "bg-destructive/10 text-destructive border-destructive/30",
  "Pasta existe, sem contrato de locação": "bg-amber-500/10 text-amber-700 border-amber-500/30",
  "Só versão não assinada": "bg-amber-500/10 text-amber-700 border-amber-500/30",
  "Contrato assinado encontrado": "bg-[#27AE60]/10 text-[#27AE60] border-[#27AE60]/30",
};

const CARD_ACCENT: Record<DriveStatus, string> = {
  "Não existe no Drive": "border-l-4 border-l-destructive",
  "Pasta existe, sem contrato de locação": "border-l-4 border-l-amber-500",
  "Só versão não assinada": "border-l-4 border-l-amber-500",
  "Contrato assinado encontrado": "border-l-4 border-l-[#27AE60]",
};

const VERIF_OPTIONS = ["Não verificado", "Sim", "Não", "Não se aplica"];
const LOC_OPTIONS = ["Pendente", "Drive", "Loft", "Seguradora", "Físico", "Não localizado"];

interface Props {
  documentos: DocumentoRecord[];
  fila: FilaRecord[];
  loading: boolean;
  onFilaChange: (row: FilaRecord) => void;
}

export function DocumentacaoSection({ documentos, fila, loading, onFilaChange }: Props) {
  const [statusFilter, setStatusFilter] = useState<DriveStatus | null>(null);
  const [search, setSearch] = useState("");

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    documentos.forEach((d) => {
      c[d.status_documento_drive] = (c[d.status_documento_drive] ?? 0) + 1;
    });
    return c;
  }, [documentos]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return documentos.filter((d) => {
      if (statusFilter && d.status_documento_drive !== statusFilter) return false;
      if (!term) return true;
      return (
        d.codigo_contrato.toLowerCase().includes(term) ||
        (d.inquilino ?? "").toLowerCase().includes(term) ||
        (d.endereco ?? "").toLowerCase().includes(term)
      );
    });
  }, [documentos, statusFilter, search]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
        <Loader2 className="h-5 w-5 animate-spin" /> Carregando documentação...
      </div>
    );
  }

  if (documentos.length === 0 && fila.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">7. Documentação</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Nenhum dado de documentação importado ainda. Use "Importar auditoria de documentos" acima.
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">7. Documentação</h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {DRIVE_STATUS.map((s) => {
          const active = statusFilter === s;
          return (
            <button key={s} type="button" onClick={() => setStatusFilter(active ? null : s)} className="text-left">
              <Card className={`${CARD_ACCENT[s]} h-full transition-shadow hover:shadow-md ${active ? "ring-2 ring-primary" : ""}`}>
                <CardContent className="p-4">
                  <p className="text-2xl font-bold">{counts[s] ?? 0}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-snug">{s}</p>
                </CardContent>
              </Card>
            </button>
          );
        })}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Situação dos documentos no Drive</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por contrato, inquilino ou endereço"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-left">
                  <th className="p-2 font-medium">Contrato</th>
                  <th className="p-2 font-medium">Inquilino</th>
                  <th className="p-2 font-medium">Status no Drive</th>
                  <th className="p-2 font-medium">Pasta / arquivos</th>
                  <th className="p-2 font-medium text-muted-foreground font-normal">Planilha: contrato</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => {
                  const divergente =
                    d.contrato_locacao && d.status_documento_drive !== "Contrato assinado encontrado";
                  return (
                    <tr key={d.id} className="border-t">
                      <td className="p-2 font-mono text-xs whitespace-nowrap">
                        <span className="inline-flex items-center gap-1">
                          {d.prioritario && <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />}
                          {d.codigo_contrato}
                        </span>
                      </td>
                      <td className="p-2 max-w-[220px] truncate">{d.inquilino ?? "—"}</td>
                      <td className="p-2">
                        <Badge variant="outline" className={STATUS_STYLE[d.status_documento_drive]}>
                          {d.status_documento_drive}
                        </Badge>
                      </td>
                      <td className="p-2 text-xs text-muted-foreground whitespace-nowrap">
                        {d.pasta_encontrada_drive ? `${d.nome_pasta_drive ?? "—"} (${d.n_arquivos_drive})` : "Sem pasta"}
                      </td>
                      <td className="p-2 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          {d.contrato_locacao ? "Sim" : "Não"}
                          {divergente && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  A planilha de controle marca o contrato como entregue, mas a varredura do
                                  Drive não encontrou o contrato assinado. Vale o status do Drive.
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-muted-foreground">
                      Nenhum contrato encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-muted-foreground">
            O status do Drive é a informação principal. A coluna "Planilha: contrato" é apenas
            referência secundária — quando os dois divergem, prevalece o resultado da varredura do Drive.
          </p>
        </CardContent>
      </Card>

      <FilaAnalista fila={fila} onFilaChange={onFilaChange} />
    </section>
  );
}

function FilaAnalista({ fila, onFilaChange }: { fila: FilaRecord[]; onFilaChange: (r: FilaRecord) => void }) {
  const [search, setSearch] = useState("");
  const [statusFila, setStatusFila] = useState<string>("todos");
  const [driveFilter, setDriveFilter] = useState<string>("todos");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const pendentes = fila.filter((f) => f.status_fila === "Pendente").length;

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return fila.filter((f) => {
      if (statusFila !== "todos" && f.status_fila !== statusFila) return false;
      if (driveFilter !== "todos" && f.status_documento_drive !== driveFilter) return false;
      if (!term) return true;
      return (
        f.codigo_contrato.toLowerCase().includes(term) || (f.inquilino ?? "").toLowerCase().includes(term)
      );
    });
  }, [fila, search, statusFila, driveFilter]);

  const update = async (row: FilaRecord, patch: Partial<FilaRecord>) => {
    setSavingId(row.id);
    const payload: Partial<FilaRecord> = { ...patch };
    if (patch.status_fila) {
      payload.resolvido_em = patch.status_fila === "Resolvido" ? new Date().toISOString() : null;
    }
    const { error } = await supabase.from("ideali_fila_analista").update(payload).eq("id", row.id);
    setSavingId(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    onFilaChange({ ...row, ...payload } as FilaRecord);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          Fila do Analista
          <Badge variant="outline">{pendentes} pendente(s)</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar contrato ou inquilino"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={statusFila} onValueChange={setStatusFila}>
            <SelectTrigger className="sm:w-52"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas as situações</SelectItem>
              {STATUS_FILA.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={driveFilter} onValueChange={setDriveFilter}>
            <SelectTrigger className="sm:w-64"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status do Drive</SelectItem>
              {DRIVE_STATUS.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          {filtered.map((f) => {
            const open = expanded === f.id;
            return (
              <div key={f.id} className="rounded-md border">
                <button
                  type="button"
                  onClick={() => setExpanded(open ? null : f.id)}
                  className="w-full flex flex-wrap items-center gap-2 p-3 text-left hover:bg-muted/40"
                >
                  <span className="text-xs text-muted-foreground w-8">#{f.ordem}</span>
                  <span className="font-mono text-xs">{f.codigo_contrato}</span>
                  <span className="flex-1 min-w-[140px] truncate text-sm">{f.inquilino ?? "—"}</span>
                  <Badge variant="outline" className={STATUS_STYLE[f.status_documento_drive]}>
                    {f.status_documento_drive}
                  </Badge>
                  <Badge variant={f.status_fila === "Resolvido" ? "default" : "secondary"}>{f.status_fila}</Badge>
                </button>

                {open && (
                  <div className="border-t p-3 grid gap-3 sm:grid-cols-2">
                    <FieldSelect
                      label="Localização do documento"
                      value={f.localizacao_documento}
                      options={LOC_OPTIONS}
                      onChange={(v) => update(f, { localizacao_documento: v })}
                    />
                    <FieldSelect
                      label="Status na Loft/Seguradora"
                      value={f.status_loft_seguradora}
                      options={["Pendente", "Registrado", "Não registrado", "Divergente"]}
                      onChange={(v) => update(f, { status_loft_seguradora: v })}
                    />
                    <FieldSelect
                      label="Cláusula garantidora presente"
                      value={f.clausula_garantidora_presente}
                      options={VERIF_OPTIONS}
                      onChange={(v) => update(f, { clausula_garantidora_presente: v })}
                    />
                    <FieldSelect
                      label="Nome do inquilino confere"
                      value={f.nome_inquilino_confere}
                      options={VERIF_OPTIONS}
                      onChange={(v) => update(f, { nome_inquilino_confere: v })}
                    />
                    <FieldSelect
                      label="Endereço confere"
                      value={f.endereco_confere}
                      options={VERIF_OPTIONS}
                      onChange={(v) => update(f, { endereco_confere: v })}
                    />
                    <FieldSelect
                      label="Situação na fila"
                      value={f.status_fila}
                      options={[...STATUS_FILA]}
                      onChange={(v) => update(f, { status_fila: v as StatusFila })}
                    />
                    <div className="sm:col-span-2">
                      <label className="text-xs font-medium mb-1 block">Observações</label>
                      <Textarea
                        defaultValue={f.observacoes ?? ""}
                        rows={2}
                        onBlur={(e) => {
                          const v = e.target.value.trim() || null;
                          if (v !== f.observacoes) update(f, { observacoes: v });
                        }}
                      />
                    </div>
                    {savingId === f.id && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 sm:col-span-2">
                        <Loader2 className="h-3 w-3 animate-spin" /> Salvando...
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground py-6 text-center">Nenhum item na fila.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function FieldSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  const list = options.includes(value) ? options : [value, ...options];
  return (
    <div>
      <label className="text-xs font-medium mb-1 block">{label}</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          {list.map((o) => (
            <SelectItem key={o} value={o}>{o}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export default DocumentacaoSection;
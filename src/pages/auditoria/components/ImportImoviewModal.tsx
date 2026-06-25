import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Loader2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { parseImoviewFile, type Empresa, type ParsedRow } from "../lib/imoviewImport";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onDone: () => void;
}

interface Summary {
  total: number;
  imported: number;
  updated: string[];
  unchanged: string[];
  ignoredStatus: string[];
  ignoredInvalid: number;
  errors: { codigo: string; error: string }[];
}

export function ImportImoviewModal({ open, onOpenChange, onDone }: Props) {
  const [empresa, setEmpresa] = useState<Empresa | "">("");
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);

  const reset = () => {
    setEmpresa("");
    setFile(null);
    setSummary(null);
    setImporting(false);
  };

  const handleClose = () => {
    onOpenChange(false);
    if (summary) onDone();
    setTimeout(reset, 300);
  };

  const handleImport = async () => {
    if (!empresa) return toast.error("Selecione a empresa");
    if (!file) return toast.error("Selecione um arquivo");
    setImporting(true);
    try {
      const parsed = await parseImoviewFile(file);
      const { data: sess } = await supabase.auth.getSession();
      const userId = sess.session?.user.id;
      if (!userId) throw new Error("Sessão inválida");

      const batchId = crypto.randomUUID();
      const updated: string[] = [];
      const unchanged: string[] = [];
      const errors: { codigo: string; error: string }[] = [];
      let imported = 0;

      // existing records (full Section A snapshot for merge)
      const numbers = parsed.valid.map((r) => r.imoview_number);
      const existing = new Map<string, any>();
      if (numbers.length) {
        const { data: ex } = await supabase
          .from("audit_contracts")
          .select(
            "id, imoview_number, locador_nome, locador_cpf, locatario_nome, locatario_cpf, endereco_imovel, valor_aluguel, data_inicio, data_fim, data_proximo_reajuste, indice_reajuste, empresa, analyst_name"
          )
          .in("imoview_number", numbers);
        (ex ?? []).forEach((e: any) => existing.set(e.imoview_number, e));
      }

      const isEmpty = (v: any) => v === null || v === undefined || v === "";

      for (const r of parsed.valid) {
        const current = existing.get(r.imoview_number);
        if (current) {
          const candidate: Record<string, any> = {
            locador_nome: r.locador_nome,
            locador_cpf: r.locador_cpf,
            locatario_nome: r.locatario_nome,
            locatario_cpf: r.locatario_cpf,
            endereco_imovel: r.endereco_imovel,
            valor_aluguel: r.valor_aluguel,
            data_inicio: r.data_inicio,
            data_fim: r.data_fim,
            data_proximo_reajuste: r.data_proximo_reajuste,
            indice_reajuste: r.indice_reajuste,
            empresa,
            analyst_name: r.analista_nome,
          };
          const patch: Record<string, any> = {};
          for (const [k, v] of Object.entries(candidate)) {
            if (!isEmpty(v) && isEmpty(current[k])) patch[k] = v;
          }
          if (Object.keys(patch).length === 0) {
            unchanged.push(r.imoview_number);
            continue;
          }
          const { error: upErr } = await supabase
            .from("audit_contracts")
            .update(patch as any)
            .eq("id", current.id);
          if (upErr) {
            errors.push({ codigo: r.imoview_number, error: upErr.message });
            continue;
          }
          updated.push(r.imoview_number);
          continue;
        }
        const { data: ins, error } = await supabase
          .from("audit_contracts")
          .insert({
            imoview_number: r.imoview_number,
            garantidora: r.garantidora,
            ocupacao: r.ocupacao,
            status_contrato: r.status_contrato,
            analyst_name: r.analista_nome,
            empresa,
            valor_aluguel: r.valor_aluguel,
            data_inicio: r.data_inicio,
            data_fim: r.data_fim,
            data_proximo_reajuste: r.data_proximo_reajuste,
            indice_reajuste: r.indice_reajuste,
            locatario_nome: r.locatario_nome,
            locatario_cpf: r.locatario_cpf,
            locador_nome: r.locador_nome,
            locador_cpf: r.locador_cpf,
            endereco_imovel: r.endereco_imovel,
            import_batch_id: batchId,
            created_by: userId,
            audit_status: "Nao iniciada",
          } as any)
          .select("id")
          .single();
        if (error || !ins) {
          errors.push({ codigo: r.imoview_number, error: error?.message ?? "erro desconhecido" });
          continue;
        }
        // Seção B (audit_contract_extracted_data) NÃO é tocada na importação.
        // Ela só é preenchida após o upload + leitura automática do PDF.
        imported += 1;
      }

      setSummary({
        total: parsed.total,
        imported,
        updated,
        unchanged,
        ignoredStatus: parsed.ignoredStatus,
        ignoredInvalid: parsed.ignoredInvalid,
        errors,
      });
      toast.success(
        `${imported} novo(s) · ${updated.length} atualizado(s) · ${unchanged.length} sem alterações`
      );
    } catch (e: any) {
      toast.error(e?.message ?? "Falha na importação");
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(v) : handleClose())}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Importar planilha Imoview</DialogTitle>
        </DialogHeader>

        {!summary ? (
          <div className="space-y-4">
            <div>
              <Label className="mb-1.5 block">Empresa *</Label>
              <SearchableSelect
                value={empresa}
                onChange={(v) => setEmpresa(v as Empresa)}
                options={[
                  { value: "Rotina", label: "Rotina" },
                  { value: "Alugar", label: "Alugar" },
                ]}
                placeholder="Selecione a empresa"
              />
            </div>
            <div>
              <Label className="mb-1.5 block">Arquivo (.xls, .xlsx) *</Label>
              <Input
                type="file"
                accept=".xls,.xlsx"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                disabled={importing}
              />
            </div>
            {importing && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Importando contratos...
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={handleClose} disabled={importing}>
                Cancelar
              </Button>
              <Button onClick={handleImport} disabled={importing || !empresa || !file}>
                <Upload className="h-4 w-4 mr-1" />
                Importar
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-3 text-sm">
            <Row label="Total de linhas lidas" value={summary.total} />
            <Row label="Importados com sucesso" value={summary.imported} highlight="green" />
            <Row label="Atualizados (campos preenchidos)" value={summary.updated.length} highlight="green" />
            <Row label="Já completos (sem alterações)" value={summary.unchanged.length} />
            <Row
              label="Ignorados (status fora de Saudável/Atrasado)"
              value={summary.ignoredStatus.length}
            />
            <Row label="Ignorados (sem código)" value={summary.ignoredInvalid} />
            {summary.errors.length > 0 && (
              <Row label="Erros" value={summary.errors.length} highlight="red" />
            )}
            {summary.updated.length > 0 && (
              <details className="text-xs text-muted-foreground">
                <summary className="cursor-pointer">Ver atualizados</summary>
                <div className="mt-1 max-h-32 overflow-auto font-mono">
                  {summary.updated.join(", ")}
                </div>
              </details>
            )}
            {summary.errors.length > 0 && (
              <details className="text-xs text-destructive">
                <summary className="cursor-pointer">Ver erros</summary>
                <ul className="mt-1 max-h-32 overflow-auto">
                  {summary.errors.map((e, i) => (
                    <li key={i}>
                      <span className="font-mono">{e.codigo}</span>: {e.error}
                    </li>
                  ))}
                </ul>
              </details>
            )}
            <DialogFooter>
              <Button onClick={handleClose}>Fechar</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: "green" | "red";
}) {
  const color =
    highlight === "green" ? "text-[#27AE60]" : highlight === "red" ? "text-destructive" : "";
  return (
    <div className="flex justify-between items-center border-b pb-2">
      <span>{label}</span>
      <span className={`font-semibold ${color}`}>{value}</span>
    </div>
  );
}
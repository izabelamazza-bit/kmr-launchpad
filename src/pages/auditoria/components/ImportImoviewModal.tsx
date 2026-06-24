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
  duplicated: string[];
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
      const duplicated: string[] = [];
      const errors: { codigo: string; error: string }[] = [];
      let imported = 0;

      // existing numbers
      const numbers = parsed.valid.map((r) => r.imoview_number);
      let existing = new Set<string>();
      if (numbers.length) {
        const { data: ex } = await supabase
          .from("audit_contracts")
          .select("imoview_number")
          .in("imoview_number", numbers);
        existing = new Set((ex ?? []).map((e: any) => e.imoview_number));
      }

      for (const r of parsed.valid) {
        if (existing.has(r.imoview_number)) {
          duplicated.push(r.imoview_number);
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
        const exPayload: any = {
          contract_id: ins.id,
          locatarios: r.locatario_nome,
          cpf_locatarios: r.locatario_cpf,
          endereco_imovel: r.endereco_imovel,
          garantidora_normalizada: r.garantidora === "Alerta" ? "Outra" : r.garantidora,
          garantidora_identificada_raw: r.garantidora_raw,
          valor_aluguel: r.valor_aluguel,
          data_inicio: r.data_inicio,
          data_termino: r.data_fim,
          indice_reajuste: r.indice_reajuste,
        };
        const { error: exErr } = await supabase
          .from("audit_contract_extracted_data")
          .upsert(exPayload, { onConflict: "contract_id" });
        if (exErr) {
          errors.push({ codigo: r.imoview_number, error: `extracted: ${exErr.message}` });
        }
        imported += 1;
      }

      setSummary({
        total: parsed.total,
        imported,
        duplicated,
        ignoredStatus: parsed.ignoredStatus,
        ignoredInvalid: parsed.ignoredInvalid,
        errors,
      });
      toast.success(`${imported} contrato(s) importado(s)`);
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
            <Row label="Ignorados (já existentes)" value={summary.duplicated.length} />
            <Row
              label="Ignorados (status fora de Saudável/Atrasado)"
              value={summary.ignoredStatus.length}
            />
            <Row label="Ignorados (sem código)" value={summary.ignoredInvalid} />
            {summary.errors.length > 0 && (
              <Row label="Erros" value={summary.errors.length} highlight="red" />
            )}
            {summary.duplicated.length > 0 && (
              <details className="text-xs text-muted-foreground">
                <summary className="cursor-pointer">Ver duplicados</summary>
                <div className="mt-1 max-h-32 overflow-auto font-mono">
                  {summary.duplicated.join(", ")}
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
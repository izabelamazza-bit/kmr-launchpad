import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { parseIdealiFile, type IdealiParseResult } from "../lib/idealiImport";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onDone?: () => void;
}

interface Result {
  contratos: number;
  faturas: number;
  incompletas: number;
  errors: string[];
}

const CHUNK = 500;

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export function ImportIdealiModal({ open, onOpenChange, onDone }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState("");
  const [parsed, setParsed] = useState<IdealiParseResult | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  const reset = () => {
    setFile(null);
    setParsed(null);
    setResult(null);
    setAnalyzing(false);
    setSaving(false);
    setProgress("");
  };

  const handleClose = () => {
    if (saving) return;
    onOpenChange(false);
    if (result) onDone?.();
    setTimeout(reset, 300);
  };

  const handleAnalyze = async () => {
    if (!file) return toast.error("Selecione um arquivo .xlsx");
    setAnalyzing(true);
    try {
      const res = await parseIdealiFile(file);
      if (res.contracts.length === 0) {
        throw new Error('Nenhum contrato válido encontrado na aba "Contratos".');
      }
      // faturas órfãs: código não está na planilha nem no banco
      const codigosPlanilha = new Set(res.contracts.map((c) => c.codigo_contrato));
      const faltantes = Array.from(
        new Set(res.invoices.map((i) => i.codigo_contrato).filter((c) => !codigosPlanilha.has(c)))
      );
      const existentes = new Set<string>();
      for (const part of chunk(faltantes, 300)) {
        const { data } = await supabase
          .from("ideali_contracts")
          .select("codigo_contrato")
          .in("codigo_contrato", part);
        (data ?? []).forEach((r: any) => existentes.add(r.codigo_contrato));
      }
      const orfas = res.invoices.filter(
        (i) => !codigosPlanilha.has(i.codigo_contrato) && !existentes.has(i.codigo_contrato)
      );
      const orfasSet = new Set(orfas.map((o) => o.id_fatura_origem));
      const invoices = res.invoices.filter((i) => !orfasSet.has(i.id_fatura_origem));
      setParsed({
        ...res,
        invoices,
        faturasOrfas: orfas.length,
        faturasIncompletas: invoices.filter((i) => i.dado_incompleto).length,
      });
    } catch (e: any) {
      toast.error(e?.message ?? "Falha ao ler a planilha");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleConfirm = async () => {
    if (!parsed) return;
    setSaving(true);
    const errors: string[] = [];
    let contratos = 0;
    let faturas = 0;
    try {
      const cParts = chunk(parsed.contracts, CHUNK);
      for (let i = 0; i < cParts.length; i++) {
        setProgress(`Gravando contratos ${i + 1}/${cParts.length}...`);
        const { error } = await supabase
          .from("ideali_contracts")
          .upsert(cParts[i] as any, { onConflict: "codigo_contrato" });
        if (error) errors.push(`Contratos (lote ${i + 1}): ${error.message}`);
        else contratos += cParts[i].length;
      }

      const fParts = chunk(parsed.invoices, CHUNK);
      for (let i = 0; i < fParts.length; i++) {
        setProgress(`Gravando faturas ${i + 1}/${fParts.length}...`);
        const { error } = await supabase
          .from("ideali_invoices")
          .upsert(fParts[i] as any, { onConflict: "id_fatura_origem" });
        if (error) errors.push(`Faturas (lote ${i + 1}): ${error.message}`);
        else faturas += fParts[i].length;
      }

      setResult({
        contratos,
        faturas,
        incompletas: parsed.invoices.filter((i) => i.dado_incompleto).length,
        errors,
      });
      if (errors.length) toast.error(`Importação concluída com ${errors.length} erro(s)`);
      else toast.success(`${contratos} contrato(s) e ${faturas} fatura(s) gravados`);
    } catch (e: any) {
      toast.error(e?.message ?? "Falha na importação");
    } finally {
      setSaving(false);
      setProgress("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(v) : handleClose())}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Importar carteira Ideali</DialogTitle>
        </DialogHeader>

        {result ? (
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2 text-[#27AE60] font-medium">
              <CheckCircle2 className="h-5 w-5" />
              Importação concluída
            </div>
            <Row label="Contratos gravados" value={result.contratos} highlight="green" />
            <Row label="Faturas gravadas" value={result.faturas} highlight="green" />
            <Row label="Faturas com dado incompleto" value={result.incompletas} />
            {result.errors.length > 0 && (
              <details className="text-xs text-destructive">
                <summary className="cursor-pointer">{result.errors.length} erro(s)</summary>
                <ul className="mt-1 max-h-32 overflow-auto space-y-1">
                  {result.errors.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </details>
            )}
            <DialogFooter>
              <Button onClick={handleClose}>Fechar</Button>
            </DialogFooter>
          </div>
        ) : parsed ? (
          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              Confira os números abaixo antes de gravar no banco.
            </p>
            <Row label="Contratos únicos identificados" value={parsed.contracts.length} highlight="green" />
            <Row
              label="Contratos com linhas de fiador/cotitular deduplicadas"
              value={parsed.contratosDedupGroups}
            />
            <Row label="Faturas únicas identificadas" value={parsed.invoices.length} highlight="green" />
            <Row label="Faturas com dado incompleto" value={parsed.faturasIncompletas} />
            {parsed.contratosIgnoradas > 0 && (
              <Row label="Linhas ignoradas (sem código de contrato)" value={parsed.contratosIgnoradas} />
            )}
            {parsed.faturasIgnoradas > 0 && (
              <Row label="Linhas de fatura ignoradas (dados obrigatórios ausentes)" value={parsed.faturasIgnoradas} />
            )}
            {parsed.faturasOrfas > 0 && (
              <Row
                label="Faturas ignoradas (contrato inexistente)"
                value={parsed.faturasOrfas}
                highlight="red"
              />
            )}
            {saving && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {progress || "Gravando..."}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setParsed(null)} disabled={saving}>
                Voltar
              </Button>
              <Button onClick={handleConfirm} disabled={saving}>
                Confirmar importação
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label className="mb-1.5 block">Arquivo (.xlsx) *</Label>
              <Input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                disabled={analyzing}
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                O arquivo deve conter as abas "Contratos" e "Histórico faturas".
              </p>
            </div>
            {analyzing && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Lendo planilha...
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={handleClose} disabled={analyzing}>
                Cancelar
              </Button>
              <Button onClick={handleAnalyze} disabled={analyzing || !file}>
                <Upload className="h-4 w-4 mr-1" />
                Analisar planilha
              </Button>
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
    <div className="flex justify-between items-center border-b pb-2 gap-4">
      <span>{label}</span>
      <span className={`font-semibold shrink-0 ${color}`}>{value}</span>
    </div>
  );
}

export default ImportIdealiModal;
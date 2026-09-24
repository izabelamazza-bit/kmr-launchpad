import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Loader2, Upload, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useEnvironment } from "@/contexts/EnvironmentContext";
import {
  parseCobmaisXlsx,
  importCobmaisXlsx,
  COBMAIS_FORMATS,
  COBMAIS_SHEET,
  GARANTIDORAS_RASTREADAS,
  EMPRESAS_COBMAIS,
  type CobmaisParseResult,
  type ImportCobmaisResult,
} from "../lib/cobmaisXlsxImport";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onDone?: () => void;
}

function outrosTotal(porGarantidora: Record<string, number>) {
  return Object.entries(porGarantidora)
    .filter(([g]) => !GARANTIDORAS_RASTREADAS.includes(g as (typeof GARANTIDORAS_RASTREADAS)[number]))
    .reduce((acc, [, n]) => acc + n, 0);
}

export function ImportCobmaisModal({ open, onOpenChange, onDone }: Props) {
  const { environment } = useEnvironment();
  const sugestao = (EMPRESAS_COBMAIS as readonly string[]).includes(environment) ? environment : "";
  const [empresa, setEmpresa] = useState<string>(sugestao);
  useEffect(() => {
    if (open) setEmpresa(sugestao);
  }, [open, sugestao]);
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<CobmaisParseResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState<ImportCobmaisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const reset = () => {
    setFile(null);
    setParsed(null);
    setAnalyzing(false);
    setSaving(false);
    setDone(null);
    setError(null);
    setProgress(0);
  };

  const handleClose = () => {
    if (saving) return;
    onOpenChange(false);
    if (done) onDone?.();
    setTimeout(reset, 300);
  };

  const handleAnalyze = async () => {
    if (!empresa) return toast.error("Selecione a empresa do relatório");
    if (!file) return toast.error("Selecione um arquivo .xlsx");
    setAnalyzing(true);
    setError(null);
    try {
      const res = await parseCobmaisXlsx(file);
      if (res.rows.length === 0)
        throw new Error(`Nenhuma linha válida encontrada na aba "${COBMAIS_SHEET}".`);
      setParsed(res);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Falha ao ler o arquivo Excel.";
      setError(msg);
      toast.error(msg);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleConfirm = async () => {
    if (!file || !parsed || !empresa) return;
    setSaving(true);
    setError(null);
    setProgress(0);
    try {
      const res = await importCobmaisXlsx(file, parsed, empresa, (ins, total) =>
        setProgress(Math.round((ins / total) * 100)),
      );
      setDone(res);
      toast.success(`${res.inseridos} registro(s) importados do Cobmais`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Falha na importação.";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const resumo = done ?? parsed;

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(v) : handleClose())}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Importar relatório Cobmais</DialogTitle>
        </DialogHeader>

        {done ? (
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2 text-[#27AE60] font-medium">
              <CheckCircle2 className="h-5 w-5" />
              Importação concluída
            </div>
            <EmpresaRow empresa={empresa} />
            <Row label="Linhas na aba Cobrança" value={done.totalLinhas} />
            <Row label="Registros importados" value={done.inseridos} highlight="green" />
            {done.ignoradas > 0 && (
              <Row label="Linhas ignoradas (sem CPF/CNPJ)" value={done.ignoradas} highlight="red" />
            )}
            <Garantidoras porGarantidora={done.porGarantidora} />
            <DialogFooter>
              <Button onClick={handleClose}>Fechar</Button>
            </DialogFooter>
          </div>
        ) : parsed ? (
          <div className="space-y-4 text-sm">
            <p className="text-muted-foreground">
              Aba e cabeçalho validados. Confira os números antes de gravar no banco.
            </p>
            <EmpresaRow empresa={empresa} />
            {empresa !== environment && <AvisoEmpresa empresa={empresa} ativa={environment} />}
            <Row label="Linhas na aba Cobrança" value={parsed.totalLinhas} />
            <Row label="Registros a importar" value={parsed.rows.length} highlight="green" />
            {parsed.ignoradas > 0 && (
              <Row label="Linhas ignoradas (sem CPF/CNPJ)" value={parsed.ignoradas} highlight="red" />
            )}
            {resumo && <Garantidoras porGarantidora={resumo.porGarantidora} />}

            {saving && (
              <div className="space-y-2">
                <Progress value={progress} />
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Gravando registros... {progress}%
                </div>
              </div>
            )}

            {error && <ErrorBox message={error} />}

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
              <Label className="mb-1.5 block">Empresa do relatório *</Label>
              <Select value={empresa} onValueChange={setEmpresa} disabled={analyzing}>
                <SelectTrigger aria-label="Empresa do relatório">
                  <SelectValue placeholder="Selecione a empresa" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {EMPRESAS_COBMAIS.map((e) => (
                    <SelectItem key={e} value={e}>{e}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1.5">
                Sugerido pela empresa ativa. Confira antes de enviar.
              </p>
              {empresa && empresa !== environment && (
                <div className="mt-2"><AvisoEmpresa empresa={empresa} ativa={environment} /></div>
              )}
            </div>
            <div>
              <Label className="mb-1.5 block">Arquivo (.xlsx) *</Label>
              <Input
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={(e) => {
                  setFile(e.target.files?.[0] ?? null);
                  setError(null);
                }}
                disabled={analyzing}
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                O arquivo deve conter a aba <span className="font-mono">{COBMAIS_SHEET}</span> com{" "}
                {COBMAIS_FORMATS.map((f) => `${f.headers.length}`).join(" ou ")} colunas do relatório
                Cobmais, começando por <span className="font-mono">CPF/CNPJ</span>. As outras abas
                são ignoradas.
              </p>

            </div>

            {analyzing && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Lendo arquivo...
              </div>
            )}

            {error && <ErrorBox message={error} />}

            <DialogFooter>
              <Button variant="outline" onClick={handleClose} disabled={analyzing}>
                Cancelar
              </Button>
              <Button onClick={handleAnalyze} disabled={analyzing || !file || !empresa}>
                <Upload className="h-4 w-4 mr-1" />
                Analisar arquivo
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Garantidoras({ porGarantidora }: { porGarantidora: Record<string, number> }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Garantidoras identificadas
      </p>
      {GARANTIDORAS_RASTREADAS.map((g) => (
        <Row key={g} label={g} value={porGarantidora[g] ?? 0} />
      ))}
      <Row label="Outros produtos (não rastreados)" value={outrosTotal(porGarantidora)} />
    </div>
  );
}

function EmpresaRow({ empresa }: { empresa: string }) {
  return (
    <div className="flex justify-between items-center rounded-md bg-primary/5 border border-primary/20 px-3 py-2 gap-4">
      <span>Empresa</span>
      <span className="font-semibold text-primary">{empresa}</span>
    </div>
  );
}

function AvisoEmpresa({ empresa, ativa }: { empresa: string; ativa: string }) {
  return (
    <div className="flex gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-2.5 text-xs">
      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
      <span>
        Este arquivo será gravado na {empresa}. Você está vendo a {ativa} — troque a empresa no
        topo para ver o resultado.
      </span>
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="flex gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive">
      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: number; highlight?: "green" | "red" }) {
  const color = highlight === "green" ? "text-[#27AE60]" : highlight === "red" ? "text-destructive" : "";
  return (
    <div className="flex justify-between items-center border-b pb-2 gap-4">
      <span>{label}</span>
      <span className={`font-semibold shrink-0 ${color}`}>{value}</span>
    </div>
  );
}

export default ImportCobmaisModal;
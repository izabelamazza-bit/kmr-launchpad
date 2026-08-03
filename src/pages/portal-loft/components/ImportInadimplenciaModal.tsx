import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Loader2, Upload, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
  parseInadimplenciaCsv,
  importInadimplenciaCsv,
  INADIMPLENCIA_CSV_HEADERS,
  type InadimplenciaParseResult,
  type ImportInadimplenciaResult,
} from "../lib/inadimplenciaCsvImport";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onDone?: () => void;
}

export function ImportInadimplenciaModal({ open, onOpenChange, onDone }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<InadimplenciaParseResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState<ImportInadimplenciaResult | null>(null);
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
    if (!file) return toast.error("Selecione um arquivo .csv");
    setAnalyzing(true);
    setError(null);
    try {
      const res = await parseInadimplenciaCsv(file);
      if (res.rows.length === 0) throw new Error("Nenhuma linha válida encontrada no CSV.");
      setParsed(res);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Falha ao ler o arquivo CSV.";
      setError(msg);
      toast.error(msg);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleConfirm = async () => {
    if (!file || !parsed) return;
    setSaving(true);
    setError(null);
    setProgress(0);
    try {
      const res = await importInadimplenciaCsv(file, parsed, (feitos, total) =>
        setProgress(Math.round((feitos / total) * 100)),
      );
      setDone(res);
      toast.success(`${res.processados} pendência(s) processada(s)`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Falha na importação.";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(v) : handleClose())}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Importar inadimplência do Portal Loft</DialogTitle>
        </DialogHeader>

        {done ? (
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2 text-[#27AE60] font-medium">
              <CheckCircle2 className="h-5 w-5" />
              Importação concluída
            </div>
            <Row label="Total processado" value={done.processados} />
            <Row label="Novos" value={done.novos} highlight="green" />
            <Row label="Atualizados" value={done.atualizados} />
            {done.ignoradas > 0 && (
              <Row label="Ignoradas (sem contrato ou sem id)" value={done.ignoradas} highlight="red" />
            )}
            {done.jsonInvalido > 0 && (
              <Row label="Detalhes com JSON inválido" value={done.jsonInvalido} highlight="red" />
            )}
            <DialogFooter>
              <Button onClick={handleClose}>Fechar</Button>
            </DialogFooter>
          </div>
        ) : parsed ? (
          <div className="space-y-4 text-sm">
            <p className="text-muted-foreground">
              Cabeçalho validado. Pendências já existentes serão atualizadas, não duplicadas.
            </p>
            <Row label="Linhas no arquivo" value={parsed.totalLinhas} />
            <Row label="Pendências a gravar" value={parsed.rows.length} highlight="green" />
            {parsed.ignoradas > 0 && (
              <Row label="Ignoradas (sem contrato ou sem id)" value={parsed.ignoradas} highlight="red" />
            )}
            {parsed.jsonInvalido > 0 && (
              <Row label="Detalhes com JSON inválido" value={parsed.jsonInvalido} highlight="red" />
            )}

            {saving && (
              <div className="space-y-2">
                <Progress value={progress} />
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Gravando pendências... {progress}%
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
              <Label className="mb-1.5 block">Arquivo (.csv) *</Label>
              <Input
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => {
                  setFile(e.target.files?.[0] ?? null);
                  setError(null);
                }}
                disabled={analyzing}
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                O arquivo deve conter exatamente as {INADIMPLENCIA_CSV_HEADERS.length} colunas do
                relatório de inadimplência, começando por <span className="font-mono">contrato</span>.
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
              <Button onClick={handleAnalyze} disabled={analyzing || !file}>
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

export default ImportInadimplenciaModal;

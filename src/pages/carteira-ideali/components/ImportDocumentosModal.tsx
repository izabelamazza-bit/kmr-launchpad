import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { parseDocumentosFile, DRIVE_STATUS, type DocumentosParseResult } from "../lib/documentosImport";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onDone?: () => void;
}

interface Result {
  documentos: number;
  filaInseridas: number;
  filaAtualizadas: number;
  errors: string[];
}

const CHUNK = 500;

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export function ImportDocumentosModal({ open, onOpenChange, onDone }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState("");
  const [parsed, setParsed] = useState<DocumentosParseResult | null>(null);
  const [semContrato, setSemContrato] = useState<number>(0);
  const [result, setResult] = useState<Result | null>(null);

  const reset = () => {
    setFile(null);
    setParsed(null);
    setResult(null);
    setSemContrato(0);
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
      const res = await parseDocumentosFile(file);
      if (res.documentos.length === 0) {
        throw new Error('Nenhuma linha válida encontrada na aba "Cruzamento Completo".');
      }
      const codigos = res.documentos.map((d) => d.codigo_contrato);
      const existentes = new Set<string>();
      for (const part of chunk(codigos, 300)) {
        const { data } = await supabase
          .from("ideali_contracts")
          .select("codigo_contrato")
          .in("codigo_contrato", part);
        (data ?? []).forEach((r: { codigo_contrato: string }) => existentes.add(r.codigo_contrato));
      }
      setSemContrato(codigos.filter((c) => !existentes.has(c)).length);
      setParsed(res);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao ler a planilha");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleConfirm = async () => {
    if (!parsed) return;
    setSaving(true);
    const errors: string[] = [];
    let documentos = 0;
    let filaInseridas = 0;
    let filaAtualizadas = 0;
    try {
      const dParts = chunk(parsed.documentos, CHUNK);
      for (let i = 0; i < dParts.length; i++) {
        setProgress(`Gravando documentos ${i + 1}/${dParts.length}...`);
        const { error } = await supabase
          .from("ideali_documentos")
          .upsert(dParts[i], { onConflict: "codigo_contrato" });
        if (error) errors.push(`Documentos (lote ${i + 1}): ${error.message}`);
        else documentos += dParts[i].length;
      }

      // Fila: preserva o trabalho manual do analista.
      setProgress("Verificando fila existente...");
      const jaExiste = new Set<string>();
      for (const part of chunk(parsed.fila.map((f) => f.codigo_contrato), 300)) {
        const { data } = await supabase
          .from("ideali_fila_analista")
          .select("codigo_contrato")
          .in("codigo_contrato", part);
        (data ?? []).forEach((r: { codigo_contrato: string }) => jaExiste.add(r.codigo_contrato));
      }

      const novas = parsed.fila.filter((f) => !jaExiste.has(f.codigo_contrato));
      const antigas = parsed.fila.filter((f) => jaExiste.has(f.codigo_contrato));

      const nParts = chunk(novas, CHUNK);
      for (let i = 0; i < nParts.length; i++) {
        setProgress(`Inserindo novos itens da fila ${i + 1}/${nParts.length}...`);
        const { error } = await supabase.from("ideali_fila_analista").insert(nParts[i]);
        if (error) errors.push(`Fila - novos (lote ${i + 1}): ${error.message}`);
        else filaInseridas += nParts[i].length;
      }

      for (let i = 0; i < antigas.length; i++) {
        if (i % 20 === 0) setProgress(`Atualizando fila existente ${i + 1}/${antigas.length}...`);
        // Só status do Drive e ordem — dados manuais nunca são sobrescritos.
        const { error } = await supabase
          .from("ideali_fila_analista")
          .update({
            status_documento_drive: antigas[i].status_documento_drive,
            ordem: antigas[i].ordem,
          })
          .eq("codigo_contrato", antigas[i].codigo_contrato);
        if (error) errors.push(`Fila - ${antigas[i].codigo_contrato}: ${error.message}`);
        else filaAtualizadas += 1;
      }

      setResult({ documentos, filaInseridas, filaAtualizadas, errors });
      if (errors.length) toast.error(`Importação concluída com ${errors.length} erro(s)`);
      else toast.success(`${documentos} documento(s) gravados`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha na importação");
    } finally {
      setSaving(false);
      setProgress("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(v) : handleClose())}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Importar auditoria de documentos</DialogTitle>
        </DialogHeader>

        {result ? (
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2 text-[#27AE60] font-medium">
              <CheckCircle2 className="h-5 w-5" />
              Importação concluída
            </div>
            <Row label="Documentos gravados" value={result.documentos} highlight="green" />
            <Row label="Itens novos na fila" value={result.filaInseridas} highlight="green" />
            <Row label="Itens da fila atualizados (apenas status do Drive)" value={result.filaAtualizadas} />
            <p className="text-xs text-muted-foreground">
              Em itens que já existiam na fila, apenas o status do Drive e a ordem foram atualizados.
              Verificações e observações preenchidas pelo analista foram preservadas.
            </p>
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
            <p className="text-muted-foreground">Confira os números abaixo antes de gravar no banco.</p>
            <Row label="Contratos na aba Cruzamento Completo" value={parsed.documentos.length} highlight="green" />
            {DRIVE_STATUS.map((s) => (
              <Row key={s} label={s} value={parsed.porStatus[s] ?? 0} />
            ))}
            <Row label="Itens na Fila do Analista" value={parsed.fila.length} highlight="green" />
            {parsed.documentosIgnorados > 0 && (
              <Row label="Linhas ignoradas (sem código de contrato)" value={parsed.documentosIgnorados} />
            )}
            {parsed.filaIgnorada > 0 && (
              <Row label="Linhas da fila ignoradas" value={parsed.filaIgnorada} />
            )}
            {semContrato > 0 && (
              <Row label="Códigos sem contrato correspondente na carteira" value={semContrato} highlight="red" />
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
                O arquivo deve conter as abas "Cruzamento Completo" e "Fila do Analista".
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

function Row({ label, value, highlight }: { label: string; value: number; highlight?: "green" | "red" }) {
  const color = highlight === "green" ? "text-[#27AE60]" : highlight === "red" ? "text-destructive" : "";
  return (
    <div className="flex justify-between items-center border-b pb-2 gap-4">
      <span>{label}</span>
      <span className={`font-semibold shrink-0 ${color}`}>{value}</span>
    </div>
  );
}

export default ImportDocumentosModal;
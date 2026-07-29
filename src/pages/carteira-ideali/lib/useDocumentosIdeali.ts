import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { DriveStatus, StatusFila } from "./documentosImport";

export interface DocumentoRecord {
  id: string;
  codigo_contrato: string;
  inquilino: string | null;
  endereco: string | null;
  status_contrato: string | null;
  garantidora: string | null;
  prioritario: boolean;
  contrato_locacao: boolean;
  apolice_garantia: boolean;
  status_documento_drive: DriveStatus;
  pasta_encontrada_drive: boolean;
  tem_doc_garantia_drive: boolean;
  n_arquivos_drive: number;
  nome_pasta_drive: string | null;
}

export interface FilaRecord {
  id: string;
  codigo_contrato: string;
  inquilino: string | null;
  endereco: string | null;
  status_contrato: string | null;
  garantidora: string | null;
  status_documento_drive: DriveStatus;
  localizacao_documento: string;
  status_loft_seguradora: string;
  clausula_garantidora_presente: string;
  nome_inquilino_confere: string;
  endereco_confere: string;
  observacoes: string | null;
  status_fila: StatusFila;
  resolvido_em: string | null;
  ordem: number;
}

const PAGE = 1000;

async function fetchAll<T>(
  table: "ideali_documentos" | "ideali_fila_analista",
  columns: string,
  order: string[]
): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += PAGE) {
    let q = supabase.from(table).select(columns).range(from, from + PAGE - 1);
    for (const col of order) q = q.order(col);
    const { data, error } = await q;
    if (error) throw error;
    const rows = (data ?? []) as unknown as T[];
    out.push(...rows);
    if (rows.length < PAGE) break;
  }
  return out;
}

export function useDocumentosIdeali() {
  const [documentos, setDocumentos] = useState<DocumentoRecord[]>([]);
  const [fila, setFila] = useState<FilaRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [docs, queue] = await Promise.all([
        fetchAll<DocumentoRecord>(
          "ideali_documentos",
          "id, codigo_contrato, inquilino, endereco, status_contrato, garantidora, prioritario, contrato_locacao, apolice_garantia, status_documento_drive, pasta_encontrada_drive, tem_doc_garantia_drive, n_arquivos_drive, nome_pasta_drive",
          ["codigo_contrato"]
        ),
        fetchAll<FilaRecord>(
          "ideali_fila_analista",
          "id, codigo_contrato, inquilino, endereco, status_contrato, garantidora, status_documento_drive, localizacao_documento, status_loft_seguradora, clausula_garantidora_presente, nome_inquilino_confere, endereco_confere, observacoes, status_fila, resolvido_em, ordem",
          ["ordem", "codigo_contrato"]
        ),
      ]);
      setDocumentos(docs);
      setFila(queue);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao carregar documentos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { documentos, fila, loading, error, reload: load, setFila };
}
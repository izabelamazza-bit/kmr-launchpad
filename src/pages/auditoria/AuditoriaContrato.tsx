import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, LogOut, Upload, Loader2, RefreshCw, Check } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { CurrencyInput } from "@/components/sinistros/CurrencyInput";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { GarantidoraBadge } from "./components/GarantidoraBadge";
import { AlertasExtracao } from "./components/AlertasExtracao";
import { ChecklistItem, ChecklistRow } from "./components/ChecklistItem";
import logoKMR from "@/assets/Logo_KMR.png";

interface Contract {
  id: string;
  imoview_number: string;
  garantidora: string | null;
  ocupacao: string | null;
  status_contrato: string | null;
  analyst_id: string | null;
  analyst_name: string | null;
  general_notes: string | null;
  audit_status: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

interface Extracted {
  id: string;
  contract_id: string;
  locadores: string | null;
  locatarios: string | null;
  cpf_locatarios: string | null;
  endereco_imovel: string | null;
  data_inicio: string | null;
  data_termino: string | null;
  prazo_meses: number | null;
  valor_aluguel: number | null;
  indice_reajuste: string | null;
  dia_vencimento: number | null;
  garantidora_identificada_raw: string | null;
  garantidora_normalizada: string | null;
  clausula_garantia_trecho: string | null;
  assinatura_digital: boolean | null;
  observacoes_extracao: string | null;
  pdf_url: string | null;
  extracted_at: string;
}

const garantidoraOptions = [
  { value: "Loft", label: "Loft" },
  { value: "Credaluga", label: "Credaluga" },
  { value: "KMR", label: "KMR" },
];
const ocupacaoOptions = [
  { value: "Ocupado", label: "Ocupado" },
  { value: "Desocupado", label: "Desocupado" },
];
const statusContratoOptions = [
  { value: "Saudavel", label: "Saudável" },
  { value: "Inadimplente", label: "Inadimplente" },
];

const AuditoriaContrato = () => {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === "novo";
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isSupervisorOrAdmin } = useUserRole();

  const [contract, setContract] = useState<Contract | null>(null);
  const [extracted, setExtracted] = useState<Extracted | null>(null);
  const [checklist, setChecklist] = useState<ChecklistRow[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [savedHint, setSavedHint] = useState(false);
  const [analistas, setAnalistas] = useState<{ value: string; label: string }[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [savingAll, setSavingAll] = useState(false);
  const [confirmLeaveOpen, setConfirmLeaveOpen] = useState(false);

  // form (Section A)
  const [form, setForm] = useState({
    imoview_number: "",
    garantidora: "",
    ocupacao: "",
    status_contrato: "",
    analyst_id: "",
    general_notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Section B editable extracted fields
  const [ex, setEx] = useState({
    locadores: "",
    locatarios: "",
    cpf_locatarios: "",
    endereco_imovel: "",
    data_inicio: "",
    data_termino: "",
    prazo_meses: 0,
    valor_aluguel: 0,
    indice_reajuste: "",
    dia_vencimento: 0,
  });

  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/login");
    });
  }, [navigate]);

  useEffect(() => {
    const loadAnalistas = async () => {
      const { data } = await supabase
        .from("users_registry")
        .select("id, full_name, email")
        .eq("status", "ativo");
      setAnalistas(
        (data ?? []).map((u: any) => ({
          value: u.id,
          label: u.full_name || u.email,
        }))
      );
    };
    loadAnalistas();
  }, []);

  const load = async () => {
    if (isNew) return;
    setLoading(true);
    const [{ data: c }, { data: e }, { data: items }] = await Promise.all([
      supabase.from("audit_contracts").select("*").eq("id", id!).maybeSingle(),
      supabase.from("audit_contract_extracted_data").select("*").eq("contract_id", id!).maybeSingle(),
      supabase.from("audit_checklist_items").select("*").eq("contract_id", id!).order("item_number"),
    ]);
    if (c) {
      setContract(c as Contract);
      setForm({
        imoview_number: c.imoview_number,
        garantidora: c.garantidora ?? "",
        ocupacao: c.ocupacao ?? "",
        status_contrato: c.status_contrato ?? "",
        analyst_id: c.analyst_id ?? "",
        general_notes: c.general_notes ?? "",
      });
    }
    if (e) {
      setExtracted(e as Extracted);
      setEx({
        locadores: e.locadores ?? "",
        locatarios: e.locatarios ?? "",
        cpf_locatarios: e.cpf_locatarios ?? "",
        endereco_imovel: e.endereco_imovel ?? "",
        data_inicio: e.data_inicio ?? "",
        data_termino: e.data_termino ?? "",
        prazo_meses: e.prazo_meses ?? 0,
        valor_aluguel: Number(e.valor_aluguel ?? 0),
        indice_reajuste: e.indice_reajuste ?? "",
        dia_vencimento: e.dia_vencimento ?? 0,
      });
    }
    setChecklist((items ?? []) as ChecklistRow[]);
    setLoading(false);
    setIsDirty(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  const flashSaved = () => {
    setSavedHint(true);
    setTimeout(() => setSavedHint(false), 1500);
  };

  const validateA = () => {
    const e: Record<string, string> = {};
    if (!form.imoview_number.trim()) e.imoview_number = "Informe o número do Imoview.";
    if (!form.garantidora) e.garantidora = "Selecione a garantidora.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const saveSectionA = async () => {
    if (!validateA()) return;
    setSaving(true);
    const analyst = analistas.find((a) => a.value === form.analyst_id);
    const payload: any = {
      imoview_number: form.imoview_number.trim(),
      garantidora: form.garantidora || null,
      ocupacao: form.ocupacao || null,
      status_contrato: form.status_contrato || null,
      analyst_id: form.analyst_id || null,
      analyst_name: analyst?.label ?? null,
      general_notes: form.general_notes.trim() || null,
    };

    if (isNew) {
      // unique check
      const { data: existing } = await supabase
        .from("audit_contracts")
        .select("id")
        .eq("imoview_number", payload.imoview_number)
        .limit(1);
      if (existing && existing.length) {
        setErrors((p) => ({ ...p, imoview_number: "Já existe um contrato com este número." }));
        setSaving(false);
        return;
      }
      const { data: userRes } = await supabase.auth.getUser();
      payload.created_by = userRes.user?.id;
      if (!payload.analyst_id) {
        payload.analyst_id = userRes.user?.id;
        payload.analyst_name = userRes.user?.email ?? null;
      }
      const { data: created, error } = await supabase
        .from("audit_contracts")
        .insert(payload)
        .select()
        .single();
      setSaving(false);
      if (error || !created) {
        toast({ variant: "destructive", title: "Erro ao criar contrato", description: error?.message });
        return;
      }
      toast({ title: "Contrato criado." });
      navigate(`/auditoria/${created.id}`, { replace: true });
      return;
    }

    const { error } = await supabase.from("audit_contracts").update(payload).eq("id", id!);
    setSaving(false);
    if (error) {
      toast({ variant: "destructive", title: "Erro ao salvar", description: error.message });
      return;
    }
    toast({ title: "Dados salvos." });
    load();
  };

  const handleUpload = async (file: File) => {
    if (!contract) return;
    if (file.type !== "application/pdf") {
      toast({ variant: "destructive", title: "Envie um arquivo PDF." });
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast({ variant: "destructive", title: "Arquivo maior que 20MB." });
      return;
    }
    setUploading(true);
    const path = `${contract.id}/${Date.now()}_${file.name}`;
    const { error: upErr } = await supabase.storage
      .from("audit-contracts")
      .upload(path, file, { upsert: true, contentType: "application/pdf" });
    setUploading(false);
    if (upErr) {
      toast({ variant: "destructive", title: "Erro no upload", description: upErr.message });
      return;
    }
    await runExtraction(path);
  };

  const runExtraction = async (pdfPath?: string) => {
    if (!contract) return;
    setExtracting(true);
    const { data: sess } = await supabase.auth.getSession();
    const token = sess.session?.access_token;
    try {
      const { data, error } = await supabase.functions.invoke("extract-contract", {
        body: { contractId: contract.id, pdfPath: pdfPath ?? extracted?.pdf_url ?? "" },
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (error) throw error;
      toast({ title: "Extração concluída." });
      await load();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erro na extração", description: err?.message ?? String(err) });
    } finally {
      setExtracting(false);
    }
  };

  const saveExtractedField = async (patch: Partial<Extracted>) => {
    if (!extracted) return;
    const { error } = await supabase
      .from("audit_contract_extracted_data")
      .update(patch)
      .eq("id", extracted.id);
    if (!error) flashSaved();
  };

  // debounce extracted fields
  const exDebounce = useRef<number | null>(null);
  const exInit = useRef(true);
  useEffect(() => {
    if (!extracted) return;
    if (exInit.current) {
      exInit.current = false;
      return;
    }
    setIsDirty(true);
    if (exDebounce.current) window.clearTimeout(exDebounce.current);
    exDebounce.current = window.setTimeout(() => {
      saveExtractedField({
        locadores: ex.locadores,
        locatarios: ex.locatarios,
        cpf_locatarios: ex.cpf_locatarios,
        endereco_imovel: ex.endereco_imovel,
        data_inicio: ex.data_inicio || null,
        data_termino: ex.data_termino || null,
        prazo_meses: ex.prazo_meses || null,
        valor_aluguel: ex.valor_aluguel || null,
        indice_reajuste: ex.indice_reajuste,
        dia_vencimento: ex.dia_vencimento || null,
      });
      setIsDirty(false);
    }, 700);
    return () => {
      if (exDebounce.current) window.clearTimeout(exDebounce.current);
    };
    // eslint-disable-next-line
  }, [ex]);

  useEffect(() => {
    exInit.current = true;
  }, [extracted?.id]);

  const formInit = useRef(true);
  useEffect(() => {
    if (formInit.current) {
      formInit.current = false;
      return;
    }
    setIsDirty(true);
  }, [form]);

  const flushExtracted = async () => {
    if (!extracted) return;
    if (exDebounce.current) {
      window.clearTimeout(exDebounce.current);
      exDebounce.current = null;
    }
    await supabase
      .from("audit_contract_extracted_data")
      .update({
        locadores: ex.locadores,
        locatarios: ex.locatarios,
        cpf_locatarios: ex.cpf_locatarios,
        endereco_imovel: ex.endereco_imovel,
        data_inicio: ex.data_inicio || null,
        data_termino: ex.data_termino || null,
        prazo_meses: ex.prazo_meses || null,
        valor_aluguel: ex.valor_aluguel || null,
        indice_reajuste: ex.indice_reajuste,
        dia_vencimento: ex.dia_vencimento || null,
      })
      .eq("id", extracted.id);
  };

  const handleSaveAndBack = async () => {
    if (!validateA()) return;
    setSavingAll(true);
    const analyst = analistas.find((a) => a.value === form.analyst_id);
    const payload: any = {
      imoview_number: form.imoview_number.trim(),
      garantidora: form.garantidora || null,
      ocupacao: form.ocupacao || null,
      status_contrato: form.status_contrato || null,
      analyst_id: form.analyst_id || null,
      analyst_name: analyst?.label ?? null,
      general_notes: form.general_notes.trim() || null,
    };

    if (isNew) {
      const { data: existing } = await supabase
        .from("audit_contracts")
        .select("id")
        .eq("imoview_number", payload.imoview_number)
        .limit(1);
      if (existing && existing.length) {
        setErrors((p) => ({ ...p, imoview_number: "Já existe um contrato com este número." }));
        setSavingAll(false);
        return;
      }
      const { data: userRes } = await supabase.auth.getUser();
      payload.created_by = userRes.user?.id;
      if (!payload.analyst_id) {
        payload.analyst_id = userRes.user?.id;
        payload.analyst_name = userRes.user?.email ?? null;
      }
      const { error } = await supabase.from("audit_contracts").insert(payload).select().single();
      setSavingAll(false);
      if (error) {
        toast({ variant: "destructive", title: "Erro ao salvar", description: error.message });
        return;
      }
      setIsDirty(false);
      toast({ title: "Contrato salvo com sucesso!" });
      navigate("/auditoria");
      return;
    }

    const { error } = await supabase.from("audit_contracts").update(payload).eq("id", id!);
    if (error) {
      setSavingAll(false);
      toast({ variant: "destructive", title: "Erro ao salvar", description: error.message });
      return;
    }
    await flushExtracted();
    setSavingAll(false);
    setIsDirty(false);
    toast({ title: "Contrato salvo com sucesso!" });
    navigate("/auditoria");
  };

  const handleBackClick = () => {
    if (isDirty) {
      setConfirmLeaveOpen(true);
    } else {
      navigate("/auditoria");
    }
  };

  const updateChecklist = async (itemId: string, patch: Partial<ChecklistRow>) => {
    setChecklist((prev) => prev.map((i) => (i.id === itemId ? { ...i, ...patch } : i)));
    const { data: userRes } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("audit_checklist_items")
      .update({ ...patch, updated_by: userRes.user?.id })
      .eq("id", itemId);
    if (!error) flashSaved();
  };

  const checklistGrouped = useMemo(() => {
    const groups = new Map<string, ChecklistRow[]>();
    checklist.forEach((i) => {
      if (!groups.has(i.section)) groups.set(i.section, []);
      groups.get(i.section)!.push(i);
    });
    return Array.from(groups.entries());
  }, [checklist]);

  const totalItems = checklist.length;
  const verifiedItems = checklist.filter((i) => i.status !== "pending").length;
  const progressPct = totalItems ? Math.round((verifiedItems / totalItems) * 100) : 0;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="bg-card border-b shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/auditoria")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <img src={logoKMR} alt="KMR" className="h-8 w-auto hidden sm:block" />
          </div>
          <div className="flex items-center gap-2">
            {savedHint && (
              <span className="text-xs text-[#27AE60] flex items-center gap-1">
                <Check className="h-3 w-3" /> Salvo
              </span>
            )}
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-1" /> Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 relative">
        {extracting && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-card border rounded-lg p-6 shadow-lg flex items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="font-medium">Analisando contrato com IA...</span>
            </div>
          </div>
        )}

        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold">
            {isNew ? "Novo contrato" : `Contrato ${contract?.imoview_number ?? ""}`}
          </h1>
          {!isNew && contract && (
            <p className="text-sm text-muted-foreground mt-1">
              Status geral:{" "}
              <Badge
                className="ml-1"
                style={{
                  background:
                    contract.audit_status === "Completa"
                      ? "#27AE60"
                      : contract.audit_status === "Com pendencia"
                      ? "#EB5757"
                      : contract.audit_status === "Em andamento"
                      ? "#2F80ED"
                      : "#9CA3AF",
                  color: "#fff",
                }}
              >
                {contract.audit_status}
              </Badge>
            </p>
          )}
        </div>

        {loading ? (
          <p className="text-muted-foreground">Carregando...</p>
        ) : (
          <>
            {/* ============= SEÇÃO A ============= */}
            <Card>
              <CardHeader>
                <CardTitle>Seção A — Dados manuais</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FieldWrap label="Nº do contrato no Imoview *" error={errors.imoview_number}>
                  <Input
                    value={form.imoview_number}
                    onChange={(e) => setForm({ ...form, imoview_number: e.target.value })}
                  />
                </FieldWrap>
                <FieldWrap label="Garantidora *" error={errors.garantidora}>
                  <SearchableSelect
                    options={garantidoraOptions}
                    value={form.garantidora}
                    onChange={(v) => setForm({ ...form, garantidora: v })}
                    placeholder="Selecione..."
                  />
                </FieldWrap>
                <FieldWrap label="Situação do imóvel">
                  <SearchableSelect
                    options={ocupacaoOptions}
                    value={form.ocupacao}
                    onChange={(v) => setForm({ ...form, ocupacao: v })}
                    placeholder="Selecione..."
                  />
                </FieldWrap>
                <FieldWrap label="Status do contrato">
                  <SearchableSelect
                    options={statusContratoOptions}
                    value={form.status_contrato}
                    onChange={(v) => setForm({ ...form, status_contrato: v })}
                    placeholder="Selecione..."
                  />
                </FieldWrap>
                <div className="sm:col-span-2">
                  <FieldWrap label="Analista responsável">
                    <SearchableSelect
                      options={analistas}
                      value={form.analyst_id}
                      onChange={(v) => setForm({ ...form, analyst_id: v })}
                      placeholder={isSupervisorOrAdmin ? "Selecione um analista" : "Você"}
                      disabled={!isSupervisorOrAdmin && !isNew}
                    />
                  </FieldWrap>
                </div>
                <div className="sm:col-span-2">
                  <FieldWrap label="Observações gerais">
                    <Textarea
                      value={form.general_notes}
                      onChange={(e) => setForm({ ...form, general_notes: e.target.value })}
                      rows={3}
                    />
                  </FieldWrap>
                </div>
                <div className="sm:col-span-2 flex justify-end">
                  <Button onClick={saveSectionA} disabled={saving}>
                    {saving ? "Salvando..." : isNew ? "Criar contrato" : "Salvar dados"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {!isNew && contract && (
              <>
                {/* ============= SEÇÃO B ============= */}
                <Card>
                  <CardHeader>
                    <CardTitle>Seção B — Upload e leitura automática do contrato</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center gap-3 bg-muted/30">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground text-center">
                        Envie o PDF do contrato de locação (até 20MB)
                      </p>
                      <input
                        ref={fileRef}
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleUpload(f);
                          e.target.value = "";
                        }}
                      />
                      <div className="flex gap-2">
                        <Button
                          variant="default"
                          onClick={() => fileRef.current?.click()}
                          disabled={uploading || extracting}
                        >
                          {uploading ? "Enviando..." : "Selecionar PDF"}
                        </Button>
                        {extracted?.pdf_url && (
                          <Button
                            variant="outline"
                            onClick={() => runExtraction()}
                            disabled={extracting}
                          >
                            <RefreshCw className="h-4 w-4 mr-1" /> Reanalisar PDF
                          </Button>
                        )}
                      </div>
                    </div>

                    {extracted && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FieldWrap label="Locador(es)">
                          <Input value={ex.locadores} onChange={(e) => setEx({ ...ex, locadores: e.target.value })} />
                        </FieldWrap>
                        <FieldWrap label="Locatário(s)">
                          <Input value={ex.locatarios} onChange={(e) => setEx({ ...ex, locatarios: e.target.value })} />
                        </FieldWrap>
                        <FieldWrap label="CPF(s) do(s) locatário(s)">
                          <Input value={ex.cpf_locatarios} onChange={(e) => setEx({ ...ex, cpf_locatarios: e.target.value })} />
                        </FieldWrap>
                        <FieldWrap label="Índice de reajuste">
                          <Input value={ex.indice_reajuste} onChange={(e) => setEx({ ...ex, indice_reajuste: e.target.value })} />
                        </FieldWrap>
                        <div className="sm:col-span-2">
                          <FieldWrap label="Endereço do imóvel">
                            <Textarea
                              rows={2}
                              value={ex.endereco_imovel}
                              onChange={(e) => setEx({ ...ex, endereco_imovel: e.target.value })}
                            />
                          </FieldWrap>
                        </div>
                        <FieldWrap label="Data de início">
                          <Input type="date" value={ex.data_inicio} onChange={(e) => setEx({ ...ex, data_inicio: e.target.value })} />
                        </FieldWrap>
                        <FieldWrap label="Data de término">
                          <Input type="date" value={ex.data_termino} onChange={(e) => setEx({ ...ex, data_termino: e.target.value })} />
                        </FieldWrap>
                        <FieldWrap label="Prazo (meses)">
                          <Input
                            type="number"
                            value={ex.prazo_meses}
                            onChange={(e) => setEx({ ...ex, prazo_meses: parseInt(e.target.value) || 0 })}
                          />
                        </FieldWrap>
                        <FieldWrap label="Valor do aluguel">
                          <CurrencyInput
                            value={ex.valor_aluguel}
                            onChange={(v) => setEx({ ...ex, valor_aluguel: v })}
                          />
                        </FieldWrap>
                        <FieldWrap label="Dia de vencimento">
                          <Input
                            type="number"
                            min={1}
                            max={31}
                            value={ex.dia_vencimento}
                            onChange={(e) => setEx({ ...ex, dia_vencimento: parseInt(e.target.value) || 0 })}
                          />
                        </FieldWrap>

                        <div className="sm:col-span-2 border-t pt-4 space-y-3">
                          <div>
                            <Label className="text-xs text-muted-foreground">
                              Garantidora identificada no contrato (somente leitura)
                            </Label>
                            <p className="font-medium">{extracted.garantidora_identificada_raw ?? "—"}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">
                              Garantidora normalizada
                            </Label>
                            <div className="mt-1">
                              <GarantidoraBadge value={extracted.garantidora_normalizada} />
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">
                              Trecho da cláusula de garantia
                            </Label>
                            <p className="text-sm bg-muted p-2 rounded mt-1 whitespace-pre-wrap">
                              {extracted.clausula_garantia_trecho ?? "—"}
                            </p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Assinatura digital</Label>
                            <p className="font-medium">{extracted.assinatura_digital ? "Sim" : "Não"}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Observações da extração</Label>
                            <p className="text-sm bg-muted p-2 rounded mt-1 whitespace-pre-wrap">
                              {extracted.observacoes_extracao ?? "—"}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* ============= ALERTAS ============= */}
                <AlertasExtracao
                  garantidoraManual={form.garantidora || null}
                  extracted={extracted}
                />

                {/* ============= SEÇÃO C ============= */}
                <Card>
                  <CardHeader>
                    <CardTitle>Seção C — Checklist de auditoria</CardTitle>
                    <div className="pt-2">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span>{verifiedItems} de {totalItems} itens verificados</span>
                        <span className="text-muted-foreground">{progressPct}%</span>
                      </div>
                      <Progress value={progressPct} className="h-2" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {checklistGrouped.map(([section, items]) => (
                      <div key={section}>
                        <h3 className="text-sm font-semibold text-[#0F2A44] mb-2 uppercase tracking-wide">
                          {section}
                        </h3>
                        <div className="space-y-2">
                          {items.map((it) => (
                            <ChecklistItem key={it.id} item={it} onChange={updateChecklist} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* ============= SEÇÃO D ============= */}
                <Card>
                  <CardHeader>
                    <CardTitle>Seção D — Metadados</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <Label className="text-xs text-muted-foreground">Data do cadastro</Label>
                      <p>{format(new Date(contract.created_at), "dd/MM/yyyy HH:mm")}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Última atualização</Label>
                      <p>{format(new Date(contract.updated_at), "dd/MM/yyyy HH:mm")}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Analista responsável</Label>
                      <p>{contract.analyst_name ?? "—"}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Status geral</Label>
                      <p>
                        <Badge>{contract.audit_status}</Badge>
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
};

function FieldWrap({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

export default AuditoriaContrato;
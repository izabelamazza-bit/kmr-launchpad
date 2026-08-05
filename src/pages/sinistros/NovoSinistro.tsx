import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { CalendarIcon, Plus, Trash2, ArrowLeft, LogOut, Check, ChevronsUpDown } from "lucide-react";
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MaskedInput } from "@/components/ui/masked-input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { validateCPF } from "@/lib/validators";
import { useEnvironment } from "@/contexts/EnvironmentContext";
import logoKMR from "@/assets/Logo_KMR.png";

import FileUploadField from "@/components/sinistros/FileUploadField";
import CurrencyInput from "@/components/sinistros/CurrencyInput";
import MultiFileUploadField from "@/components/sinistros/MultiFileUploadField";

type StatusImovel = "ocupado" | "desocupado";
type EmpresaSinistro = "Rotina" | "Alugar";

interface ContaConsumo {
  descricao: string;
  data_vencimento: Date | undefined;
  valor: number;
  boleto: File | null;
}

interface ChecklistItem {
  label: string;
  checked: boolean;
  file: File | null;
}

interface ContratoOption {
  imoview_number: string;
  locatario_nome: string | null;
  locatario_cpf: string | null;
}

const CHECKLIST_OCUPADO: string[] = [
  "Boleto do aluguel vencido",
  "Condomínio (se houver)",
  "Água (se houver)",
  "Lixo (se houver)",
  "IPTU (se houver)",
  "Apólice de seguro",
];

const CHECKLIST_DESOCUPADO: string[] = [
  ...CHECKLIST_OCUPADO,
  "Laudo de vistoria de saída assinado",
  "Demonstrativo de rescisão",
  "Termo de entrega de chaves",
  "E-mail de rescisão",
  "Boletos dos débitos",
  "Dois orçamentos (se aplicável)",
];

const baseSchema = z.object({
  inquilino_nome: z.string().trim().min(3, "Informe o nome completo").max(150),
  inquilino_cpf: z.string().refine(validateCPF, "CPF inválido"),
  codigo_contrato: z.string().trim().min(1, "Informe o código do contrato").max(60),
  status_imovel: z.enum(["ocupado", "desocupado"]),
  empresa: z.enum(["Rotina", "Alugar"], { errorMap: () => ({ message: "Selecione a empresa" }) }),
});

const NovoSinistro = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { environment } = useEnvironment();

  const [loading, setLoading] = useState(false);

  // Inquilino
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [codigoContrato, setCodigoContrato] = useState("");
  const [statusImovel, setStatusImovel] = useState<StatusImovel>("ocupado");
  const [empresa, setEmpresa] = useState<EmpresaSinistro | "">(
    environment === "Rotina" || environment === "Alugar" ? environment : "",
  );
  const [contratos, setContratos] = useState<ContratoOption[]>([]);
  const [contratosLoading, setContratosLoading] = useState(false);
  const [contratoOpen, setContratoOpen] = useState(false);

  // Aluguel
  const [aluguelBoleto, setAluguelBoleto] = useState<File | null>(null);
  const [aluguelVencimento, setAluguelVencimento] = useState<Date | undefined>();
  const [aluguelValor, setAluguelValor] = useState<number>(0);

  // Consumos
  const [consumos, setConsumos] = useState<ContaConsumo[]>([]);

  // Desocupado
  const [motivoDesocupacao, setMotivoDesocupacao] = useState("");
  const [dataChaves, setDataChaves] = useState<Date | undefined>();
  const [termoChaves, setTermoChaves] = useState<File | null>(null);

  // Obras
  const [possuiObras, setPossuiObras] = useState<"sim" | "nao">("nao");
  const [orcamentosObras, setOrcamentosObras] = useState<File[]>([]);

  // Checklist
  const [checklist, setChecklist] = useState<ChecklistItem[]>(
    CHECKLIST_OCUPADO.map((l) => ({ label: l, checked: false, file: null })),
  );

  // Observações
  const [observacoes, setObservacoes] = useState("");

  useEffect(() => {
    const items = statusImovel === "ocupado" ? CHECKLIST_OCUPADO : CHECKLIST_DESOCUPADO;
    setChecklist((prev) => {
      const map = new Map(prev.map((i) => [i.label, i]));
      return items.map((label) => map.get(label) ?? { label, checked: false, file: null });
    });
  }, [statusImovel]);

  // Contratos da empresa selecionada
  useEffect(() => {
    if (!empresa) {
      setContratos([]);
      return;
    }
    let active = true;
    (async () => {
      setContratosLoading(true);
      const { data } = await supabase
        .from("audit_contracts")
        .select("imoview_number, locatario_nome, locatario_cpf")
        .eq("empresa", empresa)
        .order("imoview_number");
      if (!active) return;
      setContratos((data ?? []) as ContratoOption[]);
      setContratosLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [empresa]);

  const handleEmpresaChange = (value: EmpresaSinistro) => {
    setEmpresa(value);
    setCodigoContrato("");
  };

  const handleContratoSelect = (contrato: ContratoOption) => {
    setCodigoContrato(contrato.imoview_number);
    if (contrato.locatario_nome) setNome(contrato.locatario_nome);
    if (contrato.locatario_cpf) setCpf(contrato.locatario_cpf);
    setContratoOpen(false);
  };

  // Auth guard
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/login");
    });
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const addConsumo = () => {
    setConsumos((c) => [
      ...c,
      { descricao: "", data_vencimento: undefined, valor: 0, boleto: null },
    ]);
  };

  const updateConsumo = (idx: number, patch: Partial<ContaConsumo>) => {
    setConsumos((c) => c.map((item, i) => (i === idx ? { ...item, ...patch } : item)));
  };

  const removeConsumo = (idx: number) => {
    setConsumos((c) => c.filter((_, i) => i !== idx));
  };

  const updateChecklist = (idx: number, patch: Partial<ChecklistItem>) => {
    setChecklist((c) => c.map((item, i) => (i === idx ? { ...item, ...patch } : item)));
  };

  const uploadFile = async (sinistroId: string, file: File, prefix: string): Promise<string> => {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${sinistroId}/${prefix}/${Date.now()}_${safeName}`;
    const { error } = await supabase.storage.from("sinistros").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (error) throw error;
    return path;
  };

  const handleSubmit = async () => {
    // Validação base
    const parsed = baseSchema.safeParse({
      inquilino_nome: nome,
      inquilino_cpf: cpf,
      codigo_contrato: codigoContrato,
      status_imovel: statusImovel,
      empresa,
    });
    if (!parsed.success) {
      toast({
        title: "Verifique os dados",
        description: parsed.error.errors[0]?.message,
        variant: "destructive",
      });
      return;
    }

    if (!aluguelVencimento || aluguelValor <= 0) {
      toast({
        title: "Débito de aluguel obrigatório",
        description: "Informe data de vencimento e valor do aluguel.",
        variant: "destructive",
      });
      return;
    }

    if (statusImovel === "desocupado") {
      if (!motivoDesocupacao.trim() || !dataChaves) {
        toast({
          title: "Campos da desocupação obrigatórios",
          description: "Informe o motivo e a data de entrega das chaves.",
          variant: "destructive",
        });
        return;
      }
      if (!termoChaves) {
        toast({
          title: "Termo de entrega de chaves obrigatório",
          description: "Anexe o termo de entrega de chaves.",
          variant: "destructive",
        });
        return;
      }
      if (possuiObras === "sim" && orcamentosObras.length === 0) {
        toast({
          title: "Orçamentos de obras obrigatórios",
          description: "Anexe ao menos um orçamento.",
          variant: "destructive",
        });
        return;
      }
    }

    for (const [i, c] of consumos.entries()) {
      if (!c.descricao.trim() || !c.data_vencimento || c.valor <= 0) {
        toast({
          title: `Conta de consumo #${i + 1} incompleta`,
          variant: "destructive",
        });
        return;
      }
    }

    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();

      // 1. Cria sinistro
      const { data: sinistro, error: errSinistro } = await supabase
        .from("sinistros")
        .insert({
          inquilino_nome: nome.trim(),
          inquilino_cpf: cpf,
          codigo_contrato: codigoContrato.trim(),
          status_imovel: statusImovel,
          empresa,
          motivo_desocupacao: statusImovel === "desocupado" ? motivoDesocupacao.trim() : null,
          data_entrega_chaves:
            statusImovel === "desocupado" && dataChaves
              ? format(dataChaves, "yyyy-MM-dd")
              : null,
          possui_obras: statusImovel === "desocupado" && possuiObras === "sim",
          checklist: checklist
            .filter((c) => c.checked)
            .map((c) => ({ label: c.label })),
          status: "em_analise",
          created_by: userData.user?.id ?? null,
          observacoes: observacoes.trim() || null,
        })
        .select()
        .single();

      if (errSinistro || !sinistro) throw errSinistro;

      // 2. Upload e insert do débito de aluguel
      let aluguelPath: string | null = null;
      if (aluguelBoleto) {
        aluguelPath = await uploadFile(sinistro.id, aluguelBoleto, "aluguel");
      }
      await supabase.from("sinistro_debitos").insert({
        sinistro_id: sinistro.id,
        tipo: "aluguel",
        descricao: "Aluguel",
        data_vencimento: format(aluguelVencimento, "yyyy-MM-dd"),
        valor: aluguelValor,
        boleto_path: aluguelPath,
      });

      // 3. Consumos
      for (const c of consumos) {
        let path: string | null = null;
        if (c.boleto) path = await uploadFile(sinistro.id, c.boleto, "consumo");
        await supabase.from("sinistro_debitos").insert({
          sinistro_id: sinistro.id,
          tipo: "consumo",
          descricao: c.descricao.trim(),
          data_vencimento: format(c.data_vencimento!, "yyyy-MM-dd"),
          valor: c.valor,
          boleto_path: path,
        });
      }

      // 4. Anexos do checklist
      for (const item of checklist) {
        if (item.checked && item.file) {
          const path = await uploadFile(sinistro.id, item.file, "checklist");
          await supabase.from("sinistro_anexos").insert({
            sinistro_id: sinistro.id,
            nome: item.file.name,
            tipo: item.label,
            file_path: path,
          });
        }
      }

      // 5. Termo de entrega de chaves (desocupado)
      if (statusImovel === "desocupado" && termoChaves) {
        const path = await uploadFile(sinistro.id, termoChaves, "desocupacao");
        await supabase.from("sinistro_anexos").insert({
          sinistro_id: sinistro.id,
          nome: termoChaves.name,
          tipo: "Termo de entrega de chaves",
          file_path: path,
        });
      }

      // 6. Orçamentos de obras
      if (statusImovel === "desocupado" && possuiObras === "sim") {
        for (const f of orcamentosObras) {
          const path = await uploadFile(sinistro.id, f, "obras");
          await supabase.from("sinistro_anexos").insert({
            sinistro_id: sinistro.id,
            nome: f.name,
            tipo: "Orçamento de obras",
            file_path: path,
          });
        }
      }

      toast({ title: "Sinistro registrado", description: "Confira o resumo antes de abrir." });
      navigate(`/novo-sinistro/resumo/${sinistro.id}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Tente novamente";
      toast({ title: "Erro ao salvar sinistro", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const checklistAtual = statusImovel === "ocupado" ? CHECKLIST_OCUPADO : CHECKLIST_DESOCUPADO;

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="bg-card border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <img src={logoKMR} alt="KMR" className="h-8 w-auto hidden sm:block" />
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-1" />
            Sair
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">
            Registrar novo sinistro
          </h1>
          <p className="text-muted-foreground mt-1">
            Preencha os dados de inadimplência e anexe os documentos necessários.
          </p>
        </div>

        {/* Dados do inquilino */}
        <Card>
          <CardHeader>
            <CardTitle>Dados do inquilino</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="empresa">Empresa</Label>
              <Select value={empresa} onValueChange={(v) => handleEmpresaChange(v as EmpresaSinistro)}>
                <SelectTrigger id="empresa">
                  <SelectValue placeholder="Selecione a empresa" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  <SelectItem value="Rotina">Rotina</SelectItem>
                  <SelectItem value="Alugar">Alugar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="nome">Nome completo</Label>
              <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} maxLength={150} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <MaskedInput
                id="cpf"
                mask="999.999.999-99"
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
                placeholder="000.000.000-00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contrato">Código do contrato (Imoview)</Label>
              <Popover open={contratoOpen} onOpenChange={setContratoOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="contrato"
                    type="button"
                    variant="outline"
                    role="combobox"
                    disabled={!empresa}
                    className={cn(
                      "w-full justify-between font-normal",
                      !codigoContrato && "text-muted-foreground",
                    )}
                  >
                    {codigoContrato ||
                      (!empresa
                        ? "Selecione a empresa primeiro"
                        : contratosLoading
                          ? "Carregando contratos..."
                          : "Selecionar contrato")}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-popover z-50" align="start">
                  <Command>
                    <CommandInput placeholder="Buscar por código, nome ou CPF..." />
                    <CommandList>
                      <CommandEmpty>Nenhum contrato encontrado.</CommandEmpty>
                      <CommandGroup>
                        {contratos.map((c) => (
                          <CommandItem
                            key={c.imoview_number}
                            value={`${c.imoview_number} ${c.locatario_nome ?? ""} ${c.locatario_cpf ?? ""}`}
                            onSelect={() => handleContratoSelect(c)}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                codigoContrato === c.imoview_number ? "opacity-100" : "opacity-0",
                              )}
                            />
                            <div className="min-w-0">
                              <div className="font-medium truncate">{c.imoview_number}</div>
                              <div className="text-xs text-muted-foreground truncate">
                                {c.locatario_nome ?? "Sem nome"}
                                {c.locatario_cpf ? ` • ${c.locatario_cpf}` : ""}
                              </div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
        </Card>

        {/* Status do imóvel */}
        <Card>
          <CardHeader>
            <CardTitle>Status do imóvel</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={statusImovel}
              onValueChange={(v) => setStatusImovel(v as StatusImovel)}
              className="flex flex-col sm:flex-row gap-4"
            >
              <label className="flex items-center gap-2 border rounded-md px-4 py-3 cursor-pointer flex-1 hover:border-primary/50 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5">
                <RadioGroupItem value="ocupado" />
                <span className="font-medium">Ocupado</span>
              </label>
              <label className="flex items-center gap-2 border rounded-md px-4 py-3 cursor-pointer flex-1 hover:border-primary/50 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5">
                <RadioGroupItem value="desocupado" />
                <span className="font-medium">Desocupado</span>
              </label>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Aluguel */}
        <Card>
          <CardHeader>
            <CardTitle>Débito de aluguel</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-2">
              <Label>Boleto do aluguel</Label>
              <FileUploadField value={aluguelBoleto} onChange={setAluguelBoleto} />
            </div>
            <div className="space-y-2">
              <Label>Data de vencimento</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !aluguelVencimento && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {aluguelVencimento ? format(aluguelVencimento, "dd/MM/yyyy") : "Selecionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={aluguelVencimento}
                    onSelect={setAluguelVencimento}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Valor original (sem multa/juros)</Label>
              <CurrencyInput value={aluguelValor} onChange={setAluguelValor} />
            </div>
          </CardContent>
        </Card>

        {/* Consumos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Contas de consumo</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addConsumo}>
              <Plus className="h-4 w-4 mr-1" />
              Adicionar conta
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {consumos.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nenhuma conta adicionada. Clique em "Adicionar conta" para incluir.
              </p>
            )}
            {consumos.map((c, idx) => (
              <div key={idx} className="border rounded-md p-4 space-y-3 bg-muted/20">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Conta #{idx + 1}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => removeConsumo(idx)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2 space-y-2">
                    <Label>Descrição</Label>
                    <Input
                      placeholder="Ex: água, luz, condomínio"
                      value={c.descricao}
                      onChange={(e) => updateConsumo(idx, { descricao: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Data de vencimento</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !c.data_vencimento && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {c.data_vencimento
                            ? format(c.data_vencimento, "dd/MM/yyyy")
                            : "Selecionar"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={c.data_vencimento}
                          onSelect={(d) => updateConsumo(idx, { data_vencimento: d })}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label>Valor</Label>
                    <CurrencyInput
                      value={c.valor}
                      onChange={(v) => updateConsumo(idx, { valor: v })}
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-2">
                    <Label>Boleto</Label>
                    <FileUploadField
                      value={c.boleto}
                      onChange={(f) => updateConsumo(idx, { boleto: f })}
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Desocupado */}
        {statusImovel === "desocupado" && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Informações da desocupação</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="motivo">Motivo da desocupação</Label>
                  <Textarea
                    id="motivo"
                    value={motivoDesocupacao}
                    onChange={(e) => setMotivoDesocupacao(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data de entrega das chaves</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dataChaves && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dataChaves ? format(dataChaves, "dd/MM/yyyy") : "Selecionar"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dataChaves}
                        onSelect={setDataChaves}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>Termo de entrega de chaves</Label>
                  <FileUploadField
                    value={termoChaves}
                    onChange={setTermoChaves}
                    label="Anexar termo"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Obras</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Indique se o imóvel possui obras a serem realizadas.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Imóvel possui obras?</Label>
                  <RadioGroup
                    value={possuiObras}
                    onValueChange={(v) => setPossuiObras(v as "sim" | "nao")}
                    className="flex flex-col sm:flex-row gap-4"
                  >
                    <label className="flex items-center gap-2 border rounded-md px-4 py-3 cursor-pointer flex-1 hover:border-primary/50 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5">
                      <RadioGroupItem value="nao" />
                      <span className="font-medium">Não</span>
                    </label>
                    <label className="flex items-center gap-2 border rounded-md px-4 py-3 cursor-pointer flex-1 hover:border-primary/50 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5">
                      <RadioGroupItem value="sim" />
                      <span className="font-medium">Sim</span>
                    </label>
                  </RadioGroup>
                </div>
                {possuiObras === "sim" && (
                  <div className="space-y-2">
                    <Label>Anexar orçamentos de obras</Label>
                    <MultiFileUploadField
                      value={orcamentosObras}
                      onChange={setOrcamentosObras}
                      label="Selecionar orçamentos"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Checklist */}
        <Card>
          <CardHeader>
            <CardTitle>Checklist de documentos</CardTitle>
            <p className="text-sm text-muted-foreground">
              Marque os documentos disponíveis e anexe os arquivos correspondentes.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {checklist.map((item, idx) => {
              if (!checklistAtual.includes(item.label)) return null;
              return (
                <div
                  key={item.label}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 border rounded-md p-3"
                >
                  <label className="flex items-center gap-2 flex-1 cursor-pointer">
                    <Checkbox
                      checked={item.checked}
                      onCheckedChange={(v) => updateChecklist(idx, { checked: !!v })}
                    />
                    <span className="text-sm">{item.label}</span>
                  </label>
                  {item.checked && (
                    <div className="w-full sm:w-72">
                      <FileUploadField
                        value={item.file}
                        onChange={(f) => updateChecklist(idx, { file: f })}
                        label="Anexar arquivo"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Observações */}
        <Card>
          <CardHeader>
            <CardTitle>Observações</CardTitle>
            <p className="text-sm text-muted-foreground">
              Adicione informações relevantes sobre o sinistro.
            </p>
          </CardHeader>
          <CardContent>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Adicione informações relevantes sobre o sinistro..."
              className="w-full font-sans"
              style={{
                minHeight: 120,
                border: "1px solid #E8EDF2",
                borderRadius: 8,
                padding: 12,
                fontSize: 14,
                color: "#4F4F4F",
              }}
            />
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-3 justify-end">
          <Button variant="outline" onClick={() => navigate("/dashboard")} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="min-h-[44px]">
            {loading ? "Salvando..." : "Continuar"}
          </Button>
        </div>
      </main>
    </div>
  );
};

export default NovoSinistro;
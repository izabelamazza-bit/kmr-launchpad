import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import CrudLayout from "@/components/crud/CrudLayout";
import DataTable, { Column } from "@/components/crud/DataTable";
import DeleteDialog from "@/components/crud/DeleteDialog";
import FormSheet from "@/components/crud/FormSheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { MaskedInput } from "@/components/ui/masked-input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CurrencyInput } from "@/components/sinistros/CurrencyInput";
import { validateEmail } from "@/lib/validators";

interface Contrato {
  id: string;
  codigo: string;
  nome: string;
  telefone1: string;
  telefone2: string | null;
  email: string;
  valor_aluguel: number;
  endereco: string;
  situacao: string;
  data_inicio: string;
  data_fim: string;
  proximo_reajuste: string;
  dia_vencimento: number;
  aviso_desocupacao: boolean;
  data_aviso_desocupacao: string | null;
}

const situacaoOptions = [
  { value: "saudavel", label: "Saudável" },
  { value: "atrasado", label: "Atrasado" },
];

const emptyForm = {
  codigo: "",
  nome: "",
  telefone1: "",
  telefone2: "",
  email: "",
  valor_aluguel: 0,
  endereco: "",
  situacao: "saudavel",
  data_inicio: "",
  data_fim: "",
  proximo_reajuste: "",
  dia_vencimento: 10,
  aviso_desocupacao: false,
  data_aviso_desocupacao: "",
};

const People = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [data, setData] = useState<Contrato[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filtroSituacao, setFiltroSituacao] = useState<string>("todos");
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteItem, setDeleteItem] = useState<Contrato | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/login");
    });
  }, [navigate]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: rows } = await supabase
      .from("contratos_pessoas")
      .select("*")
      .order("created_at", { ascending: false });
    setData((rows as Contrato[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = data.filter((item) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q || item.nome.toLowerCase().includes(q) || item.codigo.includes(q);
    const matchesSituacao = filtroSituacao === "todos" || item.situacao === filtroSituacao;
    return matchesSearch && matchesSituacao;
  });

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.codigo.trim()) e.codigo = "Preencha este campo.";
    if (!form.nome.trim()) e.nome = "Preencha este campo.";
    if (!form.telefone1.trim()) e.telefone1 = "Preencha este campo.";
    if (!form.email.trim()) e.email = "Preencha este campo.";
    else if (!validateEmail(form.email)) e.email = "Email inválido.";
    if (!form.endereco.trim()) e.endereco = "Preencha este campo.";
    if (!form.valor_aluguel || form.valor_aluguel <= 0) e.valor_aluguel = "Informe o valor.";
    if (!form.data_inicio) e.data_inicio = "Preencha este campo.";
    if (!form.data_fim) e.data_fim = "Preencha este campo.";
    if (!form.proximo_reajuste) e.proximo_reajuste = "Preencha este campo.";
    if (!form.dia_vencimento || form.dia_vencimento < 1 || form.dia_vencimento > 31)
      e.dia_vencimento = "Informe um dia válido (1 a 31).";
    if (form.aviso_desocupacao && !form.data_aviso_desocupacao)
      e.data_aviso_desocupacao = "Informe a data do aviso.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);

    const { data: existing } = await supabase
      .from("contratos_pessoas")
      .select("id")
      .eq("codigo", form.codigo.trim())
      .neq("id", editingId || "00000000-0000-0000-0000-000000000000")
      .limit(1);
    if (existing && existing.length > 0) {
      setErrors((p) => ({ ...p, codigo: "Já existe um contrato com este código." }));
      setSaving(false);
      return;
    }

    const payload = {
      codigo: form.codigo.trim(),
      nome: form.nome.trim(),
      telefone1: form.telefone1.trim(),
      telefone2: form.telefone2.trim() || null,
      email: form.email.trim(),
      valor_aluguel: form.valor_aluguel,
      endereco: form.endereco.trim(),
      situacao: form.situacao,
      data_inicio: form.data_inicio,
      data_fim: form.data_fim,
      proximo_reajuste: form.proximo_reajuste,
      dia_vencimento: form.dia_vencimento,
      aviso_desocupacao: form.aviso_desocupacao,
      data_aviso_desocupacao: form.aviso_desocupacao ? form.data_aviso_desocupacao : null,
    };

    if (editingId) {
      const { error } = await supabase.from("contratos_pessoas").update(payload).eq("id", editingId);
      if (error) {
        toast({ variant: "destructive", title: "Erro ao salvar." });
        setSaving(false);
        return;
      }
      toast({ title: "Contrato atualizado com sucesso." });
    } else {
      const { error } = await supabase.from("contratos_pessoas").insert(payload);
      if (error) {
        toast({ variant: "destructive", title: "Erro ao salvar." });
        setSaving(false);
        return;
      }
      toast({ title: "Contrato cadastrado com sucesso." });
    }

    setSaving(false);
    setFormOpen(false);
    setForm(emptyForm);
    setEditingId(null);
    setErrors({});
    fetchData();
  };

  const handleEdit = (item: Contrato) => {
    setEditingId(item.id);
    setForm({
      codigo: item.codigo,
      nome: item.nome,
      telefone1: item.telefone1,
      telefone2: item.telefone2 || "",
      email: item.email,
      valor_aluguel: Number(item.valor_aluguel),
      endereco: item.endereco,
      situacao: item.situacao,
      data_inicio: item.data_inicio,
      data_fim: item.data_fim,
      proximo_reajuste: item.proximo_reajuste,
      dia_vencimento: item.dia_vencimento,
      aviso_desocupacao: item.aviso_desocupacao,
      data_aviso_desocupacao: item.data_aviso_desocupacao || "",
    });
    setErrors({});
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setSaving(true);
    await supabase.from("contratos_pessoas").delete().eq("id", deleteItem.id);
    toast({ title: "Contrato excluído com sucesso." });
    setSaving(false);
    setDeleteOpen(false);
    setDeleteItem(null);
    fetchData();
  };

  const SituacaoBadge = ({ situacao }: { situacao: string }) =>
    situacao === "saudavel" ? (
      <Badge className="bg-[#27AE60] hover:bg-[#27AE60]/90 text-white">Saudável</Badge>
    ) : (
      <Badge variant="destructive">Atrasado</Badge>
    );

  const columns: Column<Contrato>[] = [
    { key: "codigo", label: "Código", render: (i) => <span className="font-mono">{i.codigo}</span> },
    { key: "nome", label: "Locatário" },
    { key: "situacao", label: "Situação", render: (i) => <SituacaoBadge situacao={i.situacao} /> },
    { key: "vencimento", label: "Vencimento", render: (i) => `Dia ${i.dia_vencimento} de cada mês` },
  ];

  const Field = ({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) => (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );

  return (
    <CrudLayout
      title="Pessoas"
      searchValue={search}
      onSearchChange={setSearch}
      onNewClick={() => {
        setEditingId(null);
        setForm(emptyForm);
        setErrors({});
        setFormOpen(true);
      }}
      newLabel="Nova Pessoa"
    >
      <Tabs value={filtroSituacao} onValueChange={setFiltroSituacao} className="mb-4">
        <TabsList>
          <TabsTrigger value="todos">Todos</TabsTrigger>
          <TabsTrigger value="saudavel">Saudável</TabsTrigger>
          <TabsTrigger value="atrasado">Atrasado</TabsTrigger>
        </TabsList>
      </Tabs>

      <DataTable
        columns={columns}
        data={filtered}
        onEdit={handleEdit}
        onDelete={(item) => {
          setDeleteItem(item);
          setDeleteOpen(true);
        }}
        loading={loading}
        isFiltered={search.length > 0 || filtroSituacao !== "todos"}
        emptyMessage="Nenhum contrato cadastrado."
        onRowClick={(item) => navigate(`/cadastros/pessoas/${item.id}`)}
      />

      <FormSheet
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editingId ? "Editar contrato" : "Nova Pessoa"}
        onSubmit={handleSubmit}
        loading={saving}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Código do contrato *" error={errors.codigo}>
            <Input
              value={form.codigo}
              onChange={(e) => setForm({ ...form, codigo: e.target.value })}
              className={errors.codigo ? "border-destructive" : ""}
            />
          </Field>
          <Field label="Situação *">
            <SearchableSelect
              options={situacaoOptions}
              value={form.situacao}
              onChange={(v) => setForm({ ...form, situacao: v })}
              placeholder="Selecione..."
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Nome do locatário *" error={errors.nome}>
              <Input
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                className={errors.nome ? "border-destructive" : ""}
              />
            </Field>
          </div>
          <Field label="Telefone 1 *" error={errors.telefone1}>
            <MaskedInput
              mask="(99) 99999-9999"
              value={form.telefone1}
              onChange={(e) => setForm({ ...form, telefone1: e.target.value })}
              error={!!errors.telefone1}
              placeholder="(00) 00000-0000"
            />
          </Field>
          <Field label="Telefone 2">
            <MaskedInput
              mask="(99) 99999-9999"
              value={form.telefone2}
              onChange={(e) => setForm({ ...form, telefone2: e.target.value })}
              placeholder="(00) 00000-0000"
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="E-mail *" error={errors.email}>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={errors.email ? "border-destructive" : ""}
              />
            </Field>
          </div>
          <Field label="Valor do aluguel *" error={errors.valor_aluguel}>
            <CurrencyInput
              value={form.valor_aluguel}
              onChange={(v) => setForm({ ...form, valor_aluguel: v })}
            />
          </Field>
          <Field label="Dia de vencimento *" error={errors.dia_vencimento}>
            <Input
              type="number"
              min={1}
              max={31}
              value={form.dia_vencimento}
              onChange={(e) => setForm({ ...form, dia_vencimento: parseInt(e.target.value) || 0 })}
              className={errors.dia_vencimento ? "border-destructive" : ""}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Endereço do imóvel *" error={errors.endereco}>
              <Textarea
                value={form.endereco}
                onChange={(e) => setForm({ ...form, endereco: e.target.value })}
                className={errors.endereco ? "border-destructive" : ""}
              />
            </Field>
          </div>
          <Field label="Data de início *" error={errors.data_inicio}>
            <Input
              type="date"
              value={form.data_inicio}
              onChange={(e) => setForm({ ...form, data_inicio: e.target.value })}
              className={errors.data_inicio ? "border-destructive" : ""}
            />
          </Field>
          <Field label="Data de fim *" error={errors.data_fim}>
            <Input
              type="date"
              value={form.data_fim}
              onChange={(e) => setForm({ ...form, data_fim: e.target.value })}
              className={errors.data_fim ? "border-destructive" : ""}
            />
          </Field>
          <Field label="Próximo reajuste *" error={errors.proximo_reajuste}>
            <Input
              type="date"
              value={form.proximo_reajuste}
              onChange={(e) => setForm({ ...form, proximo_reajuste: e.target.value })}
              className={errors.proximo_reajuste ? "border-destructive" : ""}
            />
          </Field>
          <div className="sm:col-span-2 flex items-center justify-between rounded-md border px-3 py-3">
            <div>
              <Label>Aviso de desocupação</Label>
              <p className="text-xs text-muted-foreground">Inquilino comunicou que vai sair?</p>
            </div>
            <Switch
              checked={form.aviso_desocupacao}
              onCheckedChange={(v) => setForm({ ...form, aviso_desocupacao: v })}
            />
          </div>
          {form.aviso_desocupacao && (
            <div className="sm:col-span-2">
              <Field label="Data do aviso de desocupação *" error={errors.data_aviso_desocupacao}>
                <Input
                  type="date"
                  value={form.data_aviso_desocupacao}
                  onChange={(e) => setForm({ ...form, data_aviso_desocupacao: e.target.value })}
                  className={errors.data_aviso_desocupacao ? "border-destructive" : ""}
                />
              </Field>
            </div>
          )}
        </div>
      </FormSheet>

      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDelete}
        itemName={deleteItem?.nome}
        loading={saving}
      />
    </CrudLayout>
  );
};

export default People;

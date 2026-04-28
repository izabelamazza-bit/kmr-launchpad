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
import { MaskedInput } from "@/components/ui/masked-input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Badge } from "@/components/ui/badge";
import { validateCNPJ, validateEmail, validatePhone } from "@/lib/validators";

interface CompanyRecord {
  id: string;
  razao_social: string;
  nome_fantasia: string;
  cnpj: string;
  email: string;
  phone: string | null;
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  status: string;
}

const statusOptions = [
  { value: "ativo", label: "Ativo" },
  { value: "inativo", label: "Inativo" },
];

const estadoOptions = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"
].map(s => ({ value: s, label: s }));

const emptyForm = {
  razao_social: "", nome_fantasia: "", cnpj: "", email: "", phone: "",
  cep: "", logradouro: "", numero: "", complemento: "", bairro: "", cidade: "", estado: "", status: "ativo",
};

const Companies = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [data, setData] = useState<CompanyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteItem, setDeleteItem] = useState<CompanyRecord | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { if (!session) navigate("/login"); });
  }, [navigate]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: rows } = await supabase.from("companies").select("*").order("created_at", { ascending: false });
    setData((rows as CompanyRecord[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = data.filter((item) => {
    const q = search.toLowerCase();
    return item.razao_social.toLowerCase().includes(q) || item.nome_fantasia.toLowerCase().includes(q) || item.cnpj.includes(q);
  });

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.razao_social.trim()) e.razao_social = "Preencha este campo.";
    if (!form.nome_fantasia.trim()) e.nome_fantasia = "Preencha este campo.";
    if (!form.cnpj.trim()) e.cnpj = "Preencha este campo.";
    else if (!validateCNPJ(form.cnpj)) e.cnpj = "CNPJ inválido.";
    if (!form.email.trim()) e.email = "Preencha este campo.";
    else if (!validateEmail(form.email)) e.email = "Email inválido.";
    if (form.phone && !validatePhone(form.phone)) e.phone = "Telefone inválido.";
    if (!form.logradouro.trim()) e.logradouro = "Preencha este campo.";
    if (!form.bairro.trim()) e.bairro = "Preencha este campo.";
    if (!form.cidade.trim()) e.cidade = "Preencha este campo.";
    if (!form.estado) e.estado = "Preencha este campo.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);

    const cnpjDigits = form.cnpj.replace(/\D/g, "");
    const { data: existing } = await supabase
      .from("companies").select("id").eq("cnpj", form.cnpj.trim())
      .neq("id", editingId || "00000000-0000-0000-0000-000000000000").limit(1);
    if (existing && existing.length > 0) {
      setErrors(p => ({ ...p, cnpj: "Já existe uma empresa cadastrada com este CNPJ." }));
      setSaving(false);
      return;
    }

    const payload = {
      razao_social: form.razao_social.trim(), nome_fantasia: form.nome_fantasia.trim(),
      cnpj: form.cnpj.trim(), email: form.email.trim(), phone: form.phone || null,
      cep: form.cep || null, logradouro: form.logradouro.trim(), numero: form.numero.trim() || null,
      complemento: form.complemento.trim() || null, bairro: form.bairro.trim(),
      cidade: form.cidade.trim(), estado: form.estado, status: form.status,
      updated_at: new Date().toISOString(),
    };

    if (editingId) {
      const { error } = await supabase.from("companies").update(payload).eq("id", editingId);
      if (error) { toast({ variant: "destructive", title: "Erro ao salvar." }); setSaving(false); return; }
      toast({ title: "Empresa atualizada com sucesso." });
    } else {
      const { error } = await supabase.from("companies").insert(payload);
      if (error) { toast({ variant: "destructive", title: "Erro ao salvar." }); setSaving(false); return; }
      toast({ title: "Empresa cadastrada com sucesso." });
    }

    setSaving(false); setFormOpen(false); setForm(emptyForm); setEditingId(null); setErrors({}); fetchData();
  };

  const handleEdit = (item: CompanyRecord) => {
    setEditingId(item.id);
    setForm({
      razao_social: item.razao_social, nome_fantasia: item.nome_fantasia, cnpj: item.cnpj,
      email: item.email, phone: item.phone || "", cep: item.cep || "",
      logradouro: item.logradouro || "", numero: item.numero || "", complemento: item.complemento || "",
      bairro: item.bairro || "", cidade: item.cidade || "", estado: item.estado || "", status: item.status,
    });
    setErrors({});
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setSaving(true);
    await supabase.from("companies").delete().eq("id", deleteItem.id);
    toast({ title: "Empresa excluída com sucesso." });
    setSaving(false); setDeleteOpen(false); setDeleteItem(null); fetchData();
  };

  const columns: Column<CompanyRecord>[] = [
    { key: "razao_social", label: "Razão Social" },
    { key: "nome_fantasia", label: "Nome Fantasia" },
    { key: "cnpj", label: "CNPJ" },
    { key: "phone", label: "Telefone", hideOnMobile: true },
    { key: "cidade", label: "Cidade", hideOnMobile: true },
    { key: "status", label: "Status", render: (i) => <Badge variant={i.status === "ativo" ? "default" : "secondary"}>{i.status === "ativo" ? "Ativo" : "Inativo"}</Badge> },
  ];

  const Field = ({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) => (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );

  return (
    <CrudLayout title="Empresas" searchValue={search} onSearchChange={setSearch} onNewClick={() => { setEditingId(null); setForm(emptyForm); setErrors({}); setFormOpen(true); }} newLabel="Nova empresa">
      <DataTable columns={columns} data={filtered} onEdit={handleEdit} onDelete={(item) => { setDeleteItem(item); setDeleteOpen(true); }} loading={loading} isFiltered={search.length > 0} emptyMessage="Nenhuma empresa cadastrada." />

      <FormSheet open={formOpen} onOpenChange={setFormOpen} title={editingId ? "Editar empresa" : "Nova empresa"} onSubmit={handleSubmit} loading={saving}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Razão Social *" error={errors.razao_social}>
            <Input value={form.razao_social} onChange={(e) => setForm({ ...form, razao_social: e.target.value })} className={errors.razao_social ? "border-destructive" : ""} />
          </Field>
          <Field label="Nome Fantasia *" error={errors.nome_fantasia}>
            <Input value={form.nome_fantasia} onChange={(e) => setForm({ ...form, nome_fantasia: e.target.value })} className={errors.nome_fantasia ? "border-destructive" : ""} />
          </Field>
          <Field label="CNPJ *" error={errors.cnpj}>
            <MaskedInput mask="99.999.999/9999-99" value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} error={!!errors.cnpj} placeholder="00.000.000/0000-00" />
          </Field>
          <Field label="Email *" error={errors.email}>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={errors.email ? "border-destructive" : ""} />
          </Field>
          <Field label="Telefone" error={errors.phone}>
            <MaskedInput mask="(99) 99999-9999" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} error={!!errors.phone} placeholder="(00) 00000-0000" />
          </Field>
          <Field label="CEP" error={errors.cep}>
            <MaskedInput mask="99999-999" value={form.cep} onChange={(e) => setForm({ ...form, cep: e.target.value })} error={!!errors.cep} placeholder="00000-000" />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Logradouro *" error={errors.logradouro}>
              <Input value={form.logradouro} onChange={(e) => setForm({ ...form, logradouro: e.target.value })} className={errors.logradouro ? "border-destructive" : ""} />
            </Field>
          </div>
          <Field label="Número">
            <Input value={form.numero} onChange={(e) => setForm({ ...form, numero: e.target.value })} />
          </Field>
          <Field label="Complemento">
            <Input value={form.complemento} onChange={(e) => setForm({ ...form, complemento: e.target.value })} />
          </Field>
          <Field label="Bairro *" error={errors.bairro}>
            <Input value={form.bairro} onChange={(e) => setForm({ ...form, bairro: e.target.value })} className={errors.bairro ? "border-destructive" : ""} />
          </Field>
          <Field label="Cidade *" error={errors.cidade}>
            <Input value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} className={errors.cidade ? "border-destructive" : ""} />
          </Field>
          <Field label="Estado *" error={errors.estado}>
            <SearchableSelect options={estadoOptions} value={form.estado} onChange={(v) => setForm({ ...form, estado: v })} placeholder="UF" />
          </Field>
          <Field label="Status *">
            <SearchableSelect options={statusOptions} value={form.status} onChange={(v) => setForm({ ...form, status: v })} placeholder="Selecione..." />
          </Field>
        </div>
      </FormSheet>

      <DeleteDialog open={deleteOpen} onOpenChange={setDeleteOpen} onConfirm={handleDelete} itemName={deleteItem?.razao_social} loading={saving} />
    </CrudLayout>
  );
};

export default Companies;

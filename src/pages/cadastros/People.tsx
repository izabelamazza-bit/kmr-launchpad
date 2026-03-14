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
import { validateCPF, validateEmail, validatePhone } from "@/lib/validators";

interface PersonRecord {
  id: string;
  full_name: string;
  cpf: string;
  email: string;
  phone: string | null;
  birth_date: string | null;
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
  full_name: "", cpf: "", email: "", phone: "", birth_date: "",
  cep: "", logradouro: "", numero: "", complemento: "", bairro: "", cidade: "", estado: "", status: "ativo",
};

const People = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [data, setData] = useState<PersonRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteItem, setDeleteItem] = useState<PersonRecord | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { if (!session) navigate("/login"); });
  }, [navigate]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: rows } = await supabase.from("people").select("*").order("created_at", { ascending: false });
    setData((rows as PersonRecord[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = data.filter((item) => {
    const q = search.toLowerCase();
    return item.full_name.toLowerCase().includes(q) || item.cpf.includes(q) || item.email.toLowerCase().includes(q);
  });

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.full_name.trim()) e.full_name = "Preencha este campo.";
    if (!form.cpf.trim()) e.cpf = "Preencha este campo.";
    else if (!validateCPF(form.cpf)) e.cpf = "CPF inválido.";
    if (!form.email.trim()) e.email = "Preencha este campo.";
    else if (!validateEmail(form.email)) e.email = "Email inválido.";
    if (form.phone && !validatePhone(form.phone)) e.phone = "Telefone inválido.";
    if (!form.birth_date) e.birth_date = "Preencha este campo.";
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

    const { data: existing } = await supabase
      .from("people").select("id").eq("cpf", form.cpf.trim())
      .neq("id", editingId || "00000000-0000-0000-0000-000000000000").limit(1);
    if (existing && existing.length > 0) {
      setErrors(p => ({ ...p, cpf: "Já existe uma pessoa cadastrada com este CPF." }));
      setSaving(false);
      return;
    }

    const payload = {
      full_name: form.full_name.trim(), cpf: form.cpf.trim(), email: form.email.trim(),
      phone: form.phone || null, birth_date: form.birth_date || null,
      cep: form.cep || null, logradouro: form.logradouro.trim(), numero: form.numero.trim() || null,
      complemento: form.complemento.trim() || null, bairro: form.bairro.trim(),
      cidade: form.cidade.trim(), estado: form.estado, status: form.status,
      updated_at: new Date().toISOString(),
    };

    if (editingId) {
      const { error } = await supabase.from("people").update(payload).eq("id", editingId);
      if (error) { toast({ variant: "destructive", title: "Erro ao salvar." }); setSaving(false); return; }
      toast({ title: "Pessoa atualizada com sucesso." });
    } else {
      const { error } = await supabase.from("people").insert(payload);
      if (error) { toast({ variant: "destructive", title: "Erro ao salvar." }); setSaving(false); return; }
      toast({ title: "Pessoa cadastrada com sucesso." });
    }

    setSaving(false); setFormOpen(false); setForm(emptyForm); setEditingId(null); setErrors({}); fetchData();
  };

  const handleEdit = (item: PersonRecord) => {
    setEditingId(item.id);
    setForm({
      full_name: item.full_name, cpf: item.cpf, email: item.email,
      phone: item.phone || "", birth_date: item.birth_date || "",
      cep: item.cep || "", logradouro: item.logradouro || "", numero: item.numero || "",
      complemento: item.complemento || "", bairro: item.bairro || "",
      cidade: item.cidade || "", estado: item.estado || "", status: item.status,
    });
    setErrors({});
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setSaving(true);
    await supabase.from("people").delete().eq("id", deleteItem.id);
    toast({ title: "Pessoa excluída com sucesso." });
    setSaving(false); setDeleteOpen(false); setDeleteItem(null); fetchData();
  };

  const columns: Column<PersonRecord>[] = [
    { key: "full_name", label: "Nome" },
    { key: "cpf", label: "CPF" },
    { key: "email", label: "Email", hideOnMobile: true },
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
    <CrudLayout title="Pessoas" searchValue={search} onSearchChange={setSearch} onNewClick={() => { setEditingId(null); setForm(emptyForm); setErrors({}); setFormOpen(true); }} newLabel="Nova pessoa">
      <DataTable columns={columns} data={filtered} onEdit={handleEdit} onDelete={(item) => { setDeleteItem(item); setDeleteOpen(true); }} loading={loading} isFiltered={search.length > 0} emptyMessage="Nenhuma pessoa cadastrada." />

      <FormSheet open={formOpen} onOpenChange={setFormOpen} title={editingId ? "Editar pessoa" : "Nova pessoa"} onSubmit={handleSubmit} loading={saving}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Field label="Nome completo *" error={errors.full_name}>
              <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className={errors.full_name ? "border-destructive" : ""} />
            </Field>
          </div>
          <Field label="CPF *" error={errors.cpf}>
            <MaskedInput mask="999.999.999-99" value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} error={!!errors.cpf} placeholder="000.000.000-00" />
          </Field>
          <Field label="Email *" error={errors.email}>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={errors.email ? "border-destructive" : ""} />
          </Field>
          <Field label="Telefone" error={errors.phone}>
            <MaskedInput mask="(99) 99999-9999" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} error={!!errors.phone} placeholder="(00) 00000-0000" />
          </Field>
          <Field label="Data de nascimento *" error={errors.birth_date}>
            <Input type="date" value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} className={errors.birth_date ? "border-destructive" : ""} />
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

      <DeleteDialog open={deleteOpen} onOpenChange={setDeleteOpen} onConfirm={handleDelete} itemName={deleteItem?.full_name} loading={saving} />
    </CrudLayout>
  );
};

export default People;

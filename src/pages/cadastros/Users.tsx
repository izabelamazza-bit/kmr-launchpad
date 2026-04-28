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
import { validateEmail, validatePhone } from "@/lib/validators";

interface UserRecord {
  id: string;
  full_name: string;
  username: string;
  email: string;
  phone: string | null;
  access_profile: string;
  status: string;
  created_at: string;
}

const profileOptions = [
  { value: "admin", label: "Administrador" },
  { value: "user", label: "Usuário" },
  { value: "manager", label: "Gerente" },
];

const statusOptions = [
  { value: "ativo", label: "Ativo" },
  { value: "inativo", label: "Inativo" },
];

const emptyForm = {
  full_name: "",
  username: "",
  email: "",
  phone: "",
  access_profile: "user",
  status: "ativo",
  password: "",
  confirm_password: "",
};

const Users = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [data, setData] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteItem, setDeleteItem] = useState<UserRecord | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auth guard
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/login");
    });
  }, [navigate]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: rows } = await supabase.from("users_registry").select("*").order("created_at", { ascending: false });
    setData((rows as UserRecord[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = data.filter((item) => {
    const q = search.toLowerCase();
    return item.full_name.toLowerCase().includes(q) || item.username.toLowerCase().includes(q) || item.email.toLowerCase().includes(q);
  });

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.full_name.trim()) e.full_name = "Preencha este campo.";
    if (!form.username.trim()) e.username = "Preencha este campo.";
    if (!form.email.trim()) e.email = "Preencha este campo.";
    else if (!validateEmail(form.email)) e.email = "Email inválido.";
    if (form.phone && !validatePhone(form.phone)) e.phone = "Telefone inválido.";
    if (!form.access_profile) e.access_profile = "Preencha este campo.";
    if (!editingId) {
      if (!form.password) e.password = "Preencha este campo.";
      if (!form.confirm_password) e.confirm_password = "Preencha este campo.";
      if (form.password && form.confirm_password && form.password !== form.confirm_password)
        e.confirm_password = "As senhas não coincidem.";
    } else if (form.password || form.confirm_password) {
      if (form.password !== form.confirm_password)
        e.confirm_password = "As senhas não coincidem.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);

    // Check duplicate username
    const { data: existing } = await supabase
      .from("users_registry")
      .select("id")
      .eq("username", form.username.trim())
      .neq("id", editingId || "00000000-0000-0000-0000-000000000000")
      .limit(1);
    if (existing && existing.length > 0) {
      setErrors((p) => ({ ...p, username: "Este usuário já existe." }));
      setSaving(false);
      return;
    }

    const payload = {
      full_name: form.full_name.trim(),
      username: form.username.trim(),
      email: form.email.trim(),
      phone: form.phone || null,
      access_profile: form.access_profile,
      status: form.status,
      updated_at: new Date().toISOString(),
    };

    if (editingId) {
      const { error } = await supabase.from("users_registry").update(payload).eq("id", editingId);
      if (error) { toast({ variant: "destructive", title: "Erro ao salvar." }); setSaving(false); return; }
      toast({ title: "Usuário atualizado com sucesso." });
    } else {
      const { error } = await supabase.from("users_registry").insert(payload);
      if (error) { toast({ variant: "destructive", title: "Erro ao salvar." }); setSaving(false); return; }
      toast({ title: "Usuário cadastrado com sucesso." });
    }

    setSaving(false);
    setFormOpen(false);
    setForm(emptyForm);
    setEditingId(null);
    setErrors({});
    fetchData();
  };

  const handleEdit = (item: UserRecord) => {
    setEditingId(item.id);
    setForm({
      full_name: item.full_name,
      username: item.username,
      email: item.email,
      phone: item.phone || "",
      access_profile: item.access_profile,
      status: item.status,
      password: "",
      confirm_password: "",
    });
    setErrors({});
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setSaving(true);
    await supabase.from("users_registry").delete().eq("id", deleteItem.id);
    toast({ title: "Usuário excluído com sucesso." });
    setSaving(false);
    setDeleteOpen(false);
    setDeleteItem(null);
    fetchData();
  };

  const columns: Column<UserRecord>[] = [
    { key: "full_name", label: "Nome" },
    { key: "username", label: "Usuário" },
    { key: "email", label: "Email", hideOnMobile: true },
    { key: "access_profile", label: "Perfil", render: (i) => profileOptions.find(p => p.value === i.access_profile)?.label || i.access_profile },
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
    <CrudLayout title="Usuários" searchValue={search} onSearchChange={setSearch} onNewClick={() => { setEditingId(null); setForm(emptyForm); setErrors({}); setFormOpen(true); }} newLabel="Novo usuário">
      <DataTable
        columns={columns}
        data={filtered}
        onEdit={handleEdit}
        onDelete={(item) => { setDeleteItem(item); setDeleteOpen(true); }}
        loading={loading}
        isFiltered={search.length > 0}
        emptyMessage="Nenhum usuário cadastrado."
      />

      <FormSheet open={formOpen} onOpenChange={setFormOpen} title={editingId ? "Editar usuário" : "Novo usuário"} onSubmit={handleSubmit} loading={saving}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nome completo *" error={errors.full_name}>
            <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className={errors.full_name ? "border-destructive" : ""} />
          </Field>
          <Field label="Nome de usuário *" error={errors.username}>
            <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className={errors.username ? "border-destructive" : ""} />
          </Field>
          <Field label="Email *" error={errors.email}>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={errors.email ? "border-destructive" : ""} />
          </Field>
          <Field label="Telefone" error={errors.phone}>
            <MaskedInput mask="(99) 99999-9999" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} error={!!errors.phone} placeholder="(00) 00000-0000" />
          </Field>
          <Field label="Perfil de acesso *" error={errors.access_profile}>
            <SearchableSelect options={profileOptions} value={form.access_profile} onChange={(v) => setForm({ ...form, access_profile: v })} placeholder="Selecione..." />
          </Field>
          <Field label="Status *" error={errors.status}>
            <SearchableSelect options={statusOptions} value={form.status} onChange={(v) => setForm({ ...form, status: v })} placeholder="Selecione..." />
          </Field>
          <Field label={editingId ? "Nova senha (opcional)" : "Senha *"} error={errors.password}>
            <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={errors.password ? "border-destructive" : ""} />
          </Field>
          <Field label={editingId ? "Confirmar nova senha" : "Confirmar senha *"} error={errors.confirm_password}>
            <Input type="password" value={form.confirm_password} onChange={(e) => setForm({ ...form, confirm_password: e.target.value })} className={errors.confirm_password ? "border-destructive" : ""} />
          </Field>
        </div>
      </FormSheet>

      <DeleteDialog open={deleteOpen} onOpenChange={setDeleteOpen} onConfirm={handleDelete} itemName={deleteItem?.full_name} loading={saving} />
    </CrudLayout>
  );
};

export default Users;

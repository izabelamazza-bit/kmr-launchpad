import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import CrudLayout from "@/components/crud/CrudLayout";
import DataTable, { Column } from "@/components/crud/DataTable";
import DeleteDialog from "@/components/crud/DeleteDialog";
import FormSheet from "@/components/crud/FormSheet";
import ResetPasswordSection from "@/pages/cadastros/components/ResetPasswordSection";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { validateEmail } from "@/lib/validators";

interface UserRecord {
  id: string;
  user_id: string | null;
  full_name: string;
  username: string;
  email: string;
  phone: string | null;
  access_profile: string;
  status: string;
  created_at: string;
}

const Field = ({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <Label>{label}</Label>
    {children}
    {error && <p className="text-sm text-destructive">{error}</p>}
  </div>
);

const profileOptions = [
  { value: "analista", label: "Analista" },
  { value: "supervisor", label: "Supervisor" },
];

const statusOptions = [
  { value: "ativo", label: "Ativo" },
  { value: "inativo", label: "Inativo" },
];

const emptyForm = {
  full_name: "",
  email: "",
  access_profile: "analista",
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
  const [formTab, setFormTab] = useState("dados");

  const editingUser = editingId ? data.find((item) => item.id === editingId) : null;

  const fields = (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Field label="Nome completo *" error={errors.full_name}>
        <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className={errors.full_name ? "border-destructive" : ""} />
      </Field>
      <Field label="E-mail *" error={errors.email}>
        <Input type="email" value={form.email} disabled={!!editingId} onChange={(e) => setForm({ ...form, email: e.target.value })} className={errors.email ? "border-destructive" : ""} />
      </Field>
      <Field label="Perfil *" error={errors.access_profile}>
        <SearchableSelect options={profileOptions} value={form.access_profile} onChange={(v) => setForm({ ...form, access_profile: v })} placeholder="Selecione..." />
      </Field>
      <Field label="Status *" error={errors.status}>
        <SearchableSelect options={statusOptions} value={form.status} onChange={(v) => setForm({ ...form, status: v })} placeholder="Selecione..." />
      </Field>
      {!editingId && (
        <>
          <Field label="Senha inicial *" error={errors.password}>
            <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={errors.password ? "border-destructive" : ""} />
          </Field>
          <Field label="Confirmar senha *" error={errors.confirm_password}>
            <Input type="password" value={form.confirm_password} onChange={(e) => setForm({ ...form, confirm_password: e.target.value })} className={errors.confirm_password ? "border-destructive" : ""} />
          </Field>
          <div className="sm:col-span-2 text-sm text-muted-foreground bg-muted/50 rounded-md p-3">
            O usuário poderá fazer login imediatamente com o e-mail e a senha definidos.
            No primeiro acesso, será obrigado a trocar a senha.
          </div>
        </>
      )}
    </div>
  );

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
    if (!form.email.trim()) e.email = "Preencha este campo.";
    else if (!validateEmail(form.email)) e.email = "Email inválido.";
    if (!form.access_profile) e.access_profile = "Preencha este campo.";
    if (!editingId) {
      if (!form.password || form.password.length < 8) e.password = "Mínimo de 8 caracteres.";
      if (!form.confirm_password) e.confirm_password = "Preencha este campo.";
      if (form.password && form.confirm_password && form.password !== form.confirm_password)
        e.confirm_password = "As senhas não coincidem.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);

    if (editingId) {
      // Update registry fields
      const { error } = await supabase
        .from("users_registry")
        .update({
          full_name: form.full_name.trim(),
          access_profile: form.access_profile,
          status: form.status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingId);
      if (error) { toast({ variant: "destructive", title: "Erro ao salvar.", description: error.message }); setSaving(false); return; }

      // Sync role if user_id available
      const target = data.find((u) => u.id === editingId);
      if (target?.user_id) {
        await supabase.from("user_roles").delete().eq("user_id", target.user_id);
        await supabase.from("user_roles").insert({
          user_id: target.user_id,
          role: form.access_profile as "analista" | "supervisor",
        });
      }
      toast({ title: "Usuário atualizado com sucesso." });
    } else {
      const { data: resp, error } = await supabase.functions.invoke("admin-create-user", {
        body: {
          full_name: form.full_name.trim(),
          email: form.email.trim(),
          password: form.password,
          access_profile: form.access_profile,
        },
      });
      const errMsg = (resp as { error?: string } | null)?.error;
      if (error || errMsg) {
        toast({ variant: "destructive", title: "Erro ao criar usuário", description: errMsg ?? error?.message });
        setSaving(false);
        return;
      }
      toast({
        title: "Usuário criado com sucesso.",
        description: "Ele poderá logar com o e-mail e a senha informados.",
      });
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
      email: item.email,
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
    const { data: resp, error } = await supabase.functions.invoke("admin-delete-user", {
      body: deleteItem.user_id
        ? { user_id: deleteItem.user_id }
        : { registry_id: deleteItem.id },
    });
    const errMsg = (resp as { error?: string } | null)?.error;
    if (error || errMsg) {
      toast({
        variant: "destructive",
        title: "Erro ao excluir usuário",
        description: errMsg ?? error?.message,
      });
      setSaving(false);
      return;
    }
    toast({ title: "Usuário excluído com sucesso." });
    setSaving(false);
    setDeleteOpen(false);
    setDeleteItem(null);
    fetchData();
  };

  const columns: Column<UserRecord>[] = [
    { key: "full_name", label: "Nome" },
    { key: "email", label: "Email", hideOnMobile: true },
    { key: "access_profile", label: "Perfil", render: (i) => profileOptions.find(p => p.value === i.access_profile)?.label || i.access_profile },
    { key: "status", label: "Status", render: (i) => <Badge variant={i.status === "ativo" ? "default" : "secondary"}>{i.status === "ativo" ? "Ativo" : "Inativo"}</Badge> },
  ];

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
        {editingId ? (
          <Tabs value={formTab} onValueChange={setFormTab}>
            <TabsList className="w-full sm:w-auto">
              <TabsTrigger value="dados" className="flex-1 sm:flex-none">Dados</TabsTrigger>
              <TabsTrigger value="seguranca" className="flex-1 sm:flex-none">Segurança</TabsTrigger>
            </TabsList>
            <TabsContent value="dados" className="mt-4">
              {fields}
            </TabsContent>
            <TabsContent value="seguranca" className="mt-4">
              {editingUser?.user_id ? (
                <ResetPasswordSection userId={editingUser.user_id} userName={editingUser.full_name} />
              ) : (
                <div className="text-sm text-muted-foreground bg-muted/50 rounded-md p-3">
                  Este cadastro ainda não possui acesso vinculado à autenticação, então não é possível redefinir a senha.
                </div>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          fields
        )}
      </FormSheet>


      <DeleteDialog open={deleteOpen} onOpenChange={setDeleteOpen} onConfirm={handleDelete} itemName={deleteItem?.full_name} loading={saving} />
    </CrudLayout>
  );
};

export default Users;

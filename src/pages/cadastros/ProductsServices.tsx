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
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/validators";

interface ProductRecord {
  id: string;
  type: string;
  name: string;
  description: string | null;
  category: string | null;
  price: number;
  status: string;
}

const typeOptions = [
  { value: "produto", label: "Produto" },
  { value: "serviço", label: "Serviço" },
];

const statusOptions = [
  { value: "ativo", label: "Ativo" },
  { value: "inativo", label: "Inativo" },
];

const categoryOptions = [
  { value: "garantia", label: "Garantia" },
  { value: "seguro", label: "Seguro" },
  { value: "consultoria", label: "Consultoria" },
  { value: "outros", label: "Outros" },
];

const emptyForm = {
  type: "produto", name: "", description: "", category: "", price: "", status: "ativo",
};

const ProductsServices = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [data, setData] = useState<ProductRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteItem, setDeleteItem] = useState<ProductRecord | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { if (!session) navigate("/login"); });
  }, [navigate]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: rows } = await supabase.from("products_services").select("*").order("created_at", { ascending: false });
    setData((rows as ProductRecord[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = data.filter((item) => {
    const q = search.toLowerCase();
    return item.name.toLowerCase().includes(q) || item.type.toLowerCase().includes(q) || (item.category || "").toLowerCase().includes(q);
  });

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.type) e.type = "Preencha este campo.";
    if (!form.name.trim()) e.name = "Preencha este campo.";
    if (!form.price) e.price = "Preencha este campo.";
    else if (isNaN(Number(form.price)) || Number(form.price) <= 0) e.price = "Informe um valor positivo.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);

    const { data: existing } = await supabase
      .from("products_services").select("id").eq("name", form.name.trim())
      .neq("id", editingId || "00000000-0000-0000-0000-000000000000").limit(1);
    if (existing && existing.length > 0) {
      setErrors(p => ({ ...p, name: "Este nome já está cadastrado." }));
      setSaving(false);
      return;
    }

    const payload = {
      type: form.type, name: form.name.trim(), description: form.description.trim() || null,
      category: form.category || null, price: Number(form.price), status: form.status,
      updated_at: new Date().toISOString(),
    };

    if (editingId) {
      const { error } = await supabase.from("products_services").update(payload).eq("id", editingId);
      if (error) { toast({ variant: "destructive", title: "Erro ao salvar." }); setSaving(false); return; }
      toast({ title: "Registro atualizado com sucesso." });
    } else {
      const { error } = await supabase.from("products_services").insert(payload);
      if (error) { toast({ variant: "destructive", title: "Erro ao salvar." }); setSaving(false); return; }
      toast({ title: "Registro cadastrado com sucesso." });
    }

    setSaving(false); setFormOpen(false); setForm(emptyForm); setEditingId(null); setErrors({}); fetchData();
  };

  const handleEdit = (item: ProductRecord) => {
    setEditingId(item.id);
    setForm({
      type: item.type, name: item.name, description: item.description || "",
      category: item.category || "", price: String(item.price), status: item.status,
    });
    setErrors({});
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    setSaving(true);
    await supabase.from("products_services").delete().eq("id", deleteItem.id);
    toast({ title: "Registro excluído com sucesso." });
    setSaving(false); setDeleteOpen(false); setDeleteItem(null); fetchData();
  };

  const columns: Column<ProductRecord>[] = [
    { key: "type", label: "Tipo", render: (i) => <Badge variant="outline">{i.type === "produto" ? "Produto" : "Serviço"}</Badge> },
    { key: "name", label: "Nome" },
    { key: "category", label: "Categoria", hideOnMobile: true, render: (i) => categoryOptions.find(c => c.value === i.category)?.label || i.category || "—" },
    { key: "price", label: "Valor", render: (i) => formatCurrency(Number(i.price)) },
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
    <CrudLayout title="Produtos e Serviços" searchValue={search} onSearchChange={setSearch} onNewClick={() => { setEditingId(null); setForm(emptyForm); setErrors({}); setFormOpen(true); }} newLabel="Novo registro">
      <DataTable columns={columns} data={filtered} onEdit={handleEdit} onDelete={(item) => { setDeleteItem(item); setDeleteOpen(true); }} loading={loading} isFiltered={search.length > 0} emptyMessage="Nenhum produto ou serviço cadastrado." />

      <FormSheet open={formOpen} onOpenChange={setFormOpen} title={editingId ? "Editar registro" : "Novo registro"} onSubmit={handleSubmit} loading={saving}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Tipo *" error={errors.type}>
            <SearchableSelect options={typeOptions} value={form.type} onChange={(v) => setForm({ ...form, type: v })} placeholder="Selecione..." />
          </Field>
          <Field label="Nome *" error={errors.name}>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={errors.name ? "border-destructive" : ""} />
          </Field>
          <Field label="Categoria">
            <SearchableSelect options={categoryOptions} value={form.category} onChange={(v) => setForm({ ...form, category: v })} placeholder="Selecione..." />
          </Field>
          <Field label="Valor *" error={errors.price}>
            <Input type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className={errors.price ? "border-destructive" : ""} placeholder="0,00" />
          </Field>
          <Field label="Status *">
            <SearchableSelect options={statusOptions} value={form.status} onChange={(v) => setForm({ ...form, status: v })} placeholder="Selecione..." />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Descrição">
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            </Field>
          </div>
        </div>
      </FormSheet>

      <DeleteDialog open={deleteOpen} onOpenChange={setDeleteOpen} onConfirm={handleDelete} itemName={deleteItem?.name} loading={saving} />
    </CrudLayout>
  );
};

export default ProductsServices;

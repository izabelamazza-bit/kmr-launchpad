import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import CrudLayout from "@/components/crud/CrudLayout";
import DataTable, { Column } from "@/components/crud/DataTable";
import DeleteDialog from "@/components/crud/DeleteDialog";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Lead {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  interest: string | null;
  qualification_notes: string | null;
  scheduled_at: string | null;
  status: string;
  conversation_history: unknown;
  created_at: string;
  updated_at: string;
}

const statusColors: Record<string, string> = {
  novo: "bg-blue-100 text-blue-800",
  qualificado: "bg-yellow-100 text-yellow-800",
  agendado: "bg-green-100 text-green-800",
  descartado: "bg-red-100 text-red-800",
};

const Leads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filtered, setFiltered] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteItem, setDeleteItem] = useState<Lead | null>(null);
  const [viewItem, setViewItem] = useState<Lead | null>(null);
  const { toast } = useToast();

  const fetchLeads = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      setLeads((data as Lead[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      leads.filter(
        (l) =>
          (l.name || "").toLowerCase().includes(q) ||
          (l.email || "").toLowerCase().includes(q) ||
          (l.company || "").toLowerCase().includes(q)
      )
    );
  }, [search, leads]);

  const handleDelete = async () => {
    if (!deleteItem) return;
    const { error } = await supabase.from("leads").delete().eq("id", deleteItem.id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Lead excluído com sucesso" });
      fetchLeads();
    }
    setDeleteItem(null);
  };

  const columns: Column<Lead>[] = [
    { key: "name", label: "Nome", render: (l) => l.name || "—" },
    { key: "email", label: "Email", render: (l) => l.email || "—", hideOnMobile: true },
    { key: "phone", label: "Telefone", render: (l) => l.phone || "—", hideOnMobile: true },
    { key: "company", label: "Empresa", render: (l) => l.company || "—", hideOnMobile: true },
    {
      key: "status",
      label: "Status",
      render: (l) => (
        <Badge className={statusColors[l.status] || ""}>{l.status}</Badge>
      ),
    },
    {
      key: "scheduled_at",
      label: "Agendamento",
      render: (l) =>
        l.scheduled_at
          ? new Date(l.scheduled_at).toLocaleString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "—",
    },
  ];

  return (
    <CrudLayout
      title="Leads"
      searchValue={search}
      onSearchChange={setSearch}
      onNewClick={() => {}}
      newLabel=""
    >
      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        isFiltered={search.length > 0}
        emptyMessage="Nenhum lead registrado ainda."
        noResultsMessage="Nenhum lead encontrado para a busca."
        onEdit={(item) => setViewItem(item)}
        onDelete={(item) => setDeleteItem(item)}
      />

      <DeleteDialog
        open={!!deleteItem}
        onOpenChange={(o) => !o && setDeleteItem(null)}
        onConfirm={handleDelete}
        itemName={deleteItem?.name || "este lead"}
      />

      {/* View conversation dialog */}
      <Dialog open={!!viewItem} onOpenChange={(o) => !o && setViewItem(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Lead</DialogTitle>
          </DialogHeader>
          {viewItem && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground">Nome:</span> {viewItem.name || "—"}</div>
                <div><span className="text-muted-foreground">Email:</span> {viewItem.email || "—"}</div>
                <div><span className="text-muted-foreground">Telefone:</span> {viewItem.phone || "—"}</div>
                <div><span className="text-muted-foreground">Empresa:</span> {viewItem.company || "—"}</div>
                <div className="col-span-2"><span className="text-muted-foreground">Interesse:</span> {viewItem.interest || "—"}</div>
                <div className="col-span-2"><span className="text-muted-foreground">Qualificação:</span> {viewItem.qualification_notes || "—"}</div>
              </div>

              {Array.isArray(viewItem.conversation_history) && viewItem.conversation_history.length > 0 && (
                <div>
                  <p className="font-medium mb-2">Histórico da conversa</p>
                  <div className="space-y-2 bg-muted/50 rounded-lg p-3 max-h-64 overflow-y-auto">
                    {(viewItem.conversation_history as Array<{ role: string; content: string }>).map((msg, i) => (
                      <div key={i} className={`text-xs ${msg.role === "user" ? "text-right" : "text-left"}`}>
                        <span className="font-medium text-muted-foreground">
                          {msg.role === "user" ? "Visitante" : "Agente"}:
                        </span>{" "}
                        {msg.content}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </CrudLayout>
  );
};

export default Leads;

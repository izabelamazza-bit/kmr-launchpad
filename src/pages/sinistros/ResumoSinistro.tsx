import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import { ArrowLeft, LogOut, FileText, Plus, CheckCircle2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/validators";
import logoKMR from "@/assets/Logo_KMR.png";

interface Sinistro {
  id: string;
  inquilino_nome: string;
  inquilino_cpf: string;
  codigo_contrato: string;
  status_imovel: string;
  motivo_desocupacao: string | null;
  data_entrega_chaves: string | null;
  observacoes: string | null;
  status: string;
}

interface Debito {
  id: string;
  tipo: string;
  descricao: string | null;
  data_vencimento: string;
  valor: number;
  boleto_path: string | null;
}

interface Anexo {
  id: string;
  nome: string;
  tipo: string | null;
  file_path: string;
}

const ResumoSinistro = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [sinistro, setSinistro] = useState<Sinistro | null>(null);
  const [debitos, setDebitos] = useState<Debito[]>([]);
  const [anexos, setAnexos] = useState<Anexo[]>([]);
  const [observacoes, setObservacoes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/login");
    });
  }, [navigate]);

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    const [{ data: s }, { data: d }, { data: a }] = await Promise.all([
      supabase.from("sinistros").select("*").eq("id", id).maybeSingle(),
      supabase.from("sinistro_debitos").select("*").eq("sinistro_id", id).order("created_at"),
      supabase.from("sinistro_anexos").select("*").eq("sinistro_id", id).order("created_at"),
    ]);
    if (s) {
      setSinistro(s as Sinistro);
      setObservacoes(s.observacoes ?? "");
    }
    setDebitos((d ?? []) as Debito[]);
    setAnexos((a ?? []) as Anexo[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const total = debitos.reduce((sum, d) => sum + Number(d.valor), 0);

  const downloadFile = async (path: string) => {
    const { data, error } = await supabase.storage
      .from("sinistros")
      .createSignedUrl(path, 60);
    if (error || !data) {
      toast({ title: "Erro ao gerar link do arquivo", variant: "destructive" });
      return;
    }
    window.open(data.signedUrl, "_blank");
  };

  const saveObservacoes = async () => {
    if (!sinistro) return;
    await supabase.from("sinistros").update({ observacoes }).eq("id", sinistro.id);
  };

  const abrirSinistro = async () => {
    if (!sinistro) return;
    setSaving(true);
    const { error } = await supabase
      .from("sinistros")
      .update({ status: "em_analise", observacoes })
      .eq("id", sinistro.id);
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao abrir sinistro", variant: "destructive" });
      return;
    }
    toast({ title: "Sinistro aberto com sucesso" });
    navigate("/sinistros");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/40">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!sinistro) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/40">
        <p className="text-muted-foreground">Sinistro não encontrado.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="bg-card border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/sinistros")}
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">
              Resumo do sinistro
            </h1>
            <p className="text-muted-foreground mt-1">
              Confira todos os dados antes de abrir o sinistro.
            </p>
          </div>
          <Badge variant="secondary" className="capitalize">
            {sinistro.status === "rascunho" || sinistro.status === "aberto"
              ? "Em análise"
              : sinistro.status === "em_analise"
                ? "Em análise"
                : sinistro.status === "pagamento"
                  ? "Em pagamento"
                  : sinistro.status}
          </Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Dados cadastrados</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 text-sm">
            <div>
              <p className="text-muted-foreground">Inquilino</p>
              <p className="font-medium">{sinistro.inquilino_nome}</p>
            </div>
            <div>
              <p className="text-muted-foreground">CPF</p>
              <p className="font-medium">{sinistro.inquilino_cpf}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Código do contrato</p>
              <p className="font-medium">{sinistro.codigo_contrato}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Status do imóvel</p>
              <p className="font-medium capitalize">{sinistro.status_imovel}</p>
            </div>
            {sinistro.status_imovel === "desocupado" && (
              <>
                <div className="sm:col-span-2">
                  <p className="text-muted-foreground">Motivo da desocupação</p>
                  <p className="font-medium">{sinistro.motivo_desocupacao || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Entrega das chaves</p>
                  <p className="font-medium">
                    {sinistro.data_entrega_chaves
                      ? format(new Date(sinistro.data_entrega_chaves + "T00:00:00"), "dd/MM/yyyy")
                      : "—"}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Débitos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground border-b">
                  <tr>
                    <th className="py-2">Tipo</th>
                    <th className="py-2">Descrição</th>
                    <th className="py-2">Vencimento</th>
                    <th className="py-2 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {debitos.map((d) => (
                    <tr key={d.id} className="border-b last:border-0">
                      <td className="py-2 capitalize">{d.tipo}</td>
                      <td className="py-2">{d.descricao || "—"}</td>
                      <td className="py-2">
                        {format(new Date(d.data_vencimento + "T00:00:00"), "dd/MM/yyyy")}
                      </td>
                      <td className="py-2 text-right font-medium">
                        {formatCurrency(Number(d.valor))}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} className="pt-3 text-right font-semibold">
                      Total consolidado
                    </td>
                    <td className="pt-3 text-right text-lg font-bold text-primary">
                      {formatCurrency(total)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Arquivos anexados</CardTitle>
          </CardHeader>
          <CardContent>
            {debitos.filter((d) => d.boleto_path).length === 0 && anexos.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum arquivo anexado.</p>
            ) : (
              <ul className="space-y-2">
                {debitos
                  .filter((d) => d.boleto_path)
                  .map((d) => (
                    <li key={d.id} className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary shrink-0" />
                      <button
                        className="text-sm text-primary hover:underline truncate"
                        onClick={() => d.boleto_path && downloadFile(d.boleto_path)}
                      >
                        Boleto — {d.descricao || d.tipo}
                      </button>
                    </li>
                  ))}
                {anexos.map((a) => (
                  <li key={a.id} className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary shrink-0" />
                    <button
                      className="text-sm text-primary hover:underline truncate"
                      onClick={() => downloadFile(a.file_path)}
                    >
                      {a.tipo ? `${a.tipo} — ${a.nome}` : a.nome}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <Label htmlFor="obs" className="sr-only">
              Observações
            </Label>
            <Textarea
              id="obs"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              onBlur={saveObservacoes}
              rows={4}
              placeholder="Adicione informações relevantes sobre o sinistro..."
            />
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-3 justify-between">
          <Button
            variant="outline"
            onClick={() => navigate(`/novo-sinistro?sinistro=${sinistro.id}`)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar mais inadimplências
          </Button>
          <Button onClick={abrirSinistro} disabled={saving} className="min-h-[44px]">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            {saving ? "Abrindo..." : "Abrir sinistro"}
          </Button>
        </div>
      </main>
    </div>
  );
};

export default ResumoSinistro;
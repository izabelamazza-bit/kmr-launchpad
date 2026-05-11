import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, LogOut } from "lucide-react";
import logoKMR from "@/assets/Logo_KMR.png";

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

const formatDate = (iso: string | null) => {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

const formatBRL = (v: number) =>
  Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const Block = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-base">{title}</CardTitle>
    </CardHeader>
    <CardContent className="space-y-2 text-sm">{children}</CardContent>
  </Card>
);

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex flex-col sm:flex-row sm:justify-between gap-1 py-1.5 border-b last:border-0">
    <span className="text-muted-foreground">{label}</span>
    <span className="text-foreground font-medium sm:text-right">{value}</span>
  </div>
);

const PessoaDetalhe = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contrato, setContrato] = useState<Contrato | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/login");
    });
  }, [navigate]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data } = await supabase.from("contratos_pessoas").select("*").eq("id", id).maybeSingle();
      setContrato(data as Contrato | null);
      setLoading(false);
    })();
  }, [id]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">Carregando...</div>
    );
  }

  if (!contrato) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Contrato não encontrado.</p>
        <Button onClick={() => navigate("/cadastros/pessoas")}>Voltar</Button>
      </div>
    );
  }

  const SituacaoBadge = () =>
    contrato.situacao === "saudavel" ? (
      <Badge className="bg-[#27AE60] hover:bg-[#27AE60]/90 text-white">Saudável</Badge>
    ) : (
      <Badge variant="destructive">Atrasado</Badge>
    );

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="bg-card border-b shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/cadastros/pessoas")} className="shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <img src={logoKMR} alt="KMR" className="h-8 w-auto hidden sm:block" />
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-1" /> Sair
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <Button variant="ghost" onClick={() => navigate("/cadastros/pessoas")} className="mb-4 -ml-2">
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar para lista
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Block title="Identificação">
            <Row label="Código do contrato" value={<span className="font-mono">{contrato.codigo}</span>} />
            <Row label="Nome do locatário" value={contrato.nome} />
            <Row label="Situação" value={<SituacaoBadge />} />
          </Block>

          <Block title="Contato">
            <Row label="Telefone 1" value={contrato.telefone1} />
            {contrato.telefone2 && <Row label="Telefone 2" value={contrato.telefone2} />}
            <Row label="E-mail" value={<span className="break-all">{contrato.email}</span>} />
          </Block>

          <Block title="Contrato">
            <Row label="Data de início" value={formatDate(contrato.data_inicio)} />
            <Row label="Data de fim" value={formatDate(contrato.data_fim)} />
            <Row label="Vencimento do aluguel" value={`Todo dia ${contrato.dia_vencimento}`} />
            <Row label="Próximo reajuste" value={formatDate(contrato.proximo_reajuste)} />
            <Row
              label="Aviso de desocupação"
              value={
                contrato.aviso_desocupacao
                  ? `Sim — ${formatDate(contrato.data_aviso_desocupacao)}`
                  : "Não"
              }
            />
          </Block>

          <Block title="Imóvel">
            <Row label="Endereço completo" value={contrato.endereco} />
            <Row label="Valor do aluguel" value={<span className="text-[#27AE60] font-semibold">{formatBRL(contrato.valor_aluguel)}</span>} />
          </Block>
        </div>
      </main>
    </div>
  );
};

export default PessoaDetalhe;

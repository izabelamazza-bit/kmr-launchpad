import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import logoKMR from "@/assets/Logo_KMR.png";
import { ArrowLeft, KeyRound, ShieldCheck, ShieldAlert, MessageSquare } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const Configuracoes = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(false);
  const [masked, setMasked] = useState<string | null>(null);

  const loadStatus = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("anthropic-key-status");
    if (error) {
      toast({ title: "Erro ao consultar status", description: error.message, variant: "destructive" });
    } else {
      setConfigured(!!data?.configured);
      setMasked(data?.masked ?? null);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="bg-card border-b shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
            </Button>
            <img src={logoKMR} alt="KMR" className="h-7 w-auto" />
          </div>
          <span className="text-sm text-muted-foreground">Configurações</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div>
          <h1 className="text-3xl font-semibold text-foreground mb-2">Configurações</h1>
          <p className="text-muted-foreground">Gerencie integrações e chaves de IA usadas pelo sistema.</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 rounded-md p-2">
                <KeyRound className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-xl">Integrações de IA</CardTitle>
                <CardDescription>
                  Chaves usadas para leitura automática de contratos PDF na Auditoria.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="font-medium text-foreground">Chave da API Anthropic (ANTHROPIC_API_KEY)</p>
                <p className="text-sm text-muted-foreground">
                  Usada pela função <code>extract-contract</code> para ler PDFs com Claude.
                </p>
                <div className="mt-2 flex items-center gap-2">
                  {loading ? (
                    <span className="text-sm text-muted-foreground">Verificando...</span>
                  ) : configured ? (
                    <>
                      <Badge className="bg-[#27AE60] hover:bg-[#27AE60]/90">
                        <ShieldCheck className="h-3 w-3 mr-1" /> Ativa
                      </Badge>
                      <code className="text-sm bg-muted px-2 py-0.5 rounded">{masked}</code>
                    </>
                  ) : (
                    <Badge variant="secondary">
                      <ShieldAlert className="h-3 w-3 mr-1" /> Não configurada
                    </Badge>
                  )}
                </div>
              </div>
              <Button variant="outline" onClick={loadStatus} disabled={loading}>
                Atualizar status
              </Button>
            </div>

            {!configured && !loading && (
              <Alert>
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle>Leitura automática de PDF desativada</AlertTitle>
                <AlertDescription>
                  Enquanto a chave não estiver configurada, a Seção B dos contratos
                  precisa ser preenchida manualmente.
                </AlertDescription>
              </Alert>
            )}

            <Alert>
              <MessageSquare className="h-4 w-4" />
              <AlertTitle>Como configurar ou substituir a chave</AlertTitle>
              <AlertDescription className="space-y-2">
                <p>
                  Por segurança, a gravação da chave acontece em um formulário
                  criptografado do Lovable — ela nunca passa pelo navegador.
                </p>
                <p>
                  No chat do Lovable, envie:{" "}
                  <strong>"quero {configured ? "substituir" : "configurar"} a chave da Anthropic"</strong>.
                  Um formulário seguro abrirá para você colar o valor. Depois de salvar,
                  clique em <em>Atualizar status</em> nesta tela.
                </p>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Configuracoes;
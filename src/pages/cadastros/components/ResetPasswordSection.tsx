import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Check, Copy, KeyRound, Mail } from "lucide-react";

interface ResetPasswordSectionProps {
  userId: string;
  userName: string;
}

type Method = "show" | "email";

interface ResetResponse {
  success?: boolean;
  password?: string;
  warning?: string;
  error?: string;
}

const messageForStatus = (status: number | undefined, bodyError?: string) => {
  switch (status) {
    case 400:
      return bodyError || "Dados inválidos na solicitação. Recarregue a página e tente novamente.";
    case 401:
      return "Sua sessão expirou. Entre novamente para redefinir a senha.";
    case 404:
      return "Usuário não encontrado na autenticação. Verifique se o cadastro possui acesso ativo.";
    case 502:
      return bodyError || "Falha no serviço de autenticação ao atualizar a senha. Tente novamente em instantes.";
    default:
      return bodyError || "Não foi possível concluir a redefinição. Verifique sua conexão e tente novamente.";
  }
};

const ResetPasswordSection = ({ userId, userName }: ResetPasswordSectionProps) => {
  const { toast } = useToast();
  const [pending, setPending] = useState<Method | null>(null);
  const [password, setPassword] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const closeDialog = () => {
    setPassword(null);
    setWarning(null);
    setCopied(false);
  };

  const handleReset = async (method: Method) => {
    if (pending) return;
    setPending(method);
    try {
      const { data, error } = await supabase.functions.invoke<ResetResponse>(
        "admin-reset-user-password",
        { body: { userId, method } },
      );

      if (error) {
        let status: number | undefined;
        let bodyError: string | undefined;
        if (error instanceof FunctionsHttpError) {
          status = error.context?.status;
          try {
            const body = (await error.context.json()) as ResetResponse;
            bodyError = body?.error;
          } catch {
            // corpo não é JSON — mantém mensagem por status
          }
        }
        if (method === "email") {
          toast({
            variant: "destructive",
            title: "Envio por e-mail ainda não disponível",
            description:
              "Essa opção ainda não está ativa. Use \"Resetar e mostrar na tela\" e repasse a senha por um canal seguro.",
          });
          return;
        }
        toast({ variant: "destructive", title: "Erro ao redefinir senha", description: messageForStatus(status, bodyError) });
        return;
      }

      if (data?.error) {
        toast({ variant: "destructive", title: "Erro ao redefinir senha", description: data.error });
        return;
      }

      if (method === "email") {
        if (data?.success && !data?.password) {
          toast({
            variant: "destructive",
            title: "Envio por e-mail ainda não disponível",
            description: `A senha de ${userName} foi redefinida, mas o envio por e-mail ainda não está implementado. Use "Resetar e mostrar na tela" para repassá-la por um canal seguro.`,
          });
        }
        if (data?.warning) {
          toast({ variant: "destructive", title: "Atenção", description: data.warning });
        }
        return;
      }

      if (data?.success && data.password) {
        setPassword(data.password);
        setWarning(data.warning ?? null);
        setCopied(false);
      } else {
        toast({
          variant: "destructive",
          title: "Erro ao redefinir senha",
          description: "A função não retornou a senha temporária. Tente novamente.",
        });
      }
    } finally {
      setPending(null);
    }
  };

  const handleCopy = async () => {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ variant: "destructive", title: "Não foi possível copiar", description: "Selecione e copie manualmente." });
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <h3 className="text-base font-semibold flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-primary" />
          Redefinir senha
        </h3>
        <p className="text-sm text-muted-foreground">
          Gera uma nova senha temporária para o usuário. Escolha como repassá-la. O usuário deverá alterar a senha no
          próximo login.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          type="button"
          onClick={() => handleReset("show")}
          disabled={pending !== null}
          className="h-auto min-h-[44px] w-full whitespace-normal px-3 py-2 text-center leading-tight sm:flex-1"
        >
          <KeyRound className="h-4 w-4 shrink-0" />
          {pending === "show" ? "Gerando..." : "Resetar e mostrar na tela"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => handleReset("email")}
          disabled={pending !== null}
          className="h-auto min-h-[44px] w-full whitespace-normal px-3 py-2 text-center leading-tight sm:flex-1"
        >
          <Mail className="h-4 w-4 shrink-0" />
          {pending === "email" ? "Enviando..." : "Resetar e enviar por e-mail"}
        </Button>
      </div>

      <Dialog open={password !== null} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Senha temporária gerada</DialogTitle>
            <DialogDescription>{userName}</DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border-2 border-primary/30 bg-muted/60 p-4 text-center">
            <p className="font-mono text-2xl sm:text-3xl font-bold tracking-wider break-all">{password}</p>
          </div>

          <Button type="button" variant="secondary" onClick={handleCopy} className="min-h-[44px] w-full">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copiada" : "Copiar"}
          </Button>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Repasse esta senha ao usuário por um canal seguro. Ela não poderá ser recuperada depois de fechar esta
              tela.
            </AlertDescription>
          </Alert>

          {warning && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {warning} A senha foi alterada com sucesso, mas a marcação de troca obrigatória pode não ter sido
                salva — o usuário talvez não seja obrigado a criar uma nova senha no próximo login. Repita a ação se
                necessário.
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button type="button" onClick={closeDialog} className="min-h-[44px] w-full sm:w-auto">
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ResetPasswordSection;

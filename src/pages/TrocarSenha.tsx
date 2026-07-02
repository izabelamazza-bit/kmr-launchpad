import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { LogOut, CheckCircle2, Circle } from "lucide-react";
import logoKMR from "@/assets/Logo_KMR.png";

const TrocarSenha = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const rules = {
    length: password.length >= 8,
    letter: /[A-Za-z]/.test(password),
    number: /\d/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  };
  const strongEnough = rules.length && rules.letter && rules.number;

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) navigate("/login");
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast({ variant: "destructive", title: "A senha precisa ter no mínimo 8 caracteres." });
      return;
    }
    if (password !== confirm) {
      toast({ variant: "destructive", title: "As senhas não coincidem." });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({
      password,
      data: { must_change_password: false },
    });
    if (error) {
      const msg = (error.message || "").toLowerCase();
      let title = "Não foi possível atualizar a senha.";
      let description = error.message;
      if (
        msg.includes("pwned") ||
        msg.includes("weak") ||
        msg.includes("compromised") ||
        msg.includes("leaked") ||
        msg.includes("data breach") ||
        msg.includes("already been used")
      ) {
        title = "Escolha uma senha mais forte";
        description =
          "Esta senha aparece em vazamentos públicos conhecidos e não pode ser usada. Combine letras, números e símbolos, e evite senhas comuns como 'senha123' ou datas.";
      } else if (msg.includes("different from the old") || msg.includes("same as")) {
        title = "A nova senha precisa ser diferente";
        description = "Escolha uma senha diferente da atual.";
      }
      toast({ variant: "destructive", title, description });
      setLoading(false);
      return;
    }
    try {
      await supabase.rpc("clear_must_change_password" as never);
    } catch {
      // metadata já foi atualizado; RequirePasswordChange libera o acesso mesmo sem a RPC
    }
    toast({ title: "Senha atualizada com sucesso." });
    navigate("/dashboard", { replace: true });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <img src={logoKMR} alt="KMR" className="h-10 w-auto mx-auto" />
          <CardTitle>Defina sua nova senha</CardTitle>
          <p className="text-sm text-muted-foreground">
            Este é seu primeiro acesso. Por segurança, defina uma senha pessoal antes de continuar.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nova senha</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                minLength={8}
                required
              />
            </div>
            <ul className="text-xs space-y-1 pl-1">
              <Rule ok={rules.length}>Mínimo de 8 caracteres</Rule>
              <Rule ok={rules.letter}>Ao menos uma letra</Rule>
              <Rule ok={rules.number}>Ao menos um número</Rule>
              <Rule ok={rules.symbol}>Recomendado: um símbolo (!@#$…)</Rule>
              <li className="text-[11px] pt-1 text-muted-foreground">
                Evite senhas comuns (ex.: "senha123", "123456", datas). Elas são bloqueadas automaticamente.
              </li>
            </ul>
            <div className="space-y-1.5">
              <Label>Confirmar nova senha</Label>
              <Input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                minLength={8}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading || !strongEnough}>
              {loading ? "Salvando..." : "Salvar nova senha"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

const Rule = ({ ok, children }: { ok: boolean; children: React.ReactNode }) => (
  <li className="flex items-center gap-2">
    {ok ? (
      <CheckCircle2 className="h-3.5 w-3.5 text-[#27AE60]" />
    ) : (
      <Circle className="h-3.5 w-3.5 text-muted-foreground/60" />
    )}
    <span className={ok ? "text-foreground" : "text-muted-foreground"}>{children}</span>
  </li>
);

export default TrocarSenha;
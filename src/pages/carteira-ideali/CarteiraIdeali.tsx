import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, FileUp } from "lucide-react";
import { ImportIdealiModal } from "./components/ImportIdealiModal";

const CarteiraIdeali = () => {
  const navigate = useNavigate();
  const [importOpen, setImportOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/login");
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="bg-card border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Carteira Ideali</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardContent className="p-6 space-y-4">
            <div>
              <h2 className="text-base font-semibold">Importar carteira Ideali</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Envie a planilha .xlsx com as abas "Contratos" e "Histórico faturas". Você verá um
                resumo antes de qualquer gravação no banco.
              </p>
            </div>
            <Button onClick={() => setImportOpen(true)}>
              <FileUp className="h-4 w-4 mr-2" />
              Importar carteira Ideali
            </Button>
          </CardContent>
        </Card>
      </main>

      <ImportIdealiModal open={importOpen} onOpenChange={setImportOpen} />
    </div>
  );
};

export default CarteiraIdeali;
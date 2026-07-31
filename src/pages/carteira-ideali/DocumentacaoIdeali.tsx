import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileUp } from "lucide-react";
import { ImportDocumentosModal } from "./components/ImportDocumentosModal";
import { DocumentacaoSection } from "./components/DocumentacaoSection";
import { useDocumentosIdeali, type FilaRecord } from "./lib/useDocumentosIdeali";

const DocumentacaoIdeali = () => {
  const navigate = useNavigate();
  const [importDocsOpen, setImportDocsOpen] = useState(false);
  const { documentos, fila, loading, reload, setFila } = useDocumentosIdeali();

  const handleFilaChange = (row: FilaRecord) =>
    setFila((prev) => prev.map((f) => (f.id === row.id ? row : f)));

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/login");
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-muted/40">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <h1 className="text-2xl font-semibold">Documentação Ideali</h1>
        <Card>
          <CardContent className="p-6 space-y-4">
            <div>
              <h2 className="text-base font-semibold">Importar auditoria de documentos</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Envie a planilha com as abas "Cruzamento Completo" e "Fila do Analista". O trabalho
                manual já registrado pelo analista é preservado na reimportação.
              </p>
            </div>
            <Button variant="outline" onClick={() => setImportDocsOpen(true)}>
              <FileUp className="h-4 w-4 mr-2" />
              Importar auditoria de documentos
            </Button>
          </CardContent>
        </Card>

        <DocumentacaoSection
          documentos={documentos}
          fila={fila}
          loading={loading}
          onFilaChange={handleFilaChange}
        />
      </main>

      <ImportDocumentosModal
        open={importDocsOpen}
        onOpenChange={setImportDocsOpen}
        onDone={reload}
      />
    </div>
  );
};

export default DocumentacaoIdeali;

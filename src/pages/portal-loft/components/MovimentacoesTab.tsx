import { fmtDateTime } from "../lib/usePortalLoft";
import { autorNota, dataNota, type CaseNote } from "../lib/useCaseNotes";

interface Props {
  rows: CaseNote[];
  loading: boolean;
  error: string | null;
}

export function MovimentacoesTab({ rows, loading, error }: Props) {
  if (loading) return <p className="text-sm text-muted-foreground py-8">Carregando movimentações...</p>;
  if (error) return <p className="text-sm text-destructive py-8">{error}</p>;
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground py-8">Sem movimentações registradas.</p>;
  }

  const ordenadas = [...rows].sort((a, b) => {
    const da = dataNota(a) ?? "";
    const db = dataNota(b) ?? "";
    return new Date(db).getTime() - new Date(da).getTime();
  });

  return (
    <ol className="mt-6 space-y-5 border-l pl-6">
      {ordenadas.map((n) => (
        <li key={n.id} className="relative">
          <span className="absolute -left-[31px] top-1.5 h-2.5 w-2.5 rounded-full bg-[#2F80ED]" />
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium">{fmtDateTime(dataNota(n))}</p>
            <span className="text-xs text-muted-foreground">{autorNota(n)}</span>
          </div>
          <p className="mt-1 text-sm whitespace-pre-wrap">{n.descricao?.trim() || "—"}</p>
        </li>
      ))}
    </ol>
  );
}

export default MovimentacoesTab;

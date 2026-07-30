import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { fmtDate, fmtMoney, type Snapshot } from "../lib/usePortalLoft";

const ALL = "__all__";

const digits = (v: string) => v.replace(/\D/g, "");

function uniq(values: (string | null)[]): string[] {
  return Array.from(new Set(values.map((v) => (v ?? "").trim()).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, "pt-BR"),
  );
}

interface Props {
  snapshots: Snapshot[];
  onSelect: (contrato: string) => void;
}

export function ContratosTable({ snapshots, onSelect }: Props) {
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState(ALL);
  const [plano, setPlano] = useState(ALL);
  const [corretor, setCorretor] = useState(ALL);

  const statusOpts = useMemo(() => uniq(snapshots.map((s) => s.status)), [snapshots]);
  const planoOpts = useMemo(() => uniq(snapshots.map((s) => s.plano)), [snapshots]);
  const corretorOpts = useMemo(() => uniq(snapshots.map((s) => s.corretor)), [snapshots]);

  const rows = useMemo(() => {
    const q = busca.trim().toLowerCase();
    const qd = digits(busca);
    return snapshots.filter((s) => {
      if (status !== ALL && (s.status ?? "").trim() !== status) return false;
      if (plano !== ALL && (s.plano ?? "").trim() !== plano) return false;
      if (corretor !== ALL && (s.corretor ?? "").trim() !== corretor) return false;
      if (!q) return true;
      const byText =
        s.contrato.toLowerCase().includes(q) || (s.inquilino ?? "").toLowerCase().includes(q);
      const byCpf = qd.length > 0 && digits(s.inquilino_cpf ?? "").includes(qd);
      return byText || byCpf;
    });
  }, [snapshots, busca, status, plano, corretor]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Contratos da importação atual
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            {rows.length} de {snapshots.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar contrato, inquilino ou CPF"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
          <FilterSelect label="Status" value={status} onChange={setStatus} options={statusOpts} />
          <FilterSelect label="Plano" value={plano} onChange={setPlano} options={planoOpts} />
          <FilterSelect label="Corretor" value={corretor} onChange={setCorretor} options={corretorOpts} />
        </div>

        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Nenhum contrato encontrado com os filtros atuais.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contrato</TableHead>
                  <TableHead>Inquilino</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aluguel</TableHead>
                  <TableHead>Corretor</TableHead>
                  <TableHead>Ativação</TableHead>
                  <TableHead>Exoneração</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((s) => (
                  <TableRow
                    key={s.id}
                    className="cursor-pointer"
                    onClick={() => onSelect(s.contrato)}
                  >
                    <TableCell className="font-medium">{s.contrato}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{s.inquilino ?? "—"}</TableCell>
                    <TableCell>{s.inquilino_cpf ?? "—"}</TableCell>
                    <TableCell>{s.plano ?? "—"}</TableCell>
                    <TableCell><StatusBadge status={s.status} /></TableCell>
                    <TableCell className="text-right">{fmtMoney(s.valor_aluguel)}</TableCell>
                    <TableCell className="max-w-[160px] truncate">{s.corretor ?? "—"}</TableCell>
                    <TableCell>{fmtDate(s.data_ativacao)}</TableCell>
                    <TableCell>{fmtDate(s.data_exoneracao)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{label}: todos</SelectItem>
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default ContratosTable;
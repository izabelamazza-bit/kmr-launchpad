import { ReactNode } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

export interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => ReactNode;
  hideOnMobile?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onEdit: (item: T) => void;
  onDelete: (item: T) => void;
  loading?: boolean;
  emptyMessage?: string;
  noResultsMessage?: string;
  isFiltered?: boolean;
  getItemName?: (item: T) => string;
  onRowClick?: (item: T) => void;
}

function DataTable<T extends { id: string }>({
  columns,
  data,
  onEdit,
  onDelete,
  loading = false,
  emptyMessage = "Nenhum registro cadastrado.",
  noResultsMessage = "Nenhum resultado encontrado para a busca.",
  isFiltered = false,
  getItemName,
  onRowClick,
}: DataTableProps<T>) {
  const isMobile = useIsMobile();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 bg-card rounded-lg border">
        <p className="text-muted-foreground text-sm">
          {isFiltered ? noResultsMessage : emptyMessage}
        </p>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="space-y-3">
        {data.map((item) => (
          <div
            key={item.id}
            onClick={onRowClick ? () => onRowClick(item) : undefined}
            className={`bg-card rounded-lg border shadow-sm p-4 space-y-2 ${onRowClick ? "cursor-pointer hover:bg-accent/40" : ""}`}
          >
            {columns.map((col) => {
              const value = col.render ? col.render(item) : (item as any)[col.key];
              return (
                <div key={col.key} className="flex justify-between items-start text-sm">
                  <span className="text-muted-foreground font-medium">{col.label}</span>
                  <span className="text-foreground text-right max-w-[60%]">{value ?? "—"}</span>
                </div>
              );
            })}
            <div className="flex gap-2 pt-2 border-t">
              <Button variant="outline" size="sm" className="flex-1 min-h-[44px]" onClick={(e) => { e.stopPropagation(); onEdit(item); }}>
                <Pencil className="h-4 w-4 mr-1" /> Editar
              </Button>
              <Button variant="outline" size="sm" className="flex-1 min-h-[44px] text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(item); }}>
                <Trash2 className="h-4 w-4 mr-1" /> Excluir
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.filter(c => !c.hideOnMobile).map((col) => (
              <TableHead key={col.key}>{col.label}</TableHead>
            ))}
            <TableHead className="w-[100px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow
              key={item.id}
              onClick={onRowClick ? () => onRowClick(item) : undefined}
              className={onRowClick ? "cursor-pointer" : undefined}
            >
              {columns.filter(c => !c.hideOnMobile).map((col) => (
                <TableCell key={col.key}>
                  {col.render ? col.render(item) : (item as any)[col.key] ?? "—"}
                </TableCell>
              ))}
              <TableCell>
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" onClick={() => onEdit(item)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => onDelete(item)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default DataTable;

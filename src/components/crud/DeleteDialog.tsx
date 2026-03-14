import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  itemName?: string;
  loading?: boolean;
}

const DeleteDialog = ({ open, onOpenChange, onConfirm, itemName, loading }: DeleteDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            {itemName
              ? `Deseja realmente excluir "${itemName}"? Esta ação não pode ser desfeita.`
              : "Deseja realmente excluir este registro? Esta ação não pode ser desfeita."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading} className="min-h-[44px]">Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={loading} className="min-h-[44px] bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {loading ? "Excluindo..." : "Excluir"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteDialog;

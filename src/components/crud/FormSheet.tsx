import { ReactNode } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

interface FormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  onSubmit: () => void;
  loading?: boolean;
  children: ReactNode;
}

const FormSheet = ({ open, onOpenChange, title, description, onSubmit, loading, children }: FormSheetProps) => {
  const isMobile = useIsMobile();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={isMobile ? "bottom" : "right"} className={isMobile ? "h-[90vh] overflow-y-auto" : "sm:max-w-lg overflow-y-auto"}>
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        <div className="py-4 space-y-4">{children}</div>
        <SheetFooter className="flex-col sm:flex-row gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading} className="min-h-[44px] w-full sm:w-auto">
            Cancelar
          </Button>
          <Button onClick={onSubmit} disabled={loading} className="min-h-[44px] w-full sm:w-auto">
            {loading ? "Salvando..." : "Salvar"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default FormSheet;

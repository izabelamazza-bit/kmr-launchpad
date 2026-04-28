import * as React from "react";
import { Upload, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FileUploadFieldProps {
  value: File | null;
  onChange: (file: File | null) => void;
  label?: string;
  accept?: string;
  className?: string;
}

export const FileUploadField: React.FC<FileUploadFieldProps> = ({
  value,
  onChange,
  label = "Selecionar arquivo",
  accept = ".pdf,.png,.jpg,.jpeg",
  className,
}) => {
  const inputRef = React.useRef<HTMLInputElement>(null);

  if (value) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-md border border-input bg-muted/30 px-3 py-2",
          className,
        )}
      >
        <FileText className="h-4 w-4 text-primary shrink-0" />
        <span className="text-sm truncate flex-1">{value.name}</span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onChange(null)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0] ?? null;
          onChange(f);
        }}
      />
      <Button
        type="button"
        variant="outline"
        className="w-full justify-start font-normal text-muted-foreground"
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="h-4 w-4 mr-2" />
        {label}
      </Button>
    </div>
  );
};

export default FileUploadField;
import * as React from "react";
import { Upload, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MultiFileUploadFieldProps {
  value: File[];
  onChange: (files: File[]) => void;
  label?: string;
  accept?: string;
  className?: string;
}

export const MultiFileUploadField: React.FC<MultiFileUploadFieldProps> = ({
  value,
  onChange,
  label = "Selecionar arquivos",
  accept = ".pdf,.png,.jpg,.jpeg",
  className,
}) => {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const removeAt = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  return (
    <div className={cn("space-y-2", className)}>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const list = e.target.files ? Array.from(e.target.files) : [];
          if (list.length) onChange([...value, ...list]);
          if (inputRef.current) inputRef.current.value = "";
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
      {value.length > 0 && (
        <ul className="space-y-2">
          {value.map((f, idx) => (
            <li
              key={`${f.name}-${idx}`}
              className="flex items-center gap-2 rounded-md border border-input bg-muted/30 px-3 py-2"
            >
              <FileText className="h-4 w-4 text-primary shrink-0" />
              <span className="text-sm truncate flex-1">{f.name}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => removeAt(idx)}
              >
                <X className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MultiFileUploadField;

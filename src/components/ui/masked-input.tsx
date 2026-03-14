import * as React from "react";
import { cn } from "@/lib/utils";

export interface MaskedInputProps extends Omit<React.ComponentProps<"input">, "onChange"> {
  mask: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: boolean;
}

const MASK_CHAR = "9";

function applyMask(raw: string, mask: string): string {
  const digits = raw.replace(/\D/g, "");
  let result = "";
  let di = 0;
  for (let i = 0; i < mask.length && di < digits.length; i++) {
    if (mask[i] === MASK_CHAR) {
      result += digits[di++];
    } else {
      result += mask[i];
    }
  }
  return result;
}

const MaskedInput = React.forwardRef<HTMLInputElement, MaskedInputProps>(
  ({ className, mask, error, value = "", onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const masked = applyMask(e.target.value, mask);
      const synth = { ...e, target: { ...e.target, value: masked } } as React.ChangeEvent<HTMLInputElement>;
      onChange?.(synth);
    };

    return (
      <input
        ref={ref}
        value={applyMask(value, mask)}
        onChange={handleChange}
        placeholder={props.placeholder}
        disabled={props.disabled}
        className={cn(
          "flex h-10 w-full rounded-md border bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          error ? "border-destructive focus-visible:ring-destructive" : "border-input",
          className,
        )}
        {...props}
      />
    );
  },
);
MaskedInput.displayName = "MaskedInput";

export { MaskedInput };

import * as React from "react";
import InputMask from "react-input-mask";
import { cn } from "@/lib/utils";

export interface MaskedInputProps extends Omit<React.ComponentProps<"input">, "onChange"> {
  mask: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: boolean;
}

const MaskedInput = React.forwardRef<HTMLInputElement, MaskedInputProps>(
  ({ className, mask, error, ...props }, ref) => {
    return (
      <InputMask mask={mask} value={props.value} onChange={props.onChange} disabled={props.disabled}>
        {/* @ts-ignore - react-input-mask render prop */}
        {(inputProps: any) => (
          <input
            {...inputProps}
            ref={ref}
            placeholder={props.placeholder}
            className={cn(
              "flex h-10 w-full rounded-md border bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
              error ? "border-destructive focus-visible:ring-destructive" : "border-input",
              className,
            )}
          />
        )}
      </InputMask>
    );
  },
);
MaskedInput.displayName = "MaskedInput";

export { MaskedInput };

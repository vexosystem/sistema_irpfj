import { forwardRef, InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export const Checkbox = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Checkbox({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          "h-4 w-4 rounded border-border bg-surface-strong text-primary focus:ring-2 focus:ring-primary/30",
          className,
        )}
        type="checkbox"
        {...props}
      />
    );
  },
);

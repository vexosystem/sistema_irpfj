import { forwardRef, SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, ...props }, ref) {
    return (
      <select
        ref={ref}
        className={cn(
          "w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary",
          className,
        )}
        {...props}
      />
    );
  },
);

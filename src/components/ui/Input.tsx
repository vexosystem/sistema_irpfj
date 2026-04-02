import { forwardRef, InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full rounded-md border border-border bg-white px-3 py-2 text-sm outline-none ring-0 placeholder:text-zinc-400 focus:border-primary",
          className,
        )}
        {...props}
      />
    );
  },
);

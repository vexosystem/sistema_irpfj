import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type LoadingSpinnerProps = HTMLAttributes<HTMLSpanElement> & {
  size?: "sm" | "md" | "lg";
};

export function LoadingSpinner({ className, size = "md", ...props }: LoadingSpinnerProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-block animate-spin rounded-full border-2 border-current border-r-transparent",
        size === "sm" && "h-3.5 w-3.5",
        size === "md" && "h-4 w-4",
        size === "lg" && "h-5 w-5",
        className,
      )}
      {...props}
    />
  );
}

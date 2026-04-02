import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: "default" | "success" | "warning";
};

export function Badge({ className, tone = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
        tone === "default" && "bg-slate-200 text-slate-800",
        tone === "success" && "bg-green-100 text-success",
        tone === "warning" && "bg-amber-100 text-warning",
        className,
      )}
      {...props}
    />
  );
}

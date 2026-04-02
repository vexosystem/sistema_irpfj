import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/80 bg-surface/90 p-5 shadow-soft backdrop-blur-sm",
        className,
      )}
      {...props}
    />
  );
}

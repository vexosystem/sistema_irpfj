import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type SkeletonProps = HTMLAttributes<HTMLDivElement>;

export function Skeleton({ className, ...props }: SkeletonProps) {
  return <div aria-hidden="true" className={cn("animate-pulse rounded-2xl bg-border/35", className)} {...props} />;
}

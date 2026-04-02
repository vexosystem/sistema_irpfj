import { Card } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { cn } from "@/lib/utils/cn";

type PageLoaderProps = {
  title: string;
  description: string;
  fullScreen?: boolean;
  className?: string;
};

export function PageLoader({ title, description, fullScreen = false, className }: PageLoaderProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center",
        fullScreen ? "min-h-screen px-4" : "min-h-[240px]",
        className,
      )}
    >
      <Card className="w-full max-w-lg space-y-3 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <LoadingSpinner size="lg" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <p className="text-sm text-muted">{description}</p>
        </div>
      </Card>
    </div>
  );
}

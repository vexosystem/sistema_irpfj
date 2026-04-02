import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

type SectionLoaderProps = {
  lines?: number;
  cards?: number;
};

export function SectionLoader({ lines = 3, cards = 0 }: SectionLoaderProps) {
  return (
    <Card className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-56" />
      </div>

      {cards > 0 ? (
        <div className={`grid gap-4 ${cards > 1 ? "md:grid-cols-2" : ""} ${cards > 2 ? "xl:grid-cols-4" : ""}`}>
          {Array.from({ length: cards }).map((_, index) => (
            <Skeleton className="h-28 w-full" key={`card-${index}`} />
          ))}
        </div>
      ) : null}

      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, index) => (
          <Skeleton className="h-4 w-full" key={`line-${index}`} />
        ))}
      </div>
    </Card>
  );
}

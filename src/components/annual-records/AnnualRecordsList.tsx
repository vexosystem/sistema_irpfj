"use client";

import Link from "next/link";
import { ExternalLink, Trash2 } from "lucide-react";
import { AnnualRecord } from "@/types/annualRecord";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { LoadingButton } from "@/components/ui/LoadingButton";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatCurrency } from "@/lib/utils/format";

type AnnualRecordsListProps = {
  clientId: string;
  records: AnnualRecord[];
  onDuplicate: (recordId: string, newYear: number) => Promise<void>;
  onDelete: (recordId: string, year: number) => Promise<void>;
  duplicatingRecordId?: string | null;
  deletingRecordId?: string | null;
  loading?: boolean;
};

export function AnnualRecordsList({
  clientId,
  records,
  onDuplicate,
  onDelete,
  duplicatingRecordId = null,
  deletingRecordId = null,
  loading = false,
}: AnnualRecordsListProps) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Exercicios anuais</p>
          <h3 className="mt-1 text-lg font-semibold text-foreground">Historico por cliente</h3>
        </div>
        <div className="rounded-2xl border border-border bg-surface-strong px-4 py-2 text-sm font-semibold text-foreground">
          {loading ? "Carregando..." : `${records.length} registro(s)`}
        </div>
      </div>

      <table className="min-w-full text-sm">
        <thead className="bg-surface-strong text-left text-muted">
          <tr>
            <th className="px-4 py-4 font-semibold">Ano</th>
            <th className="px-4 py-4 font-semibold">Status</th>
            <th className="px-4 py-4 font-semibold">Resultado</th>
            <th className="px-4 py-4 font-semibold">Pagamento</th>
            <th className="px-4 py-4 font-semibold">Drive</th>
            <th className="px-4 py-4 font-semibold">Acoes</th>
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: 4 }).map((_, index) => (
                <tr className="border-t border-border/70" key={`record-skeleton-${index}`}>
                  <td className="px-4 py-4">
                    <Skeleton className="h-5 w-14" />
                  </td>
                  <td className="px-4 py-4">
                    <Skeleton className="h-6 w-28" />
                  </td>
                  <td className="px-4 py-4">
                    <Skeleton className="h-5 w-40" />
                  </td>
                  <td className="px-4 py-4">
                    <Skeleton className="h-5 w-32" />
                  </td>
                  <td className="px-4 py-4">
                    <Skeleton className="h-5 w-20" />
                  </td>
                  <td className="px-4 py-4">
                    <Skeleton className="h-10 w-40" />
                  </td>
                </tr>
              ))
            : records.map((record) => (
                <tr className="border-t border-border/70" key={record.id}>
                  <td className="px-4 py-4 font-semibold text-foreground">{record.year}</td>
                  <td className="px-4 py-4">
                    <Badge tone={record.status === "finalizado" ? "success" : "warning"}>{record.status}</Badge>
                  </td>
                  <td className="px-4 py-4 text-muted">
                    {record.taxResultType} {formatCurrency(record.taxResultAmount)}
                  </td>
                  <td className="px-4 py-4 text-muted">
                    {record.servicePaid ? `Pago ${formatCurrency(record.servicePaidAmount)}` : "Nao pago"}
                  </td>
                  <td className="px-4 py-4">
                    {record.driveLink ? (
                      <a
                        className="inline-flex items-center gap-2 text-primary hover:underline"
                        href={record.driveLink}
                        rel="noreferrer"
                        target="_blank"
                      >
                        <ExternalLink size={15} />
                        Abrir
                      </a>
                    ) : (
                      <span className="text-muted">Nao informado</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/clients/${clientId}/annual-records/${record.id}`}>
                        <LoadingButton loading={false} variant="secondary">
                          Abrir
                        </LoadingButton>
                      </Link>
                      <Link href={`/clients/${clientId}/annual-records/${record.id}/edit`}>
                        <LoadingButton loading={false} variant="secondary">
                          Editar
                        </LoadingButton>
                      </Link>
                      <LoadingButton
                        loading={duplicatingRecordId === record.id}
                        loadingText="Duplicando..."
                        onClick={() => onDuplicate(record.id, new Date().getFullYear())}
                        type="button"
                        variant="secondary"
                      >
                        Duplicar
                      </LoadingButton>
                      <LoadingButton
                        loading={deletingRecordId === record.id}
                        loadingText="Excluindo..."
                        onClick={() => onDelete(record.id, record.year)}
                        type="button"
                        variant="danger"
                      >
                        <Trash2 size={16} />
                        Excluir
                      </LoadingButton>
                    </div>
                  </td>
                </tr>
              ))}
        </tbody>
      </table>

      {!loading && records.length === 0 ? (
        <p className="p-5 text-sm text-muted">Nenhum exercicio cadastrado para este cliente.</p>
      ) : null}
    </Card>
  );
}

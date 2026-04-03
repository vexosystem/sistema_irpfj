"use client";

import Link from "next/link";
import { ExternalLink, Trash2 } from "lucide-react";
import { AnnualRecord } from "@/types/annualRecord";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
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

const statusLabelMap: Record<AnnualRecord["status"], string> = {
  pendente: "Pendente",
  aguardando_documentos: "Aguardando documentos",
  em_andamento: "Em andamento",
  finalizado: "Finalizado",
};

const resultLabelMap: Record<AnnualRecord["taxResultType"], string> = {
  a_pagar: "A pagar",
  a_restituir: "A restituir",
  sem_resultado: "Sem resultado",
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
      <div className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Exercicios anuais</p>
          <h3 className="mt-1 text-lg font-semibold text-foreground">Historico por cliente</h3>
        </div>
        <div className="w-full rounded-2xl border border-border bg-surface-strong px-4 py-2 text-center text-sm font-semibold text-foreground sm:w-auto">
          {loading ? "Carregando..." : `${records.length} registro(s)`}
        </div>
      </div>

      <div className="space-y-4 p-4 md:hidden">
        {loading
          ? Array.from({ length: 4 }).map((_, index) => (
              <Card className="space-y-4 p-4" key={`record-card-skeleton-${index}`}>
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-32" />
                <div className="grid gap-2">
                  <Skeleton className="h-11 w-full" />
                  <Skeleton className="h-11 w-full" />
                  <Skeleton className="h-11 w-full" />
                  <Skeleton className="h-11 w-full" />
                </div>
              </Card>
            ))
          : records.map((record) => (
              <Card className="space-y-4 p-4" key={record.id}>
                <div className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Ano</p>
                      <p className="mt-1 text-2xl font-bold text-foreground">{record.year}</p>
                    </div>
                    <Badge tone={record.status === "finalizado" ? "success" : "warning"}>
                      {statusLabelMap[record.status]}
                    </Badge>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-border bg-surface-strong p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Resultado</p>
                      <p className="mt-2 text-sm text-foreground">
                        {resultLabelMap[record.taxResultType]} {formatCurrency(record.taxResultAmount)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-border bg-surface-strong p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Pagamento</p>
                      <p className="mt-2 text-sm text-foreground">
                        {record.servicePaid ? `Pago ${formatCurrency(record.servicePaidAmount)}` : "Nao pago"}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border bg-surface-strong p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Drive</p>
                    {record.driveLink ? (
                      <a
                        className="mt-2 inline-flex items-center gap-2 break-all text-sm text-primary hover:underline"
                        href={record.driveLink}
                        rel="noreferrer"
                        target="_blank"
                      >
                        <ExternalLink size={15} />
                        Abrir documentos
                      </a>
                    ) : (
                      <p className="mt-2 text-sm text-muted">Nao informado</p>
                    )}
                  </div>
                </div>

                <div className="grid gap-2">
                  <Link className="w-full" href={`/clients/${clientId}/annual-records/${record.id}`}>
                    <Button className="w-full" variant="secondary">
                      Abrir
                    </Button>
                  </Link>
                  <Link className="w-full" href={`/clients/${clientId}/annual-records/${record.id}/edit`}>
                    <Button className="w-full" variant="secondary">
                      Editar
                    </Button>
                  </Link>
                  <LoadingButton
                    className="w-full"
                    loading={duplicatingRecordId === record.id}
                    loadingText="Duplicando..."
                    onClick={() => onDuplicate(record.id, new Date().getFullYear())}
                    type="button"
                    variant="secondary"
                  >
                    Duplicar
                  </LoadingButton>
                  <LoadingButton
                    className="w-full"
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
              </Card>
            ))}
      </div>

      <div className="hidden overflow-x-auto md:block">
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
                      <Badge tone={record.status === "finalizado" ? "success" : "warning"}>
                        {statusLabelMap[record.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-muted">
                      {resultLabelMap[record.taxResultType]} {formatCurrency(record.taxResultAmount)}
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
                          <Button variant="secondary">Abrir</Button>
                        </Link>
                        <Link href={`/clients/${clientId}/annual-records/${record.id}/edit`}>
                          <Button variant="secondary">Editar</Button>
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
      </div>

      {!loading && records.length === 0 ? (
        <div className="p-5">
          <p className="text-sm text-muted">Nenhum exercicio cadastrado para este cliente.</p>
        </div>
      ) : null}
    </Card>
  );
}

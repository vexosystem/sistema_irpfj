"use client";

import Link from "next/link";
import { AnnualRecord } from "@/types/annualRecord";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils/format";

type AnnualRecordsListProps = {
  clientId: string;
  records: AnnualRecord[];
  onDuplicate: (recordId: string, newYear: number) => Promise<void>;
};

export function AnnualRecordsList({ clientId, records, onDuplicate }: AnnualRecordsListProps) {
  return (
    <Card className="overflow-x-auto p-0">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-left">
          <tr>
            <th className="px-4 py-3">Ano</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Resultado</th>
            <th className="px-4 py-3">Pagamento</th>
            <th className="px-4 py-3">Acoes</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr className="border-t" key={record.id}>
              <td className="px-4 py-3">{record.year}</td>
              <td className="px-4 py-3">
                <Badge tone={record.status === "finalizado" ? "success" : "warning"}>{record.status}</Badge>
              </td>
              <td className="px-4 py-3">
                {record.taxResultType} {formatCurrency(record.taxResultAmount)}
              </td>
              <td className="px-4 py-3">
                {record.servicePaid ? `Pago ${formatCurrency(record.servicePaidAmount)}` : "Nao pago"}
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  <Link href={`/clients/${clientId}/annual-records/${record.id}`}>
                    <Button variant="secondary">Abrir</Button>
                  </Link>
                  <Link href={`/clients/${clientId}/annual-records/${record.id}/edit`}>
                    <Button variant="secondary">Editar</Button>
                  </Link>
                  <Button
                    onClick={() => onDuplicate(record.id, new Date().getFullYear())}
                    type="button"
                    variant="secondary"
                  >
                    Duplicar
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {records.length === 0 ? <p className="p-4 text-sm text-muted">Nenhum exercicio cadastrado.</p> : null}
    </Card>
  );
}

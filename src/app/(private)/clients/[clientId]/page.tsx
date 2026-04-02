"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { AppShell } from "@/components/layout/AppShell";
import { AnnualRecordsList } from "@/components/annual-records/AnnualRecordsList";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getClient } from "@/services/clients.service";
import { duplicateAnnualRecord, listAnnualRecords } from "@/services/annualRecords.service";
import { AnnualRecord } from "@/types/annualRecord";
import { Client } from "@/types/client";
import { formatCpf } from "@/lib/utils/format";
import { useAuth } from "@/hooks/useAuth";

export default function ClientDetailsPage() {
  const params = useParams<{ clientId: string }>();
  const { user } = useAuth();
  const [client, setClient] = useState<Client | null>(null);
  const [records, setRecords] = useState<AnnualRecord[]>([]);

  async function refresh() {
    const [clientResult, recordsResult] = await Promise.all([
      getClient(params.clientId),
      listAnnualRecords(params.clientId),
    ]);

    setClient(clientResult);
    setRecords(recordsResult);
  }

  useEffect(() => {
    void refresh();
  }, [params.clientId]);

  return (
    <AuthGuard>
      <AppShell
        title={client?.fullName ?? "Cliente"}
        actions={
          <Link href={`/clients/${params.clientId}/annual-records/new`}>
            <Button>Novo exercicio</Button>
          </Link>
        }
      >
        {client ? (
          <Card className="space-y-2">
            <p className="text-sm text-muted">CPF: {formatCpf(client.cpfDigits)}</p>
            <p className="text-sm text-muted">Email: {client.email || "-"}</p>
            <p className="text-sm text-muted">Telefone: {client.phone || "-"}</p>
            <p className="text-sm text-muted">Observacoes: {client.notesGeneral || "-"}</p>
          </Card>
        ) : null}

        <AnnualRecordsList
          clientId={params.clientId}
          onDuplicate={async (recordId, newYear) => {
            if (!user) {
              return;
            }

            await duplicateAnnualRecord(params.clientId, recordId, newYear, user.uid);
            await refresh();
          }}
          records={records}
        />
      </AppShell>
    </AuthGuard>
  );
}

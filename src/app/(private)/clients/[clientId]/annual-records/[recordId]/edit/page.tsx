"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { AppShell } from "@/components/layout/AppShell";
import { AnnualRecordForm } from "@/components/annual-records/AnnualRecordForm";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SectionLoader } from "@/components/ui/SectionLoader";
import { getAnnualRecord } from "@/services/annualRecords.service";
import { AnnualRecord } from "@/types/annualRecord";

export default function EditAnnualRecordPage() {
  const params = useParams<{ clientId: string; recordId: string }>();
  const [record, setRecord] = useState<AnnualRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    void getAnnualRecord(params.clientId, params.recordId)
      .then((result) => {
        setRecord(result);
        setError(null);
      })
      .catch((loadError: unknown) => {
        setError(loadError instanceof Error ? loadError.message : "Nao foi possivel carregar o exercicio.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [params.clientId, params.recordId]);

  return (
    <AuthGuard>
      <AppShell
        actions={
          <Link href={`/clients/${params.clientId}`}>
            <Button type="button" variant="secondary">
              Voltar para clientes
            </Button>
          </Link>
        }
        subtitle="Atualize dados fiscais, pagamento, link do Drive e senha gov quando necessario."
        title="Editar exercicio"
      >
        {error ? <Card className="border-danger/40 text-sm text-danger">{error}</Card> : null}
        {loading ? <SectionLoader lines={8} /> : null}
        {!loading && record ? <AnnualRecordForm clientId={params.clientId} record={record} /> : null}
        {!loading && !record && !error ? (
          <Card className="text-sm text-muted">Exercicio nao encontrado para edicao.</Card>
        ) : null}
      </AppShell>
    </AuthGuard>
  );
}

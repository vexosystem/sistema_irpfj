"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { AppShell } from "@/components/layout/AppShell";
import { DocumentsSection } from "@/components/documents/DocumentsSection";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getAnnualRecord, getGovCredential } from "@/services/annualRecords.service";
import { AnnualRecord } from "@/types/annualRecord";
import { formatCurrency } from "@/lib/utils/format";

export default function AnnualRecordDetailsPage() {
  const params = useParams<{ clientId: string; recordId: string }>();
  const [record, setRecord] = useState<AnnualRecord | null>(null);
  const [revealedPassword, setRevealedPassword] = useState<string | null>(null);

  useEffect(() => {
    void getAnnualRecord(params.clientId, params.recordId).then(setRecord);
  }, [params.clientId, params.recordId]);

  return (
    <AuthGuard>
      <AppShell title={`Exercicio ${record?.year ?? ""}`}>
        {record ? (
          <Card className="space-y-3">
            <p className="text-sm">Login gov: {record.govLogin}</p>
            <p className="text-sm">Status: {record.status}</p>
            <p className="text-sm">
              Resultado: {record.taxResultType} {formatCurrency(record.taxResultAmount)}
            </p>
            <p className="text-sm">
              Pagamento: {record.servicePaid ? formatCurrency(record.servicePaidAmount) : "Nao pago"}
            </p>
            <p className="text-sm">Observacao: {record.observation || "-"}</p>
            <div className="flex items-center gap-3">
              <Button
                onClick={async () => {
                  const credential = await getGovCredential(params.clientId, params.recordId);
                  setRevealedPassword(credential.govPassword);
                }}
                type="button"
                variant="secondary"
              >
                Visualizar senha gov
              </Button>
              {revealedPassword ? <span className="text-sm font-medium">{revealedPassword}</span> : null}
            </div>
          </Card>
        ) : null}

        <DocumentsSection clientId={params.clientId} recordId={params.recordId} />
      </AppShell>
    </AuthGuard>
  );
}

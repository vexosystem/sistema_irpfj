"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { AppShell } from "@/components/layout/AppShell";
import { AnnualRecordForm } from "@/components/annual-records/AnnualRecordForm";
import { getAnnualRecord } from "@/services/annualRecords.service";
import { AnnualRecord } from "@/types/annualRecord";

export default function EditAnnualRecordPage() {
  const params = useParams<{ clientId: string; recordId: string }>();
  const [record, setRecord] = useState<AnnualRecord | null>(null);

  useEffect(() => {
    void getAnnualRecord(params.clientId, params.recordId).then(setRecord);
  }, [params.clientId, params.recordId]);

  return (
    <AuthGuard>
      <AppShell title="Editar exercicio">
        <AnnualRecordForm clientId={params.clientId} record={record} />
      </AppShell>
    </AuthGuard>
  );
}

"use client";

import { useParams } from "next/navigation";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { AppShell } from "@/components/layout/AppShell";
import { AnnualRecordForm } from "@/components/annual-records/AnnualRecordForm";

export default function NewAnnualRecordPage() {
  const params = useParams<{ clientId: string }>();

  return (
    <AuthGuard>
      <AppShell title="Novo exercicio">
        <AnnualRecordForm clientId={params.clientId} />
      </AppShell>
    </AuthGuard>
  );
}

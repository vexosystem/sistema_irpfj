"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { AppShell } from "@/components/layout/AppShell";
import { AnnualRecordForm } from "@/components/annual-records/AnnualRecordForm";
import { Button } from "@/components/ui/Button";

export default function NewAnnualRecordPage() {
  const params = useParams<{ clientId: string }>();

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
        subtitle="Cadastro de um novo exercicio anual com link do Drive e credenciais gov."
        title="Novo exercicio"
      >
        <AnnualRecordForm clientId={params.clientId} />
      </AppShell>
    </AuthGuard>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { AppShell } from "@/components/layout/AppShell";
import { ClientForm } from "@/components/clients/ClientForm";
import { Card } from "@/components/ui/Card";
import { SectionLoader } from "@/components/ui/SectionLoader";
import { getClient } from "@/services/clients.service";
import { Client } from "@/types/client";

export default function EditClientPage() {
  const params = useParams<{ clientId: string }>();
  const [client, setClient] = useState<Client | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    void getClient(params.clientId)
      .then((result) => {
        setClient(result);
        setError(null);
      })
      .catch((loadError: unknown) => {
        setError(loadError instanceof Error ? loadError.message : "Nao foi possivel carregar o cliente.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [params.clientId]);

  return (
    <AuthGuard>
      <AppShell
        subtitle="Atualize dados cadastrais e observacoes gerais sem sair do fluxo principal."
        title="Editar cliente"
      >
        {error ? <Card className="border-danger/40 text-sm text-danger">{error}</Card> : null}
        {loading ? <SectionLoader lines={6} /> : null}
        {!loading && client ? <ClientForm client={client} /> : null}
        {!loading && !client && !error ? (
          <Card className="text-sm text-muted">Cliente nao encontrado para edicao.</Card>
        ) : null}
      </AppShell>
    </AuthGuard>
  );
}

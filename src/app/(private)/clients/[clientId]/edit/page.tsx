"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { AppShell } from "@/components/layout/AppShell";
import { ClientForm } from "@/components/clients/ClientForm";
import { getClient } from "@/services/clients.service";
import { Client } from "@/types/client";

export default function EditClientPage() {
  const params = useParams<{ clientId: string }>();
  const [client, setClient] = useState<Client | null>(null);

  useEffect(() => {
    void getClient(params.clientId).then(setClient);
  }, [params.clientId]);

  return (
    <AuthGuard>
      <AppShell title="Editar cliente">
        {client ? <ClientForm client={client} /> : <p className="text-sm text-muted">Carregando...</p>}
      </AppShell>
    </AuthGuard>
  );
}

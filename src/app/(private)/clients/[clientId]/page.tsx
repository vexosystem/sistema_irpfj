"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { AppShell } from "@/components/layout/AppShell";
import { AnnualRecordsList } from "@/components/annual-records/AnnualRecordsList";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LoadingButton } from "@/components/ui/LoadingButton";
import { SectionLoader } from "@/components/ui/SectionLoader";
import { deleteClient, getClient } from "@/services/clients.service";
import { deleteAnnualRecord, duplicateAnnualRecord, listAnnualRecords } from "@/services/annualRecords.service";
import { AnnualRecord } from "@/types/annualRecord";
import { Client } from "@/types/client";
import { formatCpf } from "@/lib/utils/format";
import { useAuth } from "@/hooks/useAuth";

export default function ClientDetailsPage() {
  const params = useParams<{ clientId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [client, setClient] = useState<Client | null>(null);
  const [records, setRecords] = useState<AnnualRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [duplicatingRecordId, setDuplicatingRecordId] = useState<string | null>(null);
  const [deletingRecordId, setDeletingRecordId] = useState<string | null>(null);
  const [deletingClient, setDeletingClient] = useState(false);

  async function refresh() {
    setLoading(true);

    try {
      const [clientResult, recordsResult] = await Promise.all([
        getClient(params.clientId),
        listAnnualRecords(params.clientId),
      ]);

      setClient(clientResult);
      setRecords(recordsResult);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Nao foi possivel carregar o cliente.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, [params.clientId]);

  async function handleDeleteClient() {
    if (!client) {
      return;
    }

    const confirmed = window.confirm(
      `Tem certeza que deseja excluir este cliente?\n\nEsta acao nao pode ser desfeita.\nIsso removera todos os exercicios e dados relacionados de ${client.fullName}.`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingClient(true);

    try {
      await deleteClient(client.id);
      router.push("/clients");
    } catch (deleteClientError) {
      setError(
        deleteClientError instanceof Error
          ? deleteClientError.message
          : "Nao foi possivel excluir o cliente.",
      );
    } finally {
      setDeletingClient(false);
    }
  }

  async function handleDeleteAnnualRecord(recordId: string, year: number) {
    const confirmed = window.confirm(
      `Tem certeza que deseja excluir o exercicio ${year}?\n\nEsta acao nao pode ser desfeita.`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingRecordId(recordId);

    try {
      await deleteAnnualRecord(params.clientId, recordId);
      setError(null);
      await refresh();
    } catch (deleteRecordError) {
      setError(
        deleteRecordError instanceof Error
          ? deleteRecordError.message
          : "Nao foi possivel excluir o exercicio.",
      );
    } finally {
      setDeletingRecordId(null);
    }
  }

  return (
    <AuthGuard>
      <AppShell
        actions={
          <Link href={`/clients/${params.clientId}/annual-records/new`}>
            <Button>Novo exercicio</Button>
          </Link>
        }
        subtitle="Dados do cliente, contexto fiscal e historico anual centralizados em uma unica tela."
        title={client?.fullName ?? "Cliente"}
      >
        {error ? <Card className="border-danger/40 text-sm text-danger">{error}</Card> : null}

        {loading ? (
          <>
            <SectionLoader cards={4} lines={2} />
            <SectionLoader lines={4} />
          </>
        ) : null}

        {!loading && client ? (
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <Card className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Perfil do cliente</p>
              <h2 className="text-2xl font-bold text-foreground">{client.fullName}</h2>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-border bg-surface-strong p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">CPF</p>
                  <p className="mt-2 text-sm text-foreground">{formatCpf(client.cpfDigits)}</p>
                </div>
                <div className="rounded-2xl border border-border bg-surface-strong p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Email</p>
                  <p className="mt-2 text-sm text-foreground">{client.email || "-"}</p>
                </div>
                <div className="rounded-2xl border border-border bg-surface-strong p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Telefone</p>
                  <p className="mt-2 text-sm text-foreground">{client.phone || "-"}</p>
                </div>
                <div className="rounded-2xl border border-border bg-surface-strong p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Telefone secundario</p>
                  <p className="mt-2 text-sm text-foreground">{client.secondaryPhone || "-"}</p>
                </div>
              </div>
            </Card>

            <Card className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Observacoes</p>
              <p className="text-sm text-muted">{client.notesGeneral || "Nenhuma observacao cadastrada."}</p>
              <div className="flex flex-wrap gap-2">
                <Link href={`/clients/${params.clientId}/edit`}>
                  <Button variant="secondary">Editar cliente</Button>
                </Link>
                <LoadingButton
                  loading={deletingClient}
                  loadingText="Excluindo cliente..."
                  onClick={() => void handleDeleteClient()}
                  type="button"
                  variant="danger"
                >
                  <Trash2 size={16} />
                  Excluir cliente
                </LoadingButton>
              </div>
            </Card>
          </div>
        ) : null}

        {!loading && !client && !error ? (
          <Card className="text-sm text-muted">Cliente nao encontrado ou indisponivel no momento.</Card>
        ) : null}

        <AnnualRecordsList
          clientId={params.clientId}
          deletingRecordId={deletingRecordId}
          loading={loading}
          onDuplicate={async (recordId, newYear) => {
            if (!user) {
              setError("Sua sessao expirou. Entre novamente.");
              return;
            }

            try {
              setDuplicatingRecordId(recordId);
              await duplicateAnnualRecord(params.clientId, recordId, newYear, user.uid);
              setError(null);
              await refresh();
            } catch (duplicateError) {
              setError(
                duplicateError instanceof Error
                  ? duplicateError.message
                  : "Nao foi possivel duplicar o exercicio.",
              );
            } finally {
              setDuplicatingRecordId(null);
            }
          }}
          onDelete={handleDeleteAnnualRecord}
          duplicatingRecordId={duplicatingRecordId}
          records={records}
        />
      </AppShell>
    </AuthGuard>
  );
}

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

function getClientFeedbackKey(clientId: string) {
  return `client-feedback:${clientId}`;
}

export default function ClientDetailsPage() {
  const params = useParams<{ clientId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [client, setClient] = useState<Client | null>(null);
  const [records, setRecords] = useState<AnnualRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
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

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const feedbackKey = getClientFeedbackKey(params.clientId);
    const storedFeedback = window.sessionStorage.getItem(feedbackKey);
    if (!storedFeedback) {
      return;
    }

    setSuccess(storedFeedback);
    window.sessionStorage.removeItem(feedbackKey);
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
    setSuccess(null);

    try {
      await deleteClient(client.id);

      if (typeof window !== "undefined") {
        window.sessionStorage.setItem("clients-feedback", `Cliente ${client.fullName} excluido com sucesso.`);
      }

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
    setSuccess(null);

    try {
      await deleteAnnualRecord(params.clientId, recordId);
      setError(null);
      setSuccess(`Exercicio ${year} excluido com sucesso.`);
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
          <Link className="w-full sm:w-auto" href={`/clients/${params.clientId}/annual-records/new`}>
            <Button className="w-full sm:w-auto">Novo exercicio</Button>
          </Link>
        }
        subtitle="Dados do cliente, contexto fiscal e historico anual centralizados em uma unica tela."
        title={client?.fullName ?? "Cliente"}
      >
        {error ? <Card className="border-danger/40 text-sm text-danger">{error}</Card> : null}
        {success ? <Card className="border-success/40 text-sm text-success">{success}</Card> : null}

        {loading ? (
          <>
            <SectionLoader cards={4} lines={2} />
            <SectionLoader lines={4} />
          </>
        ) : null}

        {!loading && client ? (
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
            <Card className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Perfil do cliente</p>
              <h2 className="break-words text-2xl font-bold text-foreground">{client.fullName}</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-border bg-surface-strong p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">CPF</p>
                  <p className="mt-2 text-sm text-foreground">{formatCpf(client.cpfDigits)}</p>
                </div>
                <div className="rounded-2xl border border-border bg-surface-strong p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Email</p>
                  <p className="mt-2 break-all text-sm text-foreground">{client.email || "-"}</p>
                </div>
                <div className="rounded-2xl border border-border bg-surface-strong p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Telefone</p>
                  <p className="mt-2 break-all text-sm text-foreground">{client.phone || "-"}</p>
                </div>
                <div className="rounded-2xl border border-border bg-surface-strong p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Telefone secundario</p>
                  <p className="mt-2 break-all text-sm text-foreground">{client.secondaryPhone || "-"}</p>
                </div>
              </div>
            </Card>

            <Card className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Observacoes</p>
                <p className="mt-2 break-words text-sm text-muted">
                  {client.notesGeneral || "Nenhuma observacao cadastrada."}
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <Link className="w-full sm:w-auto" href={`/clients/${params.clientId}/edit`}>
                  <Button className="w-full sm:w-auto" variant="secondary">
                    Editar cliente
                  </Button>
                </Link>
                <LoadingButton
                  className="w-full sm:w-auto"
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
          onDelete={handleDeleteAnnualRecord}
          onDuplicate={async (recordId, newYear) => {
            if (!user) {
              setError("Sua sessao expirou. Entre novamente.");
              return;
            }

            try {
              setDuplicatingRecordId(recordId);
              setSuccess(null);
              await duplicateAnnualRecord(params.clientId, recordId, newYear, user.uid);
              setError(null);
              setSuccess(`Exercicio ${newYear} criado com sucesso a partir da duplicacao.`);
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
          duplicatingRecordId={duplicatingRecordId}
          records={records}
        />
      </AppShell>
    </AuthGuard>
  );
}

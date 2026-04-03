"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Search, Trash2 } from "lucide-react";
import { useClientsStore } from "@/store/useClientsStore";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { LoadingButton } from "@/components/ui/LoadingButton";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/hooks/useAuth";
import { formatCpf } from "@/lib/utils/format";
import { deleteClient } from "@/services/clients.service";

const CLIENTS_FEEDBACK_KEY = "clients-feedback";

export function ClientsList() {
  const { isOwnerReady } = useAuth();
  const { clients, loading, error, fetchClients } = useClientsStore();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [deletingClientId, setDeletingClientId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOwnerReady) {
      return;
    }

    void fetchClients().finally(() => {
      setHasLoadedOnce(true);
    });
  }, [fetchClients, isOwnerReady]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedFeedback = window.sessionStorage.getItem(CLIENTS_FEEDBACK_KEY);
    if (!storedFeedback) {
      return;
    }

    setFeedback(storedFeedback);
    window.sessionStorage.removeItem(CLIENTS_FEEDBACK_KEY);
  }, []);

  const filteredClients = useMemo(() => {
    const normalized = search.trim().toLowerCase();

    return clients.filter((client) => {
      const matchesSearch =
        normalized.length === 0 ||
        client.fullName.toLowerCase().includes(normalized) ||
        client.cpfDigits.includes(normalized) ||
        client.email.toLowerCase().includes(normalized);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && client.isActive) ||
        (statusFilter === "inactive" && !client.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [clients, search, statusFilter]);

  const isInitialLoading = !isOwnerReady || (!hasLoadedOnce && !error) || loading;

  async function handleDeleteClient(clientId: string, clientName: string) {
    const confirmed = window.confirm(
      `Tem certeza que deseja excluir este cliente?\n\nEsta acao nao pode ser desfeita.\nIsso removera todos os exercicios e dados relacionados de ${clientName}.`,
    );

    if (!confirmed) {
      return;
    }

    setDeleteError(null);
    setFeedback(null);
    setDeletingClientId(clientId);

    try {
      await deleteClient(clientId);
      await fetchClients();
      setFeedback(`Cliente ${clientName} excluido com sucesso.`);
    } catch (deleteClientError) {
      setDeleteError(
        deleteClientError instanceof Error
          ? deleteClientError.message
          : "Nao foi possivel excluir o cliente.",
      );
    } finally {
      setDeletingClientId(null);
    }
  }

  return (
    <AppShell
      actions={
        <Link className="w-full sm:w-auto" href="/clients/new">
          <Button className="w-full sm:w-auto">Novo cliente</Button>
        </Link>
      }
      subtitle="Consulte, filtre e acompanhe rapidamente a base de clientes ativos e inativos."
      title="Clientes"
    >
      {error && !loading ? <Card className="border-danger/40 text-sm text-danger">{error}</Card> : null}
      {deleteError ? <Card className="border-danger/40 text-sm text-danger">{deleteError}</Card> : null}
      {feedback ? <Card className="border-success/40 text-sm text-success">{feedback}</Card> : null}

      <Card className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_220px_auto] lg:items-end">
        <div className="min-w-0 space-y-2">
          <p className="text-sm font-semibold text-foreground">Busca rapida</p>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              className="pl-10"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nome, CPF ou email"
              value={search}
            />
          </div>
        </div>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-foreground">Status</span>
          <select
            className="w-full rounded-xl border border-border bg-surface-strong px-3.5 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            onChange={(event) => setStatusFilter(event.target.value as "all" | "active" | "inactive")}
            value={statusFilter}
          >
            <option value="all">Todos</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
          </select>
        </label>

        <div className="rounded-2xl border border-border bg-surface-strong px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Resultados</p>
          {isInitialLoading ? (
            <Skeleton className="mt-2 h-8 w-16" />
          ) : (
            <p className="mt-2 text-2xl font-bold text-foreground">{filteredClients.length}</p>
          )}
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Total clientes</p>
          {isInitialLoading ? (
            <Skeleton className="mt-3 h-9 w-20" />
          ) : (
            <p className="mt-2 text-3xl font-bold text-foreground">{clients.length}</p>
          )}
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Ativos</p>
          {isInitialLoading ? (
            <Skeleton className="mt-3 h-9 w-20" />
          ) : (
            <p className="mt-2 text-3xl font-bold text-foreground">{clients.filter((item) => item.isActive).length}</p>
          )}
        </Card>
        <Card className="sm:col-span-2 xl:col-span-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Inativos</p>
          {isInitialLoading ? (
            <Skeleton className="mt-3 h-9 w-20" />
          ) : (
            <p className="mt-2 text-3xl font-bold text-foreground">
              {clients.filter((item) => !item.isActive).length}
            </p>
          )}
        </Card>
      </div>

      <div className="space-y-4 md:hidden">
        {isInitialLoading
          ? Array.from({ length: 5 }).map((_, index) => (
              <Card className="space-y-4" key={`client-card-skeleton-${index}`}>
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-full" />
                <div className="grid gap-2">
                  <Skeleton className="h-11 w-full" />
                  <Skeleton className="h-11 w-full" />
                  <Skeleton className="h-11 w-full" />
                </div>
              </Card>
            ))
          : filteredClients.map((client) => (
              <Card className="space-y-4" key={client.id}>
                <div className="space-y-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h2 className="break-words text-lg font-semibold text-foreground">{client.fullName}</h2>
                      <p className="mt-1 text-sm text-muted">{formatCpf(client.cpfDigits)}</p>
                    </div>
                    <Badge tone={client.isActive ? "success" : "warning"}>
                      {client.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>

                  <div className="space-y-2 rounded-2xl border border-border bg-surface-strong p-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Email</p>
                      <p className="mt-1 break-all text-sm text-foreground">{client.email || "-"}</p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Link className="w-full" href={`/clients/${client.id}`}>
                    <Button className="w-full" variant="secondary">
                      Abrir
                    </Button>
                  </Link>
                  <Link className="w-full" href={`/clients/${client.id}/edit`}>
                    <Button className="w-full" variant="secondary">
                      Editar
                    </Button>
                  </Link>
                  <LoadingButton
                    className="w-full"
                    loading={deletingClientId === client.id}
                    loadingText="Excluindo..."
                    onClick={() => void handleDeleteClient(client.id, client.fullName)}
                    type="button"
                    variant="danger"
                  >
                    <Trash2 size={16} />
                    Excluir
                  </LoadingButton>
                </div>
              </Card>
            ))}
      </div>

      <Card className="hidden overflow-hidden p-0 md:block">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-surface-strong text-left text-muted">
              <tr>
                <th className="px-4 py-4 font-semibold">Nome</th>
                <th className="px-4 py-4 font-semibold">CPF</th>
                <th className="px-4 py-4 font-semibold">Email</th>
                <th className="px-4 py-4 font-semibold">Status</th>
                <th className="px-4 py-4 font-semibold">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {isInitialLoading
                ? Array.from({ length: 5 }).map((_, index) => (
                    <tr className="border-t border-border/70" key={`client-skeleton-${index}`}>
                      <td className="px-4 py-4">
                        <Skeleton className="h-5 w-40" />
                      </td>
                      <td className="px-4 py-4">
                        <Skeleton className="h-5 w-28" />
                      </td>
                      <td className="px-4 py-4">
                        <Skeleton className="h-5 w-44" />
                      </td>
                      <td className="px-4 py-4">
                        <Skeleton className="h-6 w-20" />
                      </td>
                      <td className="px-4 py-4">
                        <Skeleton className="h-10 w-36" />
                      </td>
                    </tr>
                  ))
                : filteredClients.map((client) => (
                    <tr className="border-t border-border/70" key={client.id}>
                      <td className="px-4 py-4 font-medium text-foreground">{client.fullName}</td>
                      <td className="px-4 py-4 text-muted">{formatCpf(client.cpfDigits)}</td>
                      <td className="px-4 py-4 text-muted">{client.email || "-"}</td>
                      <td className="px-4 py-4">
                        <Badge tone={client.isActive ? "success" : "warning"}>
                          {client.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <Link href={`/clients/${client.id}`}>
                            <Button variant="secondary">Abrir</Button>
                          </Link>
                          <Link href={`/clients/${client.id}/edit`}>
                            <Button variant="secondary">Editar</Button>
                          </Link>
                          <LoadingButton
                            loading={deletingClientId === client.id}
                            loadingText="Excluindo..."
                            onClick={() => void handleDeleteClient(client.id, client.fullName)}
                            type="button"
                            variant="danger"
                          >
                            <Trash2 size={16} />
                            Excluir
                          </LoadingButton>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </Card>

      {!isInitialLoading && !loading && filteredClients.length === 0 ? (
        <Card>
          <p className="text-sm text-muted">Nenhum cliente encontrado com os filtros atuais.</p>
        </Card>
      ) : null}
    </AppShell>
  );
}

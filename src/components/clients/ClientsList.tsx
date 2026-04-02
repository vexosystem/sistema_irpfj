"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useClientsStore } from "@/store/useClientsStore";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { formatCpf } from "@/lib/utils/format";

export function ClientsList() {
  const { clients, loading, fetchClients } = useClientsStore();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  useEffect(() => {
    void fetchClients();
  }, [fetchClients]);

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

  return (
    <AppShell
      title="Clientes"
      actions={
        <Link href="/clients/new">
          <Button>Novo cliente</Button>
        </Link>
      }
    >
      <Card className="grid gap-4 md:grid-cols-[2fr_200px]">
        <Input
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por nome, CPF ou email"
          value={search}
        />
        <select
          className="rounded-md border border-border bg-white px-3 py-2 text-sm"
          onChange={(event) => setStatusFilter(event.target.value as "all" | "active" | "inactive")}
          value={statusFilter}
        >
          <option value="all">Todos</option>
          <option value="active">Ativos</option>
          <option value="inactive">Inativos</option>
        </select>
      </Card>

      <Card className="overflow-x-auto p-0">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">CPF</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Acoes</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.map((client) => (
              <tr className="border-t" key={client.id}>
                <td className="px-4 py-3">{client.fullName}</td>
                <td className="px-4 py-3">{formatCpf(client.cpfDigits)}</td>
                <td className="px-4 py-3">{client.email || "-"}</td>
                <td className="px-4 py-3">
                  <Badge tone={client.isActive ? "success" : "warning"}>
                    {client.isActive ? "Ativo" : "Inativo"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Link href={`/clients/${client.id}`}>
                      <Button variant="secondary">Abrir</Button>
                    </Link>
                    <Link href={`/clients/${client.id}/edit`}>
                      <Button variant="secondary">Editar</Button>
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!loading && filteredClients.length === 0 ? (
          <p className="p-4 text-sm text-muted">Nenhum cliente encontrado.</p>
        ) : null}
      </Card>
    </AppShell>
  );
}

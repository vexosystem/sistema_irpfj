"use client";

import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/hooks/useAuth";
import { getDashboardTotals } from "@/services/clients.service";

type Totals = {
  totalClients: number;
  pending: number;
  paid: number;
  unpaid: number;
};

const initialTotals: Totals = {
  totalClients: 0,
  pending: 0,
  paid: 0,
  unpaid: 0,
};

function DashboardContent() {
  const { isOwnerReady } = useAuth();
  const [totals, setTotals] = useState<Totals>(initialTotals);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);

  async function loadDashboard() {
    if (!isOwnerReady) {
      return;
    }

    setLoading(true);

    try {
      const result = await getDashboardTotals();
      setTotals(result);
      setError(null);
      setLoaded(true);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Nao foi possivel carregar o dashboard.");
      setLoaded(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isOwnerReady) {
      return;
    }

    void loadDashboard();
  }, [isOwnerReady]);

  return (
    <AppShell
      subtitle="Visao operacional dos clientes e dos exercicios anuais em andamento."
      title="Dashboard"
    >
      {loading ? (
        <div className="grid gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={`dashboard-skeleton-${index}`}>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-4 h-10 w-20" />
              <Skeleton className="mt-3 h-4 w-full" />
            </Card>
          ))}
        </div>
      ) : null}

      {!loading && error ? (
        <Card className="space-y-3 border-danger/40 text-sm text-danger">
          <p>{error}</p>
          <Button onClick={() => void loadDashboard()} type="button" variant="secondary">
            Tentar novamente
          </Button>
        </Card>
      ) : null}

      {!loading && !error && loaded ? (
        <div className="grid gap-4 lg:grid-cols-4">
          <Card>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Total clientes</p>
            <p className="mt-3 text-4xl font-bold text-foreground">{totals.totalClients}</p>
            <p className="mt-2 text-sm text-muted">Base total de cadastros disponiveis.</p>
          </Card>
          <Card>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Pendentes</p>
            <p className="mt-3 text-4xl font-bold text-foreground">{totals.pending}</p>
            <p className="mt-2 text-sm text-muted">Exercicios que ainda exigem atuacao ou conclusao.</p>
          </Card>
          <Card>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Pagos</p>
            <p className="mt-3 text-4xl font-bold text-foreground">{totals.paid}</p>
            <p className="mt-2 text-sm text-muted">Exercicios com servico marcado como pago.</p>
          </Card>
          <Card>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Nao pagos</p>
            <p className="mt-3 text-4xl font-bold text-foreground">{totals.unpaid}</p>
            <p className="mt-2 text-sm text-muted">Exercicios ainda sem recebimento registrado.</p>
          </Card>
        </div>
      ) : null}

      {!loading && !error && loaded && totals.totalClients === 0 ? (
        <Card className="text-sm text-muted">
          Nenhum cliente encontrado ainda. Assim que houver clientes e exercicios no banco, os indicadores aparecerao aqui.
        </Card>
      ) : null}
    </AppShell>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}

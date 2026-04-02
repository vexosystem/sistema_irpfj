"use client";

import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
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

export default function DashboardPage() {
  const [totals, setTotals] = useState<Totals>(initialTotals);

  useEffect(() => {
    void getDashboardTotals().then(setTotals);
  }, []);

  return (
    <AuthGuard>
      <AppShell title="Dashboard">
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <p className="text-sm text-muted">Total clientes</p>
            <p className="text-3xl font-semibold">{totals.totalClients}</p>
          </Card>
          <Card>
            <p className="text-sm text-muted">Pendentes</p>
            <p className="text-3xl font-semibold">{totals.pending}</p>
          </Card>
          <Card>
            <p className="text-sm text-muted">Pagos</p>
            <p className="text-3xl font-semibold">{totals.paid}</p>
          </Card>
          <Card>
            <p className="text-sm text-muted">Nao pagos</p>
            <p className="text-3xl font-semibold">{totals.unpaid}</p>
          </Card>
        </div>
      </AppShell>
    </AuthGuard>
  );
}

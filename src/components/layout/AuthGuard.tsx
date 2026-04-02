"use client";

import { ReactNode, useEffect } from "react";
import { ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { signOutUser } from "@/lib/auth/auth-client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/Card";
import { PageLoader } from "@/components/ui/PageLoader";

type AuthGuardProps = {
  children: ReactNode;
};

function GuardState({ message, tone = "muted" }: { message: string; tone?: "muted" | "danger" }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md space-y-3 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <ShieldCheck size={22} />
        </div>
        <h2 className="text-xl font-semibold text-foreground">Acesso interno IRPFJ</h2>
        <p className={tone === "danger" ? "text-sm text-danger" : "text-sm text-muted"}>{message}</p>
      </Card>
    </div>
  );
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const { user, loading, isOwnerReady, error } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, router, user]);

  useEffect(() => {
    if (error) {
      void signOutUser().finally(() => {
        router.replace("/login");
      });
    }
  }, [error, router]);

  if (loading) {
    return (
      <PageLoader
        description="Validando autenticacao e preparando o ambiente seguro do owner."
        fullScreen
        title="Carregando acesso interno"
      />
    );
  }

  if (!user) {
    return null;
  }

  if (error) {
    return <GuardState message={error} tone="danger" />;
  }

  if (!isOwnerReady) {
    return (
      <PageLoader
        description="Sincronizando o perfil seguro do owner antes de liberar o sistema."
        fullScreen
        title="Finalizando bootstrap"
      />
    );
  }

  return <>{children}</>;
}

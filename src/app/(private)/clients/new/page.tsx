import { AuthGuard } from "@/components/layout/AuthGuard";
import { AppShell } from "@/components/layout/AppShell";
import { ClientForm } from "@/components/clients/ClientForm";

export default function NewClientPage() {
  return (
    <AuthGuard>
      <AppShell
        subtitle="Cadastro do perfil base do cliente antes do controle anual."
        title="Novo cliente"
      >
        <ClientForm />
      </AppShell>
    </AuthGuard>
  );
}

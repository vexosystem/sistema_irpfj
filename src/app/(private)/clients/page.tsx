import { AuthGuard } from "@/components/layout/AuthGuard";
import { ClientsList } from "@/components/clients/ClientsList";

export default function ClientsPage() {
  return (
    <AuthGuard>
      <ClientsList />
    </AuthGuard>
  );
}

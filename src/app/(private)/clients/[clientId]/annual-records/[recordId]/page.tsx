"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Copy, ExternalLink, Eye, EyeOff, KeyRound, Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LoadingButton } from "@/components/ui/LoadingButton";
import { SectionLoader } from "@/components/ui/SectionLoader";
import { useAuth } from "@/hooks/useAuth";
import { deleteAnnualRecord, getAnnualRecord, getGovCredential } from "@/services/annualRecords.service";
import { AnnualRecord } from "@/types/annualRecord";
import { formatCurrency, formatDate } from "@/lib/utils/format";

type GovCredential = {
  govLogin: string;
  govPassword: string;
};

function getClientFeedbackKey(clientId: string) {
  return `client-feedback:${clientId}`;
}

function AnnualRecordDetailsContent() {
  const params = useParams<{ clientId: string; recordId: string }>();
  const router = useRouter();
  const { isOwnerReady } = useAuth();
  const [record, setRecord] = useState<AnnualRecord | null>(null);
  const [credential, setCredential] = useState<GovCredential | null>(null);
  const [revealedPassword, setRevealedPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [credentialLoading, setCredentialLoading] = useState(false);
  const [copyingField, setCopyingField] = useState<"login" | "password" | null>(null);
  const [deletingRecord, setDeletingRecord] = useState(false);

  useEffect(() => {
    if (!isOwnerReady) {
      return;
    }

    let active = true;
    setLoading(true);

    void getAnnualRecord(params.clientId, params.recordId)
      .then((result) => {
        if (!active) {
          return;
        }

        setRecord(result);
        setError(null);
      })
      .catch((loadError: unknown) => {
        if (!active) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "Nao foi possivel carregar o exercicio.");
      })
      .finally(() => {
        if (!active) {
          return;
        }

        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isOwnerReady, params.clientId, params.recordId]);

  async function copyValue(label: string, value: string) {
    try {
      setCopyingField(label === "Login gov" ? "login" : "password");
      await navigator.clipboard.writeText(value);
      setCopyFeedback(`${label} copiado.`);
      window.setTimeout(() => setCopyFeedback(null), 2000);
    } catch {
      setCopyFeedback(`Nao foi possivel copiar ${label.toLowerCase()}.`);
    } finally {
      setCopyingField(null);
    }
  }

  async function handleDeleteRecord() {
    if (!record) {
      return;
    }

    const confirmed = window.confirm(
      `Tem certeza que deseja excluir o exercicio ${record.year}?\n\nEsta acao nao pode ser desfeita.`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingRecord(true);

    try {
      await deleteAnnualRecord(params.clientId, record.id);

      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(
          getClientFeedbackKey(params.clientId),
          `Exercicio ${record.year} excluido com sucesso.`,
        );
      }

      router.push(`/clients/${params.clientId}`);
    } catch (deleteRecordError) {
      setError(
        deleteRecordError instanceof Error
          ? deleteRecordError.message
          : "Nao foi possivel excluir o exercicio.",
      );
    } finally {
      setDeletingRecord(false);
    }
  }

  return (
    <AppShell
      subtitle="Visualizacao completa do exercicio anual e das credenciais protegidas."
      title={`Exercicio ${record?.year ?? ""}`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Link className="w-full sm:w-auto" href={`/clients/${params.clientId}`}>
          <Button className="w-full sm:w-auto" type="button" variant="secondary">
            Voltar para clientes
          </Button>
        </Link>
        <Link className="w-full sm:w-auto" href={`/clients/${params.clientId}/annual-records/${params.recordId}/edit`}>
          <Button className="w-full sm:w-auto" type="button" variant="secondary">
            Editar exercicio
          </Button>
        </Link>
        <LoadingButton
          className="w-full sm:w-auto"
          loading={deletingRecord}
          loadingText="Excluindo exercicio..."
          onClick={() => void handleDeleteRecord()}
          type="button"
          variant="danger"
        >
          <Trash2 size={16} />
          Excluir exercicio
        </LoadingButton>
      </div>

      {error ? <Card className="border-danger/40 text-sm text-danger">{error}</Card> : null}

      {loading ? (
        <>
          <SectionLoader cards={4} lines={4} />
          <SectionLoader lines={4} />
        </>
      ) : null}

      {!loading && record ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)]">
          <Card className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-border bg-surface-strong p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Status</p>
                <p className="mt-2 text-lg font-semibold text-foreground">{record.status}</p>
              </div>
              <div className="rounded-2xl border border-border bg-surface-strong p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Resultado</p>
                <p className="mt-2 text-lg font-semibold text-foreground">
                  {record.taxResultType} {formatCurrency(record.taxResultAmount)}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-surface-strong p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Pagamento</p>
                <p className="mt-2 text-lg font-semibold text-foreground">
                  {record.servicePaid ? formatCurrency(record.servicePaidAmount) : "Nao pago"}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-surface-strong p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Atualizacao</p>
                <p className="mt-2 text-lg font-semibold text-foreground">{formatDate(record.updatedAt)}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-foreground">Login gov</p>
                <p className="mt-1 break-all text-sm text-muted">{record.govLogin}</p>
              </div>

              <div>
                <p className="text-sm font-semibold text-foreground">Link Google Drive</p>
                {record.driveLink ? (
                  <a
                    className="mt-2 inline-flex items-center gap-2 break-all text-sm font-medium text-primary hover:underline"
                    href={record.driveLink}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <ExternalLink size={16} />
                    Abrir documentos no Google Drive
                  </a>
                ) : (
                  <p className="mt-2 text-sm text-muted">Nenhum link do Google Drive informado.</p>
                )}
              </div>

              <div>
                <p className="text-sm font-semibold text-foreground">Retencao</p>
                <p className="mt-1 break-words text-sm text-muted">
                  {record.hasWithholding
                    ? record.withholdingNotes || "Informada sem observacao."
                    : "Nao possui retencao."}
                </p>
              </div>

              <div>
                <p className="text-sm font-semibold text-foreground">Observacao</p>
                <p className="mt-1 break-words text-sm text-muted">{record.observation || "-"}</p>
              </div>
            </div>
          </Card>

          <Card className="space-y-5">
            <div className="space-y-1">
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
                <KeyRound size={16} className="text-primary" />
                Credencial gov protegida
              </p>
              <p className="text-sm text-muted">
                A senha continua protegida no backend e e recuperada sob demanda.
              </p>
            </div>

            <LoadingButton
              className="w-full sm:w-auto"
              loading={credentialLoading}
              loadingText="Buscando credencial..."
              onClick={async () => {
                setCredentialLoading(true);

                try {
                  const nextCredential = await getGovCredential(params.clientId, params.recordId);
                  setCredential(nextCredential);
                  setRevealedPassword(false);
                  setError(null);
                } catch (credentialError) {
                  setError(
                    credentialError instanceof Error
                      ? credentialError.message
                      : "Nao foi possivel visualizar a credencial gov.",
                  );
                } finally {
                  setCredentialLoading(false);
                }
              }}
              type="button"
            >
              Carregar credencial gov
            </LoadingButton>

            {credential ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-border bg-surface-strong p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Login gov</p>
                      <p className="mt-2 break-all text-sm font-medium text-foreground">{credential.govLogin}</p>
                    </div>
                    <LoadingButton
                      className="w-full sm:w-auto"
                      loading={copyingField === "login"}
                      loadingText="Copiando..."
                      onClick={() => void copyValue("Login gov", credential.govLogin)}
                      type="button"
                      variant="secondary"
                    >
                      <Copy size={16} />
                      Copiar
                    </LoadingButton>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-surface-strong p-4">
                  <div className="flex flex-col gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Senha gov</p>
                      <p className="mt-2 break-all text-sm font-medium text-foreground">
                        {revealedPassword ? credential.govPassword : "************"}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                      <LoadingButton
                        className="w-full sm:w-auto"
                        disabled={credentialLoading}
                        loading={false}
                        onClick={() => setRevealedPassword((current) => !current)}
                        type="button"
                        variant="secondary"
                      >
                        {revealedPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        {revealedPassword ? "Ocultar" : "Mostrar"}
                      </LoadingButton>
                      <LoadingButton
                        className="w-full sm:w-auto"
                        loading={copyingField === "password"}
                        loadingText="Copiando..."
                        onClick={() => void copyValue("Senha gov", credential.govPassword)}
                        type="button"
                        variant="secondary"
                      >
                        <Copy size={16} />
                        Copiar
                      </LoadingButton>
                    </div>
                  </div>
                </div>

                {copyFeedback ? <p className="text-sm text-primary">{copyFeedback}</p> : null}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-surface-strong p-4 text-sm text-muted">
                Carregue a credencial para visualizar login e senha com opcoes de mostrar, ocultar e copiar.
              </div>
            )}
          </Card>
        </div>
      ) : null}

      {!loading && !record && !error ? (
        <Card className="text-sm text-muted">Exercicio anual nao encontrado ou indisponivel no momento.</Card>
      ) : null}
    </AppShell>
  );
}

export default function AnnualRecordDetailsPage() {
  return (
    <AuthGuard>
      <AnnualRecordDetailsContent />
    </AuthGuard>
  );
}

"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { annualRecordSchema, type AnnualRecordSchemaValues } from "@/lib/validators/annual-record";
import { AnnualRecord } from "@/types/annualRecord";
import { useAuth } from "@/hooks/useAuth";
import { createAnnualRecord, updateAnnualRecord } from "@/services/annualRecords.service";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { LoadingButton } from "@/components/ui/LoadingButton";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";

type AnnualRecordFormProps = {
  clientId: string;
  record?: AnnualRecord | null;
};

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Card className="space-y-5">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <p className="text-sm text-muted">{description}</p>
      </div>
      {children}
    </Card>
  );
}

export function AnnualRecordForm({ clientId, record }: AnnualRecordFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AnnualRecordSchemaValues>({
    resolver: zodResolver(annualRecordSchema),
    defaultValues: {
      year: record?.year ?? new Date().getFullYear(),
      govLogin: record?.govLogin ?? "",
      govPassword: "",
      updateGovPassword: record ? false : true,
      driveLink: record?.driveLink ?? "",
      hasWithholding: record?.hasWithholding ?? false,
      withholdingNotes: record?.withholdingNotes ?? "",
      taxResultType: record?.taxResultType ?? "sem_resultado",
      taxResultAmount: record?.taxResultAmount ?? 0,
      status: record?.status ?? "pendente",
      servicePaid: record?.servicePaid ?? false,
      servicePaidAmount: record?.servicePaidAmount ?? 0,
      observation: record?.observation ?? "",
    },
  });

  const updateGovPassword = watch("updateGovPassword");
  const servicePaid = watch("servicePaid");

  const onSubmit = handleSubmit(async (values) => {
    if (!user) {
      setError("Sua sessao expirou. Entre novamente.");
      return;
    }

    setError(null);

    try {
      if (record) {
        await updateAnnualRecord(clientId, record.id, values, user.uid);
      } else {
        await createAnnualRecord(clientId, values, user.uid);
      }

      router.push(`/clients/${clientId}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Nao foi possivel salvar o exercicio.");
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Exercicio anual</p>
          <h2 className="text-2xl font-bold text-foreground">
            {record ? `Editar exercicio ${record.year}` : "Novo exercicio"}
          </h2>
        </div>

        <Link href={`/clients/${clientId}`}>
          <Button type="button" variant="secondary">
            Voltar para clientes
          </Button>
        </Link>
      </div>

      <form className="space-y-6" onSubmit={onSubmit}>
        <SectionCard
          description="Ano, status fiscal e dados principais da declaracao."
          title="Dados fiscais"
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <FormField label="Ano" error={errors.year?.message}>
              <Input type="number" {...register("year", { valueAsNumber: true })} />
            </FormField>

            <FormField label="Status" error={errors.status?.message}>
              <Select {...register("status")}>
                <option value="pendente">Pendente</option>
                <option value="aguardando_documentos">Aguardando documentos</option>
                <option value="em_andamento">Em andamento</option>
                <option value="finalizado">Finalizado</option>
              </Select>
            </FormField>

            <FormField label="Tipo de resultado" error={errors.taxResultType?.message}>
              <Select {...register("taxResultType")}>
                <option value="sem_resultado">Sem resultado</option>
                <option value="a_pagar">A pagar</option>
                <option value="a_restituir">A restituir</option>
              </Select>
            </FormField>

            <FormField label="Valor do resultado" error={errors.taxResultAmount?.message}>
              <Input step="0.01" type="number" {...register("taxResultAmount", { valueAsNumber: true })} />
            </FormField>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex items-center gap-3 rounded-2xl border border-border bg-surface-strong px-4 py-3 text-sm text-foreground">
              <Checkbox {...register("hasWithholding")} />
              Possui retencao
            </label>

            <FormField label="Observacao da retencao" error={errors.withholdingNotes?.message}>
              <Textarea {...register("withholdingNotes")} />
            </FormField>
          </div>

          <FormField label="Observacao geral" error={errors.observation?.message}>
            <Textarea {...register("observation")} />
          </FormField>
        </SectionCard>

        <SectionCard
          description="Credenciais protegidas por Cloud Functions para o portal gov."
          title="Credenciais gov"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Login gov" error={errors.govLogin?.message}>
              <Input {...register("govLogin")} />
            </FormField>

            <label className="flex items-center gap-3 rounded-2xl border border-border bg-surface-strong px-4 py-3 text-sm text-foreground">
              <Checkbox {...register("updateGovPassword")} />
              Atualizar senha gov
            </label>
          </div>

          <FormField
            error={errors.govPassword?.message}
            hint={record ? "Preencha apenas quando quiser substituir a senha atual." : "Obrigatorio no primeiro cadastro."}
            label="Senha gov"
          >
            <Input
              placeholder={updateGovPassword ? "Digite a senha gov" : "Senha mantida sem alteracao"}
              type="password"
              {...register("govPassword")}
            />
          </FormField>
        </SectionCard>

        <SectionCard
          description="Use este campo apenas quando houver pasta ou arquivo compartilhado no Drive."
          title="Documentos"
        >
          <FormField
            error={errors.driveLink?.message}
            hint="Opcional. Se preencher, informe um link valido do Google Drive."
            label="Link Google Drive"
          >
            <Input placeholder="https://drive.google.com/... (opcional)" {...register("driveLink")} />
          </FormField>
        </SectionCard>

        <SectionCard
          description="Controle operacional de recebimento e fechamento financeiro."
          title="Pagamento"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex items-center gap-3 rounded-2xl border border-border bg-surface-strong px-4 py-3 text-sm text-foreground">
              <Checkbox {...register("servicePaid")} />
              Servico pago
            </label>

            <FormField label="Valor pago" error={errors.servicePaidAmount?.message}>
              <Input
                disabled={!servicePaid}
                step="0.01"
                type="number"
                {...register("servicePaidAmount", { valueAsNumber: true })}
              />
            </FormField>
          </div>
        </SectionCard>

        {error ? <Card className="border-danger/40 text-sm text-danger">{error}</Card> : null}

        <div className="flex flex-wrap gap-3">
          <LoadingButton
            loading={isSubmitting}
            loadingText={record ? "Atualizando exercicio..." : "Criando exercicio..."}
            type="submit"
          >
            {record ? "Salvar alteracoes" : "Criar exercicio"}
          </LoadingButton>
          <Button
            disabled={isSubmitting}
            onClick={() => router.push(`/clients/${clientId}`)}
            type="button"
            variant="secondary"
          >
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}

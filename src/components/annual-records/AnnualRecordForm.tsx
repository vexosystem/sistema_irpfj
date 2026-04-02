"use client";

import { useState } from "react";
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
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";

type AnnualRecordFormProps = {
  clientId: string;
  record?: AnnualRecord | null;
};

export function AnnualRecordForm({ clientId, record }: AnnualRecordFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AnnualRecordSchemaValues>({
    resolver: zodResolver(annualRecordSchema),
    defaultValues: {
      year: record?.year ?? new Date().getFullYear(),
      govLogin: record?.govLogin ?? "",
      govPassword: "",
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

  const onSubmit = handleSubmit(async (values) => {
    if (!user) {
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
    <Card className="space-y-4">
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Ano" error={errors.year?.message}>
            <Input type="number" {...register("year", { valueAsNumber: true })} />
          </FormField>

          <FormField label="Login gov" error={errors.govLogin?.message}>
            <Input {...register("govLogin")} />
          </FormField>

          <FormField label="Senha gov" error={errors.govPassword?.message}>
            <Input placeholder={record ? "Preencha para atualizar" : ""} type="password" {...register("govPassword")} />
          </FormField>

          <FormField label="Status" error={errors.status?.message}>
            <Select {...register("status")}>
              <option value="pendente">Pendente</option>
              <option value="aguardando_documentos">Aguardando documentos</option>
              <option value="em_andamento">Em andamento</option>
              <option value="finalizado">Finalizado</option>
            </Select>
          </FormField>

          <FormField label="Resultado" error={errors.taxResultType?.message}>
            <Select {...register("taxResultType")}>
              <option value="sem_resultado">Sem resultado</option>
              <option value="a_pagar">A pagar</option>
              <option value="a_restituir">A restituir</option>
            </Select>
          </FormField>

          <FormField label="Valor do resultado" error={errors.taxResultAmount?.message}>
            <Input step="0.01" type="number" {...register("taxResultAmount", { valueAsNumber: true })} />
          </FormField>

          <label className="flex items-center gap-2 rounded-md border bg-slate-50 px-3 py-2 text-sm">
            <Checkbox {...register("hasWithholding")} />
            Possui retencao
          </label>

          <label className="flex items-center gap-2 rounded-md border bg-slate-50 px-3 py-2 text-sm">
            <Checkbox {...register("servicePaid")} />
            Servico pago
          </label>

          <FormField label="Valor pago" error={errors.servicePaidAmount?.message}>
            <Input step="0.01" type="number" {...register("servicePaidAmount", { valueAsNumber: true })} />
          </FormField>
        </div>

        <FormField label="Observacao de retencao" error={errors.withholdingNotes?.message}>
          <Textarea {...register("withholdingNotes")} />
        </FormField>

        <FormField label="Observacao geral" error={errors.observation?.message}>
          <Textarea {...register("observation")} />
        </FormField>

        {error ? <p className="text-sm text-danger">{error}</p> : null}

        <div className="flex gap-2">
          <Button disabled={isSubmitting} type="submit">
            Salvar exercicio
          </Button>
          <Button onClick={() => router.push(`/clients/${clientId}`)} type="button" variant="secondary">
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  );
}

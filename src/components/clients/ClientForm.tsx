"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { clientSchema, type ClientSchemaValues } from "@/lib/validators/client";
import { Client } from "@/types/client";
import { useAuth } from "@/hooks/useAuth";
import { createClient, updateClient } from "@/services/clients.service";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { LoadingButton } from "@/components/ui/LoadingButton";
import { Textarea } from "@/components/ui/Textarea";
import { formatCpf, onlyDigits } from "@/lib/utils/format";

type ClientFormProps = {
  client?: Client;
};

export function ClientForm({ client }: ClientFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ClientSchemaValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      fullName: client?.fullName ?? "",
      cpf: client?.cpfDigits ?? "",
      email: client?.email ?? "",
      phone: client?.phone ?? "",
      secondaryPhone: client?.secondaryPhone ?? "",
      isActive: client?.isActive ?? true,
      notesGeneral: client?.notesGeneral ?? "",
    },
  });

  const cpfField = register("cpf");
  const cpfValue = watch("cpf");

  const onSubmit = handleSubmit(async (values) => {
    if (!user) {
      setError("Sua sessao expirou. Entre novamente.");
      return;
    }

    setError(null);

    try {
      const payload = {
        ...values,
        email: values.email ?? "",
      };

      if (client) {
        await updateClient(client.id, payload, user.uid);
      } else {
        await createClient(payload, user.uid);
      }

      router.push("/clients");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Nao foi possivel salvar.");
    }
  });

  return (
    <div className="space-y-6">
      <Card className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Cadastro</p>
        <h2 className="text-2xl font-bold text-foreground">{client ? "Editar cliente" : "Novo cliente"}</h2>
        <p className="text-sm text-muted">
          Centralize o perfil fiscal e os dados de contato antes de lancar os exercicios anuais.
        </p>
      </Card>

      <Card className="space-y-5">
        <form className="space-y-5" onSubmit={onSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Nome completo" error={errors.fullName?.message}>
              <Input {...register("fullName")} />
            </FormField>

            <FormField label="CPF" error={errors.cpf?.message}>
              <Input
                name={cpfField.name}
                onBlur={cpfField.onBlur}
                ref={cpfField.ref}
                value={formatCpf(cpfValue ?? "")}
                onChange={(event) => setValue("cpf", onlyDigits(event.target.value), { shouldValidate: true })}
              />
            </FormField>

            <FormField label="Telefone" error={errors.phone?.message}>
              <Input {...register("phone")} />
            </FormField>

            <FormField label="Telefone secundario" error={errors.secondaryPhone?.message}>
              <Input {...register("secondaryPhone")} />
            </FormField>

            <FormField label="Email" error={errors.email?.message}>
              <Input {...register("email")} />
            </FormField>

            <label className="flex items-center gap-3 rounded-2xl border border-border bg-surface-strong px-4 py-3 text-sm text-foreground">
              <Checkbox {...register("isActive")} />
              Cliente ativo
            </label>
          </div>

          <FormField
            error={errors.notesGeneral?.message}
            hint="Use este campo para pontos de atencao, contexto financeiro ou observacoes operacionais."
            label="Observacoes"
          >
            <Textarea {...register("notesGeneral")} />
          </FormField>

          {error ? <div className="text-sm text-danger">{error}</div> : null}

          <div className="flex flex-wrap gap-3">
            <LoadingButton
              loading={isSubmitting}
              loadingText={client ? "Atualizando cliente..." : "Salvando cliente..."}
              type="submit"
            >
              Salvar cliente
            </LoadingButton>
            <Button disabled={isSubmitting} onClick={() => router.push("/clients")} type="button" variant="secondary">
              Cancelar
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

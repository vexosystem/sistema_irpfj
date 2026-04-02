"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useAuth } from "@/hooks/useAuth";
import {
  deleteDocument,
  getDocumentDownloadUrl,
  listDocuments,
  uploadDocument,
} from "@/services/documents.service";
import { documentUploadSchema, type DocumentUploadSchemaValues } from "@/lib/validators/document";
import { ClientDocument } from "@/types/document";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";

type DocumentsSectionProps = {
  clientId: string;
  recordId: string;
};

export function DocumentsSection({ clientId, recordId }: DocumentsSectionProps) {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<ClientDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<DocumentUploadSchemaValues>({
    resolver: zodResolver(documentUploadSchema),
  });
  const fileField = register("file");

  async function refresh() {
    setLoading(true);
    const nextDocuments = await listDocuments(clientId, recordId);
    setDocuments(nextDocuments);
    setLoading(false);
  }

  useEffect(() => {
    void refresh();
  }, [clientId, recordId]);

  const onSubmit = handleSubmit(async (values) => {
    if (!user) {
      return;
    }

    await uploadDocument(clientId, recordId, values.file, values.category, user.uid);
    reset();
    await refresh();
  });

  return (
    <Card className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Documentos</h2>
        <p className="text-sm text-muted">Upload e download de PDF, JPG e PNG.</p>
      </div>

      <form className="grid gap-4 md:grid-cols-[1fr_2fr_auto]" onSubmit={onSubmit}>
        <FormField label="Categoria" error={errors.category?.message}>
          <Input {...register("category")} />
        </FormField>

        <FormField label="Arquivo" error={errors.file?.message}>
          <Input
            name={fileField.name}
            onBlur={fileField.onBlur}
            ref={fileField.ref}
            type="file"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                setValue("file", file, { shouldValidate: true });
              }
            }}
          />
        </FormField>

        <div className="flex items-end">
          <Button disabled={isSubmitting} type="submit">
            Enviar
          </Button>
        </div>
      </form>

      <div className="space-y-3">
        {documents.map((document) => (
          <div className="flex items-center justify-between rounded-md border p-3" key={document.id}>
            <div>
              <p className="font-medium">{document.name}</p>
              <p className="text-xs text-muted">{document.category}</p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={async () => {
                  const url = await getDocumentDownloadUrl(document.storagePath);
                  window.open(url, "_blank", "noopener,noreferrer");
                }}
                type="button"
                variant="secondary"
              >
                Download
              </Button>
              <Button
                onClick={async () => {
                  await deleteDocument(clientId, recordId, document.id, document.storagePath);
                  await refresh();
                }}
                type="button"
                variant="danger"
              >
                Excluir
              </Button>
            </div>
          </div>
        ))}

        {!loading && documents.length === 0 ? (
          <p className="text-sm text-muted">Nenhum documento enviado.</p>
        ) : null}
      </div>
    </Card>
  );
}

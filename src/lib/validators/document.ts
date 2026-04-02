import { z } from "zod";

const maxFileSize = 10 * 1024 * 1024;
const supportedTypes = ["application/pdf", "image/jpeg", "image/png"];

export const documentUploadSchema = z.object({
  category: z.string().min(1, "Informe a categoria."),
  file: z
    .custom<File>((value) => value instanceof File, "Selecione um arquivo valido.")
    .refine((file) => file.size <= maxFileSize, "Arquivo acima do limite de 10MB.")
    .refine((file) => supportedTypes.includes(file.type), "Tipo de arquivo nao permitido."),
});

export type DocumentUploadSchemaValues = z.infer<typeof documentUploadSchema>;

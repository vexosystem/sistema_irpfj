import { z } from "zod";

const optionalDriveLinkSchema = z
  .string()
  .trim()
  .refine(
    (value) => value.length === 0 || z.string().url().safeParse(value).success,
    "Informe um link valido do Google Drive.",
  );

export const annualRecordSchema = z
  .object({
    year: z.coerce.number().int().min(2000).max(2100),
    govLogin: z.string().min(1, "Informe o login gov."),
    govPassword: z.string().default(""),
    updateGovPassword: z.boolean(),
    driveLink: optionalDriveLinkSchema.default(""),
    hasWithholding: z.boolean(),
    withholdingNotes: z.string().default(""),
    taxResultType: z.enum(["a_pagar", "a_restituir", "sem_resultado"]),
    taxResultAmount: z.coerce.number().min(0),
    status: z.enum(["pendente", "aguardando_documentos", "em_andamento", "finalizado"]),
    servicePaid: z.boolean(),
    servicePaidAmount: z.coerce.number().min(0),
    observation: z.string().default(""),
  })
  .superRefine((value, context) => {
    if (value.updateGovPassword && value.govPassword.trim().length === 0) {
      context.addIssue({
        code: "custom",
        message: "Informe a senha gov para salvar a credencial.",
        path: ["govPassword"],
      });
    }

    if (value.servicePaid && value.servicePaidAmount <= 0) {
      context.addIssue({
        code: "custom",
        message: "Informe o valor recebido quando o servico estiver pago.",
        path: ["servicePaidAmount"],
      });
    }
  });

export type AnnualRecordSchemaValues = z.infer<typeof annualRecordSchema>;

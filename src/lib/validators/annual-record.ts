import { z } from "zod";

export const annualRecordSchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  govLogin: z.string().min(1, "Informe o login gov."),
  govPassword: z.string().optional(),
  hasWithholding: z.boolean(),
  withholdingNotes: z.string().default(""),
  taxResultType: z.enum(["a_pagar", "a_restituir", "sem_resultado"]),
  taxResultAmount: z.coerce.number().min(0),
  status: z.enum(["pendente", "aguardando_documentos", "em_andamento", "finalizado"]),
  servicePaid: z.boolean(),
  servicePaidAmount: z.coerce.number().min(0),
  observation: z.string().default(""),
});

export type AnnualRecordSchemaValues = z.infer<typeof annualRecordSchema>;

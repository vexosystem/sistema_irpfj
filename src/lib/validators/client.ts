import { z } from "zod";
import { onlyDigits } from "@/lib/utils/format";

export const clientSchema = z.object({
  fullName: z.string().min(3, "Informe o nome completo."),
  cpf: z
    .string()
    .transform((value) => onlyDigits(value))
    .refine((value) => value.length === 11, "CPF obrigatorio com 11 digitos."),
  email: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((value) => !value || z.string().email().safeParse(value).success, "Email invalido."),
  phone: z.string().default(""),
  secondaryPhone: z.string().default(""),
  isActive: z.boolean(),
  notesGeneral: z.string().default(""),
});

export type ClientSchemaValues = z.infer<typeof clientSchema>;

import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Informe um email valido."),
  password: z.string().min(6, "Informe a senha."),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

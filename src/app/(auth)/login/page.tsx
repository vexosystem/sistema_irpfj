"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { loginSchema, type LoginFormValues } from "@/lib/validators/auth";
import { signInWithEmail } from "@/lib/auth/auth-client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);

    try {
      await signInWithEmail(values.email, values.password);
      router.push("/dashboard");
    } catch (submitError) {
      setError("Nao foi possivel realizar o login.");
      console.error(submitError);
    }
  });

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Acesso ao sistema</h1>
          <p className="text-sm text-muted">Autenticacao do usuario owner.</p>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          <FormField label="Email" error={errors.email?.message}>
            <Input type="email" {...register("email")} />
          </FormField>

          <FormField label="Senha" error={errors.password?.message}>
            <Input type="password" {...register("password")} />
          </FormField>

          {error ? <p className="text-sm text-danger">{error}</p> : null}

          <Button className="w-full" disabled={isSubmitting} type="submit">
            Entrar
          </Button>
        </form>
      </Card>
    </main>
  );
}

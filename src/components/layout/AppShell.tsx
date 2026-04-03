"use client";

import Link from "next/link";
import { ReactNode, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { signOutUser } from "@/lib/auth/auth-client";
import { cn } from "@/lib/utils/cn";
import { useTheme } from "@/hooks/useTheme";
import { Button } from "@/components/ui/Button";
import { LoadingButton } from "@/components/ui/LoadingButton";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/clients", label: "Clientes" },
];

type AppShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
};

export function AppShell({ title, subtitle, children, actions }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, mounted, toggleTheme } = useTheme();
  const [isSigningOut, setIsSigningOut] = useState(false);

  return (
    <div className="min-h-screen bg-app-gradient">
      <header className="sticky top-0 z-20 border-b border-border/70 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">Sistema Imposto de Renda</p>
              <div className="min-w-0">
                <h1 className="break-words text-2xl font-bold tracking-tight text-foreground">{title}</h1>
                {subtitle ? <p className="text-sm text-muted">{subtitle}</p> : null}
              </div>
            </div>

            <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:justify-end">
              <Button className="w-full sm:w-auto" onClick={toggleTheme} type="button" variant="secondary">
                {mounted && theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
                {mounted && theme === "light" ? "Modo escuro" : "Modo claro"}
              </Button>
              <LoadingButton
                className="w-full sm:w-auto"
                loading={isSigningOut}
                loadingText="Saindo..."
                onClick={async () => {
                  setIsSigningOut(true);

                  try {
                    await signOutUser();
                    router.push("/login");
                  } finally {
                    setIsSigningOut(false);
                  }
                }}
                type="button"
                variant="secondary"
              >
                Sair
              </LoadingButton>
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <nav className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
              {links.map((link) => (
                <Link
                  key={link.href}
                  className={cn(
                    "whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition",
                    pathname.startsWith(link.href)
                      ? "bg-primary text-slate-950"
                      : "border border-border bg-surface-strong text-secondary hover:bg-surface",
                  )}
                  href={link.href}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {actions ? (
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-start lg:justify-end [&>*]:w-full sm:[&>*]:w-auto">
                {actions}
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl min-w-0 space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}

"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { signOutUser } from "@/lib/auth/auth-client";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/Button";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/clients", label: "Clientes" },
];

type AppShellProps = {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
};

export function AppShell({ title, children, actions }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted">Sistema IRPFJ</p>
            <h1 className="text-xl font-semibold">{title}</h1>
          </div>

          <div className="flex items-center gap-2">
            <nav className="flex items-center gap-2">
              {links.map((link) => (
                <Link
                  key={link.href}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm",
                    pathname.startsWith(link.href) ? "bg-primary text-white" : "text-secondary",
                  )}
                  href={link.href}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <Button
              onClick={async () => {
                await signOutUser();
                router.push("/login");
              }}
              type="button"
              variant="secondary"
            >
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-6 py-6">
        {actions ? <div className="flex justify-end">{actions}</div> : null}
        {children}
      </main>
    </div>
  );
}

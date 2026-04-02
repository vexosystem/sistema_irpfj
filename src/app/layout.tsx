import "./globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";
import { AppProviders } from "@/components/layout/AppProviders";

export const metadata: Metadata = {
  title: "Sistema IRPF",
  description: "Sistema interno para gestao de clientes e imposto de renda",
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="text-foreground">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}

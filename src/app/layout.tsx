import "./globals.css";
import type { Metadata, Viewport } from "next";
import { ReactNode } from "react";
import { AppProviders } from "@/components/layout/AppProviders";

export const metadata: Metadata = {
  title: "Sistema IRPF",
  description: "Sistema interno para gestao de clientes e imposto de renda",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="min-h-screen overflow-x-hidden text-foreground antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}

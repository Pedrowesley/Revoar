import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Revoar Admin",
  description: "Moderação de parceiros e hotéis",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen antialiased">
        <header className="border-b border-border bg-white">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
            <Link href="/" className="text-lg font-semibold text-primary">
              Revoar Admin
            </Link>
            <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
              Painel
            </Link>
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
              Entrar
            </Link>
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}

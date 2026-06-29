import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Revoar Extranet",
  description: "Cadastre seus hotéis na Revoar",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen antialiased">
        <header className="border-b border-border bg-white">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
            <Link href="/" className="text-lg font-semibold text-primary">
              Revoar Extranet
            </Link>
            <nav className="flex gap-4 text-sm">
              <Link href="/login" className="text-muted-foreground hover:text-foreground">
                Entrar
              </Link>
              <Link
                href="/signup"
                className="rounded-md bg-primary px-3 py-1.5 text-primary-foreground hover:opacity-90"
              >
                Cadastrar
              </Link>
            </nav>
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}

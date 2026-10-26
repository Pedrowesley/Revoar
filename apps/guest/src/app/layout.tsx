import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Revoar",
  description: "Reserve hotel e pousada",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${plusJakarta.variable} min-h-screen font-sans antialiased`}>
        <header className="sticky top-0 z-30 border-b border-border bg-surface">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
            <Link href="/" className="flex h-11 items-center text-lg font-bold">
              Revoar
            </Link>
            <Link href="/conta/viagens" className="flex h-11 items-center px-2 text-sm font-medium text-muted-foreground">
              Minhas viagens
            </Link>
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}

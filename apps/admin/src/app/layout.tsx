import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { AppHeader } from "@/components/layout/app-header";
import { SessionGate } from "@/components/layout/session-gate";
import { QueryProvider } from "@/components/providers/query-provider";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Revoar Admin",
  description: "Moderação de parceiros e hotéis",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${plusJakarta.variable} min-h-screen font-sans antialiased`}>
        <QueryProvider>
          <AppHeader />
          <SessionGate>
            <main>{children}</main>
          </SessionGate>
        </QueryProvider>
      </body>
    </html>
  );
}

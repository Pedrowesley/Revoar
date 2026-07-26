import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { AppHeader } from "@/components/layout/app-header";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Revoar Extranet",
  description: "Cadastre seus hotéis na Revoar",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${plusJakarta.variable} min-h-screen font-sans antialiased`}>
        <AppHeader />
        <main>{children}</main>
      </body>
    </html>
  );
}

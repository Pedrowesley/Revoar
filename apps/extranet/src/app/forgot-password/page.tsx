"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Surface } from "@/components/ui/surface";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await apiFetch("/extranet/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível enviar o link.");
    }
  }

  return (
    <PageShell width="sm" className="flex min-h-[calc(100vh-4rem)] items-center py-12">
      <Surface className="w-full p-8">
        <h1 className="mb-2 text-2xl font-bold">Esqueci a senha</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Informe o e-mail da conta. Se ele existir, enviamos um link de uso único.
        </p>
        {sent ? (
          <p>Se o e-mail existir, enviamos o link.</p>
        ) : (
          <form className="space-y-4" onSubmit={onSubmit}>
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button type="submit" className="w-full">
              Enviar link
            </Button>
          </form>
        )}
        <p className="mt-5 text-center text-sm">
          <Link href="/login" className="font-medium text-primary">
            Voltar ao login
          </Link>
        </p>
      </Surface>
    </PageShell>
  );
}

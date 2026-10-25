"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageSkeleton } from "@/components/ui/skeleton";
import { Surface } from "@/components/ui/surface";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<PageSkeleton rows={3} />}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await apiFetch("/extranet/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      });
      router.push("/login");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível redefinir a senha.");
    }
  }

  return (
    <PageShell width="sm" className="flex min-h-[calc(100vh-4rem)] items-center py-12">
      <Surface className="w-full p-8">
        <h1 className="mb-6 text-2xl font-bold">Nova senha</h1>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" className="w-full">
            Salvar senha
          </Button>
        </form>
        <p className="mt-5 text-center text-sm">
          <Link href="/login" className="font-medium text-primary">
            Voltar ao login
          </Link>
        </p>
      </Surface>
    </PageShell>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { partnerLoginSchema, PartnerLoginInput } from "@revoar/shared";
import { apiFetch, AuthResponse, ApiError } from "@/lib/api";
import { saveToken } from "@/lib/auth";
import { extranetKeys } from "@/lib/query-keys";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldError, Label } from "@/components/ui/label";
import { Surface } from "@/components/ui/surface";

export default function LoginPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PartnerLoginInput>({
    resolver: zodResolver(partnerLoginSchema),
  });

  async function onSubmit(data: PartnerLoginInput) {
    setServerError(null);
    try {
      const response = await apiFetch<AuthResponse>("/extranet/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      });
      saveToken(response.accessToken);
      queryClient.removeQueries({ queryKey: extranetKeys.me });
      router.push("/dashboard");
    } catch (error) {
      if (error instanceof ApiError) {
        setServerError(error.message);
      } else {
        setServerError("Não foi possível entrar. Tente novamente.");
      }
    }
  }

  return (
    <PageShell width="sm" className="flex min-h-[calc(100vh-4rem)] items-center py-12">
      <Surface className="w-full p-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          Extranet
        </p>
        <h1 className="mb-1 text-2xl font-bold tracking-tight">Entrar</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Acesse sua conta de parceiro hoteleiro.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" autoComplete="email" {...register("email")} />
            <FieldError message={errors.email?.message} />
          </div>

          <div>
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              {...register("password")}
            />
            <FieldError message={errors.password?.message} />
          </div>

          {serverError && (
            <p className="rounded-lg bg-danger-soft p-3 text-sm text-danger">{serverError}</p>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm">
          <Link href="/forgot-password" className="font-medium text-primary hover:underline">
            Esqueci a senha
          </Link>
        </p>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          Ainda não tem conta?{" "}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            Cadastrar
          </Link>
        </p>
      </Surface>
    </PageShell>
  );
}

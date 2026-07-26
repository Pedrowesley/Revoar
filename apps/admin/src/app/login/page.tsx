"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { adminLoginSchema, AdminLoginInput } from "@revoar/shared";
import { apiFetch, AdminAuthResponse, ApiError } from "@/lib/api";
import { saveToken } from "@/lib/auth";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldError, Label } from "@/components/ui/label";
import { Surface } from "@/components/ui/surface";

export default function AdminLoginPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AdminLoginInput>({
    resolver: zodResolver(adminLoginSchema),
  });

  async function onSubmit(data: AdminLoginInput) {
    setServerError(null);
    try {
      const response = await apiFetch<AdminAuthResponse>("/admin/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      });
      saveToken(response.accessToken);
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
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">Admin</p>
        <h1 className="mb-1 text-2xl font-bold tracking-tight">Entrar</h1>
        <p className="mb-6 text-sm text-muted-foreground">Acesso restrito à equipe Revoar.</p>

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
      </Surface>
    </PageShell>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { partnerLoginSchema, PartnerLoginInput } from "@revoar/shared";
import { apiFetch, AuthResponse, ApiError } from "@/lib/api";
import { saveToken } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldError, Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
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
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="rounded-xl border border-border p-8">
        <h1 className="mb-1 text-2xl font-bold">Entrar</h1>
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
            <Input id="password" type="password" autoComplete="current-password" {...register("password")} />
            <FieldError message={errors.password?.message} />
          </div>

          {serverError && (
            <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{serverError}</p>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Ainda não tem conta?{" "}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            Cadastrar
          </Link>
        </p>
      </div>
    </div>
  );
}

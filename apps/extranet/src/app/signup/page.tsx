"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { partnerSignupSchema, PartnerSignupInput } from "@revoar/shared";
import { apiFetch, AuthResponse } from "@/lib/api";
import { formatCnpj, formatPhone, saveToken } from "@/lib/auth";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldError, Label } from "@/components/ui/label";
import { Surface } from "@/components/ui/surface";
import { ApiError } from "@/lib/api";

export default function SignupPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PartnerSignupInput>({
    resolver: zodResolver(partnerSignupSchema),
    defaultValues: {
      legalName: "",
      tradeName: "",
      cnpj: "",
      email: "",
      phone: "",
      contactName: "",
      password: "",
      name: "",
    },
  });

  const cnpj = watch("cnpj");
  const phone = watch("phone");

  async function onSubmit(data: PartnerSignupInput) {
    setServerError(null);
    try {
      const response = await apiFetch<AuthResponse>("/extranet/auth/signup", {
        method: "POST",
        body: JSON.stringify(data),
      });
      saveToken(response.accessToken);
      router.push("/dashboard");
    } catch (error) {
      if (error instanceof ApiError) {
        setServerError(error.message);
      } else {
        setServerError("Não foi possível criar a conta. Tente novamente.");
      }
    }
  }

  return (
    <PageShell width="sm" className="max-w-lg py-12">
      <Surface className="p-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          Extranet
        </p>
        <h1 className="mb-1 text-2xl font-bold tracking-tight">Cadastrar parceiro</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Crie sua conta com CNPJ. Após aprovação da Revoar, você poderá cadastrar hotéis.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="legalName">Razão social *</Label>
            <Input id="legalName" {...register("legalName")} />
            <FieldError message={errors.legalName?.message} />
          </div>

          <div>
            <Label htmlFor="tradeName">Nome fantasia</Label>
            <Input id="tradeName" {...register("tradeName")} />
          </div>

          <div>
            <Label htmlFor="cnpj">CNPJ *</Label>
            <Input
              id="cnpj"
              inputMode="numeric"
              value={cnpj}
              onChange={(e) => setValue("cnpj", formatCnpj(e.target.value), { shouldValidate: true })}
              placeholder="00.000.000/0000-00"
            />
            <FieldError message={errors.cnpj?.message} />
          </div>

          <div>
            <Label htmlFor="contactName">Responsável legal *</Label>
            <Input id="contactName" {...register("contactName")} />
            <FieldError message={errors.contactName?.message} />
          </div>

          <div>
            <Label htmlFor="name">Seu nome (login) *</Label>
            <Input id="name" {...register("name")} />
            <FieldError message={errors.name?.message} />
          </div>

          <div>
            <Label htmlFor="email">E-mail *</Label>
            <Input id="email" type="email" autoComplete="email" {...register("email")} />
            <FieldError message={errors.email?.message} />
          </div>

          <div>
            <Label htmlFor="phone">Telefone *</Label>
            <Input
              id="phone"
              inputMode="tel"
              value={phone}
              onChange={(e) => setValue("phone", formatPhone(e.target.value), { shouldValidate: true })}
              placeholder="(11) 99999-9999"
            />
            <FieldError message={errors.phone?.message} />
          </div>

          <div>
            <Label htmlFor="password">Senha *</Label>
            <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
            <FieldError message={errors.password?.message} />
          </div>

          {serverError && (
            <p className="rounded-lg bg-danger-soft p-3 text-sm text-danger">{serverError}</p>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Criando conta..." : "Criar conta"}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          Já tem conta?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Entrar
          </Link>
        </p>
      </Surface>
    </PageShell>
  );
}

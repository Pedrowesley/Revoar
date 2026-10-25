"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, ApiError, PartnerProfile } from "@/lib/api";
import { expireSession, formatCnpj, formatPhone, getToken } from "@/lib/auth";
import { extranetKeys } from "@/lib/query-keys";
import { PageShell } from "@/components/layout/page-shell";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageSkeleton } from "@/components/ui/skeleton";
import { Surface } from "@/components/ui/surface";

const SECTIONS = [
  { id: "pessoal", label: "Pessoal" },
  { id: "empresa", label: "Empresa" },
  { id: "contato", label: "Contato" },
  { id: "revisar", label: "Revisar" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

const STATUS_LABELS: Record<PartnerProfile["partner"]["status"], string> = {
  PENDING: "Aguardando aprovação",
  ACTIVE: "Conta ativa",
  SUSPENDED: "Conta suspensa",
};

function confirmationLabel(value: string | null) {
  if (!value) return "Ainda não confirmou";
  return `Confirmou em ${new Date(value).toLocaleString("pt-BR")}`;
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<PageSkeleton rows={4} />}>
      <ProfileSheet />
    </Suspense>
  );
}

function ProfileSheet() {
  const router = useRouter();
  const params = useSearchParams();
  const queryClient = useQueryClient();
  const section = (SECTIONS.find((item) => item.id === params.get("section"))?.id ?? "pessoal") as SectionId;
  const [token, setToken] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const authToken = getToken();
    if (!authToken) {
      router.replace("/login");
      return;
    }
    setToken(authToken);
  }, [router]);

  const profileQuery = useQuery({
    queryKey: extranetKeys.me,
    enabled: Boolean(token),
    queryFn: () => apiFetch<PartnerProfile>("/extranet/auth/me", { token: getToken()! }),
    retry: false,
  });

  useEffect(() => {
    if (profileQuery.error instanceof ApiError && profileQuery.error.status === 401) {
      expireSession();
    }
  }, [profileQuery.error]);

  const save = useMutation({
    mutationFn: (body: Record<string, string>) =>
      apiFetch("/extranet/profile", {
        method: "PATCH",
        token: getToken()!,
        body: JSON.stringify(body),
      }),
    onSuccess: async () => {
      setConfirmed(false);
      setError(null);
      await queryClient.invalidateQueries({ queryKey: extranetKeys.me });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "Não foi possível salvar."),
  });

  const upload = useMutation({
    mutationFn: async ({ kind, file }: { kind: "avatar" | "logo"; file: File }) => {
      const presign = await apiFetch<{ uploadUrl: string; publicUrl: string }>(
        `/extranet/profile/${kind}/presign`,
        {
          method: "POST",
          token: getToken()!,
          body: JSON.stringify({
            contentType: file.type,
            fileSize: file.size,
            fileName: file.name,
          }),
        },
      );
      const put = await fetch(presign.uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      if (!put.ok) throw new Error("Não foi possível enviar a foto.");
      const field = kind === "avatar" ? "avatarUrl" : "logoUrl";
      return apiFetch("/extranet/profile", {
        method: "PATCH",
        token: getToken()!,
        body: JSON.stringify({ [field]: presign.publicUrl }),
      });
    },
    onSuccess: async () => {
      setConfirmed(false);
      setError(null);
      await queryClient.invalidateQueries({ queryKey: extranetKeys.me });
    },
    onError: (err) => setError(err instanceof Error ? err.message : "Não foi possível enviar a foto."),
  });

  const confirm = useMutation({
    mutationFn: () =>
      apiFetch("/extranet/profile/confirm", { method: "POST", token: getToken()! }),
    onSuccess: async () => {
      setError(null);
      await queryClient.invalidateQueries({ queryKey: extranetKeys.me });
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : "Não foi possível confirmar."),
  });

  if (!token || profileQuery.isLoading || !profileQuery.data) return <PageSkeleton rows={4} />;

  const profile = profileQuery.data;
  const ready =
    Boolean(profile.name) &&
    Boolean(profile.partner.phone) &&
    Boolean(profile.partner.contactName) &&
    Boolean(profile.avatarUrl) &&
    Boolean(profile.partner.logoUrl);

  function onSave(event: FormEvent<HTMLFormElement>, fields: string[]) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const body: Record<string, string> = {};
    for (const field of fields) {
      const value = String(data.get(field) ?? "").trim();
      if (value) body[field] = value;
    }
    save.mutate(body);
  }

  return (
    <PageShell>
      <Surface className="mb-6 flex items-center gap-4 p-5">
        {profile.avatarUrl ? (
          <img src={profile.avatarUrl} alt="Avatar" className="h-24 w-24 rounded-full object-cover" />
        ) : (
          <span className="flex h-24 w-24 items-center justify-center rounded-full bg-primary-soft text-2xl font-bold text-primary">
            {profile.name.slice(0, 1)}
          </span>
        )}
        {profile.partner.logoUrl ? (
          <img src={profile.partner.logoUrl} alt="Logo" className="h-16 w-16 rounded-lg object-cover" />
        ) : null}
        <div>
          <p className="text-lg font-semibold">{profile.name}</p>
          <p className="text-sm text-muted-foreground">{profile.email}</p>
          <p>{profile.partner.legalName}</p>
          <p className="text-sm text-muted-foreground">CNPJ {formatCnpj(profile.partner.cnpj)}</p>
          <p className="text-sm text-muted-foreground">{profile.partner.tradeName ?? "—"}</p>
          <p className="text-sm">Telefone: {formatPhone(profile.partner.phone)}</p>
          <p className="text-sm">Responsável: {profile.partner.contactName}</p>
          <p className="text-sm">{confirmationLabel(profile.partner.detailsConfirmedAt)}</p>
          <p className="mt-2 inline-flex rounded-full bg-primary-soft px-2.5 py-1 text-xs font-medium text-primary">
            {STATUS_LABELS[profile.partner.status]}
          </p>
        </div>
      </Surface>

      <nav className="mb-6 flex flex-wrap gap-2">
        {SECTIONS.map((item) => (
          <Link
            key={item.id}
            href={`/profile?section=${item.id}`}
            className={
              section === item.id
                ? "rounded-full bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
                : "rounded-full bg-muted px-3 py-1.5 text-sm font-medium text-muted-foreground"
            }
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      <Surface className="p-5">
        {section === "pessoal" && (
          <form className="space-y-4" onSubmit={(event) => onSave(event, ["name"])}>
            <div>
              <Label htmlFor="name">Nome</Label>
              <Input id="name" name="name" defaultValue={profile.name} />
            </div>
            <div>
              <p className="text-sm font-medium">E-mail</p>
              <p>{profile.email}</p>
            </div>
            <div>
              <Label htmlFor="avatar">Avatar</Label>
              <Input
                id="avatar"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) upload.mutate({ kind: "avatar", file });
                }}
              />
            </div>
            <Button type="submit" disabled={save.isPending}>
              Salvar
            </Button>
          </form>
        )}

        {section === "empresa" && (
          <form className="space-y-4" onSubmit={(event) => onSave(event, ["tradeName"])}>
            <div>
              <p className="text-sm font-medium">Razão social</p>
              <p>{profile.partner.legalName}</p>
            </div>
            <div>
              <p className="text-sm font-medium">CNPJ</p>
              <p>{formatCnpj(profile.partner.cnpj)}</p>
            </div>
            <div>
              <Label htmlFor="tradeName">Nome fantasia</Label>
              <Input id="tradeName" name="tradeName" defaultValue={profile.partner.tradeName ?? ""} />
            </div>
            <div>
              <Label htmlFor="logo">Logo</Label>
              <Input
                id="logo"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) upload.mutate({ kind: "logo", file });
                }}
              />
            </div>
            <Button type="submit" disabled={save.isPending}>
              Salvar
            </Button>
          </form>
        )}

        {section === "contato" && (
          <form className="space-y-4" onSubmit={(event) => onSave(event, ["phone", "contactName"])}>
            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" name="phone" defaultValue={profile.partner.phone} />
            </div>
            <div>
              <Label htmlFor="contactName">Responsável</Label>
              <Input id="contactName" name="contactName" defaultValue={profile.partner.contactName} />
            </div>
            <Button type="submit" disabled={save.isPending}>
              Salvar
            </Button>
          </form>
        )}

        {section === "revisar" && (
          <div className="space-y-3 text-sm">
            <p>{confirmationLabel(profile.partner.detailsConfirmedAt)}</p>
            <p>Nome: {profile.name}</p>
            <p>E-mail: {profile.email}</p>
            <p>Razão social: {profile.partner.legalName}</p>
            <p>CNPJ: {formatCnpj(profile.partner.cnpj)}</p>
            <p>Nome fantasia: {profile.partner.tradeName ?? "—"}</p>
            <p>Telefone: {formatPhone(profile.partner.phone)}</p>
            <p>Responsável: {profile.partner.contactName}</p>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(event) => setConfirmed(event.target.checked)}
              />
              Confirmo os dados da ficha
            </label>
            <Button type="button" disabled={!confirmed || !ready || confirm.isPending} onClick={() => confirm.mutate()}>
              Confirmar
            </Button>
          </div>
        )}
      </Surface>
    </PageShell>
  );
}

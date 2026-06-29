"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createHotelSchema, CreateHotelInput } from "@revoar/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldError, Label } from "@/components/ui/label";
import { Select, Textarea } from "@/components/ui/textarea";
import { BRAZIL_STATES, STAR_OPTIONS } from "@/lib/hotel.const";
import {
  fetchAddressByCep,
  formatHotelPhone,
  formatZipCode,
  HotelDetail,
} from "@/lib/hotel";

type HotelFormProps = {
  defaultValues?: Partial<CreateHotelInput>;
  onSubmit: (data: CreateHotelInput) => Promise<void>;
  submitLabel: string;
  readOnly?: boolean;
  partialEdit?: boolean;
  hotel?: HotelDetail;
};

export function HotelForm({
  defaultValues,
  onSubmit,
  submitLabel,
  readOnly = false,
  partialEdit = false,
  hotel,
}: HotelFormProps) {
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);
  const criticalLocked = readOnly || partialEdit;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateHotelInput>({
    resolver: zodResolver(createHotelSchema),
    defaultValues: {
      name: "",
      description: "",
      addressLine: "",
      city: "",
      state: "",
      zipCode: "",
      phone: "",
      checkInTime: "14:00",
      checkOutTime: "12:00",
      ...defaultValues,
    },
  });

  const zipCode = watch("zipCode");
  const phone = watch("phone");

  async function handleCepBlur() {
    if (readOnly || partialEdit) return;
    setCepError(null);
    setCepLoading(true);

    const address = await fetchAddressByCep(zipCode);
    setCepLoading(false);

    if (!address) {
      setCepError("CEP não encontrado");
      return;
    }

    if (address.addressLine) setValue("addressLine", address.addressLine, { shouldValidate: true });
    setValue("city", address.city, { shouldValidate: true });
    setValue("state", address.state, { shouldValidate: true });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Dados do hotel</h2>

        <div>
          <Label htmlFor="name">Nome do hotel *</Label>
          <Input id="name" disabled={criticalLocked} {...register("name")} />
          <FieldError message={errors.name?.message} />
          {hotel?.slug && (
            <p className="mt-1 text-xs text-muted-foreground">URL: revoar.com.br/hotel/{hotel.slug}</p>
          )}
        </div>

        <div>
          <Label htmlFor="description">Descrição *</Label>
          <Textarea id="description" disabled={readOnly} rows={4} {...register("description")} />
          <FieldError message={errors.description?.message} />
        </div>

        <div>
          <Label htmlFor="starRating">Classificação (estrelas)</Label>
          <Select
            id="starRating"
            disabled={readOnly}
            {...register("starRating", {
              setValueAs: (value) => (value === "" ? undefined : Number(value)),
            })}
          >
            <option value="">Não informado</option>
            {STAR_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? "estrela" : "estrelas"}
              </option>
            ))}
          </Select>
          <FieldError message={errors.starRating?.message} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="checkInTime">Check-in</Label>
            <Input id="checkInTime" type="time" disabled={readOnly} {...register("checkInTime")} />
            <FieldError message={errors.checkInTime?.message} />
          </div>
          <div>
            <Label htmlFor="checkOutTime">Check-out</Label>
            <Input id="checkOutTime" type="time" disabled={readOnly} {...register("checkOutTime")} />
            <FieldError message={errors.checkOutTime?.message} />
          </div>
        </div>

        <div>
          <Label htmlFor="phone">Telefone do hotel *</Label>
          <Input
            id="phone"
            inputMode="tel"
            disabled={readOnly}
            value={phone}
            onChange={(e) => setValue("phone", formatHotelPhone(e.target.value), { shouldValidate: true })}
          />
          <FieldError message={errors.phone?.message} />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Endereço</h2>

        <div>
          <Label htmlFor="zipCode">CEP *</Label>
          <div className="flex gap-2">
            <Input
              id="zipCode"
              inputMode="numeric"
              disabled={criticalLocked}
              value={zipCode}
              onChange={(e) => setValue("zipCode", formatZipCode(e.target.value), { shouldValidate: true })}
              onBlur={handleCepBlur}
              placeholder="00000-000"
            />
            {cepLoading && (
              <span className="flex items-center text-xs text-muted-foreground">Buscando...</span>
            )}
          </div>
          <FieldError message={errors.zipCode?.message ?? cepError ?? undefined} />
        </div>

        <div>
          <Label htmlFor="addressLine">Endereço *</Label>
          <Input id="addressLine" disabled={criticalLocked} {...register("addressLine")} />
          <FieldError message={errors.addressLine?.message} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="city">Cidade *</Label>
            <Input id="city" disabled={criticalLocked} {...register("city")} />
            <FieldError message={errors.city?.message} />
          </div>
          <div>
            <Label htmlFor="state">UF *</Label>
            <Select id="state" disabled={criticalLocked} {...register("state")}>
              <option value="">Selecione</option>
              {BRAZIL_STATES.map((uf) => (
                <option key={uf} value={uf}>
                  {uf}
                </option>
              ))}
            </Select>
            <FieldError message={errors.state?.message} />
          </div>
        </div>
      </section>

      {!readOnly && (
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : submitLabel}
        </Button>
      )}
    </form>
  );
}

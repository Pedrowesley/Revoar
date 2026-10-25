"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ROOM_AMENITIES,
  ROOM_AMENITY_LABELS,
  RoomAmenity,
  roomTypeSchema,
  RoomTypeInput,
} from "@revoar/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldError, Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toaster";

type RoomFormProps = {
  defaultValues?: Partial<RoomTypeInput>;
  onSubmit: (data: RoomTypeInput) => Promise<void>;
  submitLabel: string;
  readOnly?: boolean;
  children?: React.ReactNode;
};

export function RoomForm({
  defaultValues,
  onSubmit,
  submitLabel,
  readOnly = false,
  children,
}: RoomFormProps) {
  const toast = useToast();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RoomTypeInput>({
    resolver: zodResolver(roomTypeSchema),
    defaultValues: {
      name: "",
      description: "",
      maxAdults: 2,
      maxChildren: 0,
      maxOccupancy: 2,
      bedConfiguration: "",
      amenities: [],
      ...defaultValues,
    },
  });

  const selectedAmenities = watch("amenities") ?? [];

  function toggleAmenity(amenity: RoomAmenity) {
    if (readOnly) return;
    const current = selectedAmenities;
    const next = current.includes(amenity)
      ? current.filter((item) => item !== amenity)
      : [...current, amenity];
    setValue("amenities", next, { shouldValidate: true });
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit, () => {
        toast.error("Não foi possível salvar o quarto", "Revise os campos destacados.");
      })}
      className="space-y-6"
    >
      <div>
        <Label htmlFor="name">Nome do quarto *</Label>
        <Input id="name" disabled={readOnly} placeholder="Suíte Deluxe Vista Mar" {...register("name")} />
        <FieldError message={errors.name?.message} />
      </div>

      <div>
        <Label htmlFor="description">Descrição *</Label>
        <Textarea
          id="description"
          disabled={readOnly}
          rows={4}
          placeholder="Descreva o quarto para o viajante..."
          {...register("description")}
        />
        <FieldError message={errors.description?.message} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="maxAdults">Adultos máx. *</Label>
          <Input
            id="maxAdults"
            type="number"
            min={1}
            disabled={readOnly}
            {...register("maxAdults", { valueAsNumber: true })}
          />
          <FieldError message={errors.maxAdults?.message} />
        </div>
        <div>
          <Label htmlFor="maxChildren">Crianças máx. *</Label>
          <Input
            id="maxChildren"
            type="number"
            min={0}
            disabled={readOnly}
            {...register("maxChildren", { valueAsNumber: true })}
          />
          <FieldError message={errors.maxChildren?.message} />
        </div>
        <div>
          <Label htmlFor="maxOccupancy">Ocupação máx. *</Label>
          <Input
            id="maxOccupancy"
            type="number"
            min={1}
            disabled={readOnly}
            {...register("maxOccupancy", { valueAsNumber: true })}
          />
          <FieldError message={errors.maxOccupancy?.message} />
        </div>
      </div>

      <div>
        <Label htmlFor="bedConfiguration">Configuração de camas *</Label>
        <Input
          id="bedConfiguration"
          disabled={readOnly}
          placeholder="1 cama king"
          {...register("bedConfiguration")}
        />
        <FieldError message={errors.bedConfiguration?.message} />
      </div>

      <div>
        <Label htmlFor="sizeSqm">Área (m²)</Label>
        <Input
          id="sizeSqm"
          type="number"
          min={1}
          disabled={readOnly}
          {...register("sizeSqm", {
            setValueAs: (value) => (value === "" || value === null ? undefined : Number(value)),
          })}
        />
        <FieldError message={errors.sizeSqm?.message} />
      </div>

      <div>
        <Label>Comodidades *</Label>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {ROOM_AMENITIES.map((amenity) => {
            const selected = selectedAmenities.includes(amenity);
            return (
              <button
                key={amenity}
                type="button"
                disabled={readOnly}
                onClick={() => toggleAmenity(amenity)}
                className={cn(
                  "rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                  selected
                    ? "border-primary bg-primary/5 font-medium"
                    : "border-border hover:bg-muted",
                  readOnly && "cursor-default opacity-70",
                )}
              >
                {ROOM_AMENITY_LABELS[amenity]}
              </button>
            );
          })}
        </div>
        <FieldError message={errors.amenities?.message} />
      </div>

      {children}

      {!readOnly && (
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : submitLabel}
        </Button>
      )}
    </form>
  );
}

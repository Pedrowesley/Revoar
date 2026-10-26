"use client";

import { FormEvent, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { HOTEL_AMENITIES } from "@revoar/shared";
import { apiFetch, ApiError } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useHotel } from "@/hooks/use-hotel";
import { HotelDetailHeader } from "@/components/hotels/hotel-detail-header";
import { HotelDetailNav } from "@/components/hotels/hotel-detail-nav";
import { PageShell } from "@/components/layout/page-shell";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PageSkeleton } from "@/components/ui/skeleton";
import { Surface } from "@/components/ui/surface";
import { useToast } from "@/components/ui/toaster";

type CalendarDay = {
  date: string;
  unitsForSale: number;
  blockedUnits: number;
  blockReason: "UNAVAILABLE" | "RENTED_OFFLINE" | null;
  committedUnits: number;
  freeUnits: number;
  configured: boolean;
};

type CalendarRoom = {
  id: string;
  name: string;
  bookingMode: "INHERIT" | "INSTANT" | "REQUEST";
  ratePlans: {
    id: string;
    name: string;
    cancellationPolicy: string;
    mealPlan: string;
    minNights: number;
  }[];
  days: CalendarDay[];
};

type CalendarResponse = {
  hotel: {
    id: string;
    bookingMode: "INSTANT" | "REQUEST";
    houseRules: string | null;
    amenities: string[];
  };
  rooms: CalendarRoom[];
};

const AMENITY_LABELS: Record<(typeof HOTEL_AMENITIES)[number], string> = {
  POOL: "Piscina",
  PARKING: "Estacionamento",
  BREAKFAST_AREA: "Salão de café",
  GYM: "Academia",
  RESTAURANT: "Restaurante",
  BEACH: "Praia",
  FRONT_DESK_24H: "Recepção 24h",
};

const MONTHS = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];
const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function monthBounds(year: number, month: number) {
  const last = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const pad = (value: number) => String(value).padStart(2, "0");
  return {
    from: `${year}-${pad(month + 1)}-01`,
    to: `${year}-${pad(month + 1)}-${pad(last)}`,
  };
}

function nightState(day: CalendarDay) {
  if (!day.configured) return "Sem configuração";
  if (day.blockedUnits > 0 && day.freeUnits === 0) return "Bloqueada";
  return "Aberta";
}

function confirmedLabel(count: number) {
  if (count === 1) return "1 confirmada";
  return `${count} confirmadas`;
}

export default function HotelAvailabilityPage() {
  const toast = useToast();
  const paramsId = useParams<{ id: string }>().id;
  useRequireAuth();
  const { hotel, loading, error } = useHotel(paramsId);
  const [monthCursor, setMonthCursor] = useState(() => {
    const now = new Date();
    return { year: now.getUTCFullYear(), month: now.getUTCMonth() };
  });
  const range = useMemo(() => monthBounds(monthCursor.year, monthCursor.month), [monthCursor]);
  const queryClient = useQueryClient();
  const token = getToken();

  const calendarQuery = useQuery({
    queryKey: ["extranet", "calendar", paramsId, range.from],
    enabled: Boolean(token && paramsId),
    placeholderData: keepPreviousData,
    queryFn: () =>
      apiFetch<CalendarResponse>(
        `/extranet/hotels/${paramsId}/calendar?from=${range.from}&to=${range.to}`,
        { token: token! },
      ),
  });

  const [roomId, setRoomId] = useState<string>("");
  const selectedRoom = calendarQuery.data?.rooms.find((room) => room.id === (roomId || calendarQuery.data.rooms[0]?.id));

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ["extranet", "calendar", paramsId] });
  }

  if (loading || calendarQuery.isLoading) {
    return (
      <PageShell>
        <PageSkeleton />
      </PageShell>
    );
  }

  if (!hotel || error) {
    return (
      <PageShell>
        <Alert variant="danger">{error ?? "Hotel não encontrado"}</Alert>
      </PageShell>
    );
  }

  return (
    <PageShell width="xl">
      <HotelDetailHeader hotel={hotel} />
      <HotelDetailNav
        hotelId={hotel.id}
        activeTab="disponibilidade"
        roomCount={hotel.roomCount}
        imageCount={hotel.imageCount}
        hasPrimaryImage={hotel.hasPrimaryImage}
      />

      {calendarQuery.data && (
        <HotelModeForm
          hotelId={hotel.id}
          initial={calendarQuery.data.hotel}
          onSaved={async () => {
            toast.success("Modo de reserva salvo");
            await refresh();
          }}
        />
      )}

      <Surface className="mt-6 p-5">
        <h2 className="text-lg font-semibold">Tarifas e calendário</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Abra as noites em que quer receber hóspede. Alugou fora do Revoar? Bloqueie essas noites.
        </p>
        {calendarQuery.data && calendarQuery.data.rooms.length > 0 && (
          <label className="mt-4 block text-sm font-medium">
            Quarto
            <select
              className="mt-1 h-10 w-full rounded-lg border border-border bg-surface px-3"
              value={selectedRoom?.id ?? ""}
              onChange={(event) => setRoomId(event.target.value)}
            >
              {calendarQuery.data.rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name}
                </option>
              ))}
            </select>
          </label>
        )}
        {selectedRoom && (
          <div className="mt-4 grid gap-6 lg:grid-cols-2">
            <RatePlanForm
              hotelId={hotel.id}
              roomId={selectedRoom.id}
              onCreated={async () => {
                toast.success("Tarifa criada");
                await refresh();
              }}
            />
            <RoomModeForm
              hotelId={hotel.id}
              room={selectedRoom}
              onSaved={async () => {
                toast.success("Modo do quarto salvo");
                await refresh();
              }}
            />
            <MonthGrid
              hotelId={hotel.id}
              room={selectedRoom}
              title={`${MONTHS[monthCursor.month]} de ${monthCursor.year}`}
              monthFrom={range.from}
              onShift={(delta) =>
                setMonthCursor((current) => {
                  const next = new Date(Date.UTC(current.year, current.month + delta, 1));
                  return { year: next.getUTCFullYear(), month: next.getUTCMonth() };
                })
              }
              onSaved={async (message) => {
                toast.success(message);
                await refresh();
              }}
            />
          </div>
        )}
      </Surface>
    </PageShell>
  );
}

function HotelModeForm({
  hotelId,
  initial,
  onSaved,
}: {
  hotelId: string;
  initial: CalendarResponse["hotel"];
  onSaved: () => Promise<void>;
}) {
  const [bookingMode, setBookingMode] = useState(initial.bookingMode);
  const [houseRules, setHouseRules] = useState(initial.houseRules ?? "");
  const [amenities, setAmenities] = useState<string[]>(initial.amenities ?? []);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await apiFetch(`/extranet/hotels/${hotelId}/booking-mode`, {
        method: "PATCH",
        token: getToken()!,
        body: JSON.stringify({ bookingMode, houseRules, amenities }),
      });
      await onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível salvar");
    }
  }

  return (
    <Surface className="p-5">
      <h2 className="text-lg font-semibold">Como o hóspede fecha</h2>
      <form onSubmit={onSubmit} className="mt-4 grid gap-4">
        <div className="flex flex-wrap gap-3 text-sm">
          <label className="flex items-center gap-2">
            <input type="radio" checked={bookingMode === "INSTANT"} onChange={() => setBookingMode("INSTANT")} />
            Reserva imediata
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" checked={bookingMode === "REQUEST"} onChange={() => setBookingMode("REQUEST")} />
            Sob consulta
          </label>
        </div>
        <label className="text-sm font-medium">
          Regras da casa
          <textarea
            className="mt-1 min-h-20 w-full rounded-lg border border-border px-3 py-2"
            value={houseRules}
            onChange={(event) => setHouseRules(event.target.value)}
          />
        </label>
        <div className="flex flex-wrap gap-3 text-sm">
          {HOTEL_AMENITIES.map((amenity) => (
            <label key={amenity} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={amenities.includes(amenity)}
                onChange={() =>
                  setAmenities((current) =>
                    current.includes(amenity) ? current.filter((item) => item !== amenity) : [...current, amenity],
                  )
                }
              />
              {AMENITY_LABELS[amenity]}
            </label>
          ))}
        </div>
        {error && <Alert variant="danger">{error}</Alert>}
        <Button type="submit" className="w-fit">
          Salvar modo
        </Button>
      </form>
    </Surface>
  );
}

function RatePlanForm({ hotelId, roomId, onCreated }: { hotelId: string; roomId: string; onCreated: () => Promise<void> }) {
  const [error, setError] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch(`/extranet/hotels/${hotelId}/rate-plans`, {
        method: "POST",
        token: getToken()!,
        body: JSON.stringify(body),
      }),
    onSuccess: () => onCreated(),
  });

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError(null);
    mutation.mutate(
      {
        roomTypeId: roomId,
        name: String(form.get("name")),
        cancellationPolicy: String(form.get("cancellationPolicy")),
        mealPlan: String(form.get("mealPlan")),
        minNights: Number(form.get("minNights") || 1),
        payAtProperty: String(form.get("payAtProperty") || "") || null,
      },
      { onError: (err) => setError(err instanceof ApiError ? err.message : "Não foi possível criar a tarifa") },
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 text-sm">
      <h3 className="font-semibold">Nova tarifa</h3>
      <input name="name" required placeholder="Nome da tarifa" className="h-10 rounded-lg border border-border px-3" />
      <select name="cancellationPolicy" className="h-10 rounded-lg border border-border px-3">
        <option value="FLEXIBLE">Flexível</option>
        <option value="MODERATE">Moderada</option>
        <option value="STRICT">Restrita</option>
        <option value="NON_REFUNDABLE">Não reembolsável</option>
      </select>
      <select name="mealPlan" className="h-10 rounded-lg border border-border px-3">
        <option value="ROOM_ONLY">Só o quarto</option>
        <option value="BREAKFAST">Café da manhã</option>
        <option value="HALF_BOARD">Meia pensão</option>
      </select>
      <input name="minNights" type="number" min={1} defaultValue={1} className="h-10 rounded-lg border border-border px-3" />
      <input name="payAtProperty" placeholder="Pago no local (opcional)" className="h-10 rounded-lg border border-border px-3" />
      {error && <Alert variant="danger">{error}</Alert>}
      <Button type="submit" disabled={mutation.isPending}>
        Criar tarifa
      </Button>
    </form>
  );
}

function RoomModeForm({
  hotelId,
  room,
  onSaved,
}: {
  hotelId: string;
  room: CalendarRoom;
  onSaved: () => Promise<void>;
}) {
  const [mode, setMode] = useState(room.bookingMode);
  return (
    <form
      className="grid content-start gap-3 text-sm"
      onSubmit={async (event) => {
        event.preventDefault();
        await apiFetch(`/extranet/hotels/${hotelId}/rooms/${room.id}/booking-mode`, {
          method: "PATCH",
          token: getToken()!,
          body: JSON.stringify({ bookingMode: mode }),
        });
        await onSaved();
      }}
    >
      <h3 className="font-semibold">Modo deste quarto</h3>
      <select className="h-10 rounded-lg border border-border px-3" value={mode} onChange={(event) => setMode(event.target.value as CalendarRoom["bookingMode"])}>
        <option value="INHERIT">Herdar o hotel</option>
        <option value="INSTANT">Reserva imediata</option>
        <option value="REQUEST">Sob consulta</option>
      </select>
      <p className="text-muted-foreground">
        Tarifas: {room.ratePlans.map((plan) => plan.name).join(", ") || "nenhuma ainda"}
      </p>
      <Button type="submit" variant="outline">
        Salvar modo do quarto
      </Button>
    </form>
  );
}

function MonthGrid({
  hotelId,
  room,
  title,
  monthFrom,
  onShift,
  onSaved,
}: {
  hotelId: string;
  room: CalendarRoom;
  title: string;
  monthFrom: string;
  onShift: (delta: number) => void;
  onSaved: (message: string) => Promise<void>;
}) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [reason, setReason] = useState<"RENTED_OFFLINE" | "UNAVAILABLE">("RENTED_OFFLINE");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const ready = room.days.some((day) => day.date === monthFrom);
  const selected = room.days.find((day) => day.date === selectedDate) ?? null;
  const leading = new Date(`${monthFrom}T00:00:00Z`).getUTCDay();

  async function blockNight() {
    if (!selected) return;
    setError(null);
    setSaving(true);
    try {
      await apiFetch(`/extranet/hotels/${hotelId}/calendar`, {
        method: "POST",
        token: getToken()!,
        body: JSON.stringify({
          action: "block",
          roomTypeId: room.id,
          from: selected.date,
          to: selected.date,
          blockAll: true,
          blockReason: reason,
        }),
      });
      await onSaved("Noite bloqueada");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível bloquear a noite");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section aria-label="Grade do mês" className="grid gap-3 lg:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-semibold capitalize">{title}</h3>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => onShift(-1)}>
            Mês anterior
          </Button>
          <Button type="button" variant="outline" onClick={() => onShift(1)}>
            Próximo mês
          </Button>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        Cada noite mostra sem configuração, aberta ou bloqueada, e as unidades já confirmadas. Bloquear o que ainda está livre não cancela a reserva.
      </p>
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
        {WEEKDAYS.map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>
      {ready ? (
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: leading }, (_, index) => (
            <div key={`empty-${index}`} />
          ))}
          {room.days.map((day) => {
            const state = nightState(day);
            const confirmed = confirmedLabel(day.committedUnits);
            return (
              <button
                key={day.date}
                type="button"
                aria-pressed={day.date === selectedDate}
                aria-label={`${day.date}, ${state}, ${confirmed}`}
                onClick={() => setSelectedDate(day.date)}
                className={cn(
                  "flex min-h-16 flex-col items-start rounded-lg border px-1.5 py-1 text-left text-[11px] leading-tight",
                  day.date === selectedDate && "border-primary ring-2 ring-primary/30",
                  !day.configured && "border-dashed text-muted-foreground",
                  state === "Bloqueada" && "bg-muted",
                )}
              >
                <span className="font-semibold">{Number(day.date.slice(8))}</span>
                <span>{state}</span>
                <span>{confirmed}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Carregando a grade.</p>
      )}
      {selected && (
        <div className="grid max-w-md gap-3 rounded-xl border border-border p-4 text-sm">
          <h4 className="font-semibold">Noite {selected.date}</h4>
          <p>
            {nightState(selected)}. {confirmedLabel(selected.committedUnits)}.
          </p>
          <label className="grid gap-1 font-medium">
            Motivo do bloqueio
            <select
              className="h-10 rounded-lg border border-border px-3"
              value={reason}
              onChange={(event) => setReason(event.target.value as "RENTED_OFFLINE" | "UNAVAILABLE")}
            >
              <option value="RENTED_OFFLINE">Alugado fora do Revoar</option>
              <option value="UNAVAILABLE">Não posso receber</option>
            </select>
          </label>
          {error && <Alert variant="danger">{error}</Alert>}
          <Button type="button" className="w-fit" disabled={saving} onClick={() => void blockNight()}>
            Bloquear esta noite
          </Button>
        </div>
      )}
    </section>
  );
}

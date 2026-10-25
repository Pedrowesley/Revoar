"use client";

import { FormEvent, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

function monthRange() {
  const start = new Date();
  const from = start.toISOString().slice(0, 10);
  const end = new Date(start.getTime() + 45 * 86_400_000);
  return { from, to: end.toISOString().slice(0, 10) };
}

export default function HotelAvailabilityPage() {
  const toast = useToast();
  const paramsId = useParams<{ id: string }>().id;
  useRequireAuth();
  const { hotel, loading, error } = useHotel(paramsId);
  const range = useMemo(() => monthRange(), []);
  const queryClient = useQueryClient();
  const token = getToken();

  const calendarQuery = useQuery({
    queryKey: ["extranet", "calendar", paramsId, range.from],
    enabled: Boolean(token && paramsId),
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
            <CalendarForm
              hotelId={hotel.id}
              room={selectedRoom}
              onSaved={async (message) => {
                toast.success(message);
                await refresh();
              }}
            />
            <DayList days={selectedRoom.days} />
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

function CalendarForm({
  hotelId,
  room,
  onSaved,
}: {
  hotelId: string;
  room: CalendarRoom;
  onSaved: (message: string) => Promise<void>;
}) {
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const action = String(form.get("action"));
    setError(null);
    const body =
      action === "open"
        ? {
            action,
            roomTypeId: room.id,
            ratePlanId: String(form.get("ratePlanId")),
            from: String(form.get("from")),
            to: String(form.get("to")),
            priceCents: Math.round(Number(form.get("price")) * 100),
            unitsForSale: Number(form.get("unitsForSale")),
          }
        : {
            action,
            roomTypeId: room.id,
            from: String(form.get("from")),
            to: String(form.get("to")),
            blockAll: form.get("blockAll") === "on",
            blockedUnits: form.get("blockAll") === "on" ? undefined : Number(form.get("blockedUnits")),
            blockReason: String(form.get("blockReason")),
          };
    try {
      await apiFetch(`/extranet/hotels/${hotelId}/calendar`, {
        method: "POST",
        token: getToken()!,
        body: JSON.stringify(body),
      });
      await onSaved(action === "open" ? "Noites abertas" : "Noites bloqueadas");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Não foi possível atualizar o calendário");
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 text-sm lg:col-span-2">
      <h3 className="font-semibold">Abrir ou bloquear um intervalo</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <input name="from" type="date" required className="h-10 rounded-lg border border-border px-3" />
        <input name="to" type="date" required className="h-10 rounded-lg border border-border px-3" />
        <select name="action" className="h-10 rounded-lg border border-border px-3">
          <option value="open">Abrir para venda</option>
          <option value="block">Bloquear</option>
        </select>
        <select name="ratePlanId" className="h-10 rounded-lg border border-border px-3">
          {room.ratePlans.map((plan) => (
            <option key={plan.id} value={plan.id}>
              {plan.name}
            </option>
          ))}
        </select>
        <input name="price" type="number" min={10} step="0.01" placeholder="Diária em R$" className="h-10 rounded-lg border border-border px-3" />
        <input name="unitsForSale" type="number" min={1} placeholder="Quartos à venda" className="h-10 rounded-lg border border-border px-3" />
        <input name="blockedUnits" type="number" min={0} placeholder="Unidades bloqueadas" className="h-10 rounded-lg border border-border px-3" />
        <select name="blockReason" className="h-10 rounded-lg border border-border px-3">
          <option value="RENTED_OFFLINE">Alugado fora do Revoar</option>
          <option value="UNAVAILABLE">Não posso receber</option>
        </select>
      </div>
      <label className="flex items-center gap-2">
        <input name="blockAll" type="checkbox" />
        Bloquear o que ainda está livre no dia inteiro
      </label>
      {error && <Alert variant="danger">{error}</Alert>}
      <Button type="submit" className="w-fit">
        Aplicar no calendário
      </Button>
    </form>
  );
}

function DayList({ days }: { days: CalendarDay[] }) {
  return (
    <div className="grid max-h-80 grid-cols-2 gap-2 overflow-auto text-xs sm:grid-cols-3 lg:col-span-2">
      {days.map((day) => (
        <div key={day.date} className="rounded-lg border border-border px-2 py-2">
          <p className="font-semibold">{day.date.slice(8)}/{day.date.slice(5, 7)}</p>
          <p className="text-muted-foreground">
            {!day.configured
              ? "Sem configuração"
              : day.freeUnits > 0
                ? `${day.freeUnits} livre(s)`
                : day.blockedUnits > 0
                  ? day.blockReason === "RENTED_OFFLINE"
                    ? "Bloqueada · fora"
                    : "Bloqueada"
                  : "Ocupada"}
          </p>
        </div>
      ))}
    </div>
  );
}

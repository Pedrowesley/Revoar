"use client";

import { useState } from "react";
import Image from "next/image";
import { BedDouble, CalendarDays, ChevronLeft, CreditCard, MapPin, QrCode, Search, Star, Users } from "lucide-react";
import { Surface } from "@/components/ui/surface";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "buscar", label: "Buscar", icon: Search },
  { id: "reservar", label: "Reservar", icon: BedDouble },
  { id: "pagar", label: "Pagar", icon: CreditCard },
  { id: "avaliar", label: "Avaliar", icon: Star },
] as const;

type TabId = (typeof TABS)[number]["id"];

const STAY = {
  destination: "Fortaleza",
  dates: "12–15 nov",
  guests: "2 adultos",
  nights: 3,
};

type DemoRoom = {
  id: string;
  name: string;
  beds: string;
  guests: string;
  price: number;
  image: string;
  imageAlt: string;
};

type DemoHotel = {
  id: string;
  name: string;
  area: string;
  image: string;
  imageAlt: string;
  rooms: DemoRoom[];
};

const HOTELS: DemoHotel[] = [
  {
    id: "atlantico",
    name: "Pousada Atlântico",
    area: "Praia de Iracema, Fortaleza",
    image: "/landing/hero-pousada.jpg",
    imageAlt: "Piscina da Pousada Atlântico ao entardecer",
    rooms: [
      {
        id: "duplo",
        name: "Quarto duplo",
        beds: "1 cama queen",
        guests: "2 hóspedes",
        price: 280,
        image: "/landing/hero-quarto.jpg",
        imageAlt: "Quarto duplo com cama queen e luz quente",
      },
      {
        id: "varanda",
        name: "Suíte com varanda",
        beds: "1 cama king",
        guests: "2 hóspedes",
        price: 420,
        image: "/landing/hero-piscina.jpg",
        imageAlt: "Suíte com vista para a piscina e as palmeiras",
      },
    ],
  },
  {
    id: "jardim",
    name: "Hotel Jardim",
    area: "Meireles, Fortaleza",
    image: "/landing/hero-piscina.jpg",
    imageAlt: "Área da piscina do Hotel Jardim",
    rooms: [
      {
        id: "superior",
        name: "Superior casal",
        beds: "1 cama queen",
        guests: "2 hóspedes",
        price: 340,
        image: "/landing/hero-quarto.jpg",
        imageAlt: "Quarto superior de casal",
      },
      {
        id: "familia",
        name: "Quarto família",
        beds: "1 casal e 1 solteiro",
        guests: "3 hóspedes",
        price: 490,
        image: "/landing/hero-pousada.jpg",
        imageAlt: "Quarto família com área externa",
      },
    ],
  },
  {
    id: "mare",
    name: "Vila Maré",
    area: "Jericoacoara",
    image: "/landing/hero-quarto.jpg",
    imageAlt: "Quarto da Vila Maré",
    rooms: [
      {
        id: "bangalo",
        name: "Bangalô jardim",
        beds: "1 cama king",
        guests: "2 hóspedes",
        price: 460,
        image: "/landing/hero-piscina.jpg",
        imageAlt: "Bangalô com jardim e piscina",
      },
      {
        id: "vista",
        name: "Bangalô vista mar",
        beds: "1 cama king",
        guests: "2 hóspedes",
        price: 620,
        image: "/landing/hero-pousada.jpg",
        imageAlt: "Bangalô com vista para o mar",
      },
    ],
  },
];

function brl(value: number) {
  return `R$ ${value.toLocaleString("pt-BR")}`;
}

function SearchFields() {
  const fields = [
    { icon: MapPin, label: "Destino", value: STAY.destination },
    { icon: CalendarDays, label: "Datas", value: STAY.dates },
    { icon: Users, label: "Hóspedes", value: STAY.guests },
  ];

  return (
    <div className="mt-4 grid gap-2 sm:grid-cols-3">
      {fields.map(({ icon: Icon, label, value }) => (
        <div key={label} className="rounded-xl border border-border px-3 py-2.5">
          <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Icon className="size-3.5 text-primary" aria-hidden />
            {label}
          </span>
          <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
        </div>
      ))}
    </div>
  );
}

function RoomCards({
  hotel,
  selectedId,
  onReserve,
}: {
  hotel: DemoHotel;
  selectedId?: string;
  onReserve: (roomId: string) => void;
}) {
  return (
    <ul className="mt-4 space-y-2">
      {hotel.rooms.map((room) => {
        const selected = room.id === selectedId;
        return (
          <li key={room.id}>
            <button
              type="button"
              onClick={() => onReserve(room.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                selected ? "border-primary bg-primary-soft" : "border-border hover:border-primary/30 hover:bg-primary-soft",
              )}
            >
              <Image
                src={room.image}
                alt={room.imageAlt}
                width={72}
                height={72}
                className="size-16 shrink-0 rounded-lg object-cover"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-foreground">{room.name}</span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {room.beds} · {room.guests}
                </span>
              </span>
              <span className="text-right">
                <span className="block text-sm font-bold text-foreground">{brl(room.price)}</span>
                <span className="block text-xs text-muted-foreground">/ noite</span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function SearchPanel({ onReserve }: { onReserve: (hotelId: string, roomId: string) => void }) {
  const [hotelId, setHotelId] = useState<string | null>(null);
  const hotel = HOTELS.find((item) => item.id === hotelId);

  if (hotel) {
    return (
      <>
        <button
          type="button"
          onClick={() => setHotelId(null)}
          className="inline-flex items-center text-sm font-medium text-primary"
        >
          <ChevronLeft className="mr-1 size-4" aria-hidden />
          Voltar para a busca
        </button>
        <h3 className="mt-3 text-lg font-bold text-foreground">{hotel.name}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {hotel.area} · {STAY.dates} · {STAY.guests}
        </p>
        <RoomCards hotel={hotel} onReserve={(roomId) => onReserve(hotel.id, roomId)} />
      </>
    );
  }

  return (
    <>
      <h3 className="text-lg font-bold text-foreground">Busca por destino e datas</h3>
      <SearchFields />
      <ul className="mt-4 space-y-2">
        {HOTELS.map((item) => {
          const from = Math.min(...item.rooms.map((room) => room.price));
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => setHotelId(item.id)}
                className="flex w-full items-center gap-3 rounded-xl border border-border/80 p-3 text-left transition-colors hover:border-primary/30 hover:bg-primary-soft"
              >
                <Image
                  src={item.image}
                  alt={item.imageAlt}
                  width={64}
                  height={64}
                  className="size-14 shrink-0 rounded-lg object-cover"
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-foreground">{item.name}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">{item.area}</span>
                  <span className="mt-1 block text-xs font-medium text-foreground">a partir de {brl(from)}</span>
                </span>
                <span className="text-sm font-semibold text-primary">Ver quartos</span>
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function BookPanel({
  hotelId,
  roomId,
  onReserve,
}: {
  hotelId: string;
  roomId: string;
  onReserve: (hotelId: string, roomId: string) => void;
}) {
  const hotel = HOTELS.find((item) => item.id === hotelId) ?? HOTELS[0];
  const room = hotel.rooms.find((item) => item.id === roomId) ?? hotel.rooms[0];

  return (
    <>
      <h3 className="text-lg font-bold text-foreground">Escolha do quarto</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        {hotel.name} · {STAY.dates}
      </p>
      <RoomCards
        hotel={hotel}
        selectedId={room.id}
        onReserve={(nextRoomId) => onReserve(hotel.id, nextRoomId)}
      />
      <div className="mt-4 rounded-xl bg-muted p-4">
        <p className="text-sm font-semibold text-foreground">Resumo da estadia</p>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">{room.name}</dt>
            <dd className="font-medium text-foreground">
              {brl(room.price)} × {STAY.nights} noites
            </dd>
          </div>
          <div className="flex justify-between gap-3 border-t border-border pt-2">
            <dt className="font-semibold text-foreground">Total</dt>
            <dd className="font-bold text-foreground">{brl(room.price * STAY.nights)}</dd>
          </div>
        </dl>
      </div>
    </>
  );
}

function PayPanel({ total }: { total: number }) {
  return (
    <>
      <h3 className="text-lg font-bold text-foreground">Pagamento na Revoar</h3>
      <p className="mt-1 text-sm text-muted-foreground">Total da demonstração: {brl(total)}</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {[
          { icon: QrCode, label: "Pix" },
          { icon: CreditCard, label: "Cartão" },
        ].map(({ icon: Icon, label }, index) => (
          <div
            key={label}
            className={cn(
              "flex items-center gap-3 rounded-xl border p-4",
              index === 0 ? "border-primary bg-primary-soft" : "border-border",
            )}
          >
            <Icon className="size-5 text-primary" aria-hidden />
            <span className="text-sm font-semibold text-foreground">{label}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between rounded-xl border border-border p-4">
        <span className="text-sm font-medium text-muted-foreground">Confirmação da reserva</span>
        <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
          Na hora
        </span>
      </div>
    </>
  );
}

function ReviewPanel() {
  return (
    <>
      <h3 className="text-lg font-bold text-foreground">Avaliação depois da estadia</h3>
      <p className="mt-1 text-sm text-muted-foreground">Pousada Atlântico · Quarto duplo</p>
      <div className="mt-4 flex gap-1" aria-label="5 de 5 estrelas">
        {[0, 1, 2, 3, 4].map((star) => (
          <Star key={star} className="size-7 fill-primary text-primary" aria-hidden />
        ))}
      </div>
      <div className="mt-4 rounded-xl border border-border p-4">
        <p className="text-sm font-medium text-foreground">Café da manhã caprichado e quarto silencioso.</p>
        <p className="mt-2 text-sm text-muted-foreground">Ana, hóspede em Fortaleza</p>
      </div>
    </>
  );
}

export function GuestPreview() {
  const [active, setActive] = useState<TabId>("buscar");
  const [hotelId, setHotelId] = useState(HOTELS[0].id);
  const [roomId, setRoomId] = useState(HOTELS[0].rooms[0].id);

  const hotel = HOTELS.find((item) => item.id === hotelId) ?? HOTELS[0];
  const room = hotel.rooms.find((item) => item.id === roomId) ?? hotel.rooms[0];

  const reserve = (nextHotelId: string, nextRoomId: string) => {
    setHotelId(nextHotelId);
    setRoomId(nextRoomId);
    setActive("reservar");
  };

  const move = (step: number) => {
    const index = TABS.findIndex((tab) => tab.id === active);
    const next = TABS[(index + step + TABS.length) % TABS.length];
    setActive(next.id);
    document.getElementById(`guest-tab-${next.id}`)?.focus();
  };

  return (
    <section className="bg-primary-soft">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:py-16 lg:grid-cols-5 lg:items-center">
      <div className="lg:col-span-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Como reservar</p>
        <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-balance text-foreground sm:text-4xl">
          Busque, escolha o quarto e veja o total
        </h2>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
          Um exemplo em Fortaleza, de 12 a 15 de novembro, para 2 adultos. Toque em Ver quartos para
          ver a acomodação, o preço e a reserva. É uma demonstração, ainda sem busca real.
        </p>
      </div>

      <Surface className="overflow-hidden lg:col-span-3">
        <div className="flex items-center justify-between border-b border-border/80 px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-border" />
            <span className="size-2.5 rounded-full bg-border" />
            <span className="size-2.5 rounded-full bg-border" />
            <span className="ml-2 text-sm font-semibold text-foreground">Revoar para hóspedes</span>
          </div>
          <span className="rounded-full bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary">
            Em breve
          </span>
        </div>

        <div
          role="tablist"
          aria-label="Prévia do app do hóspede"
          className="grid grid-cols-4 gap-1 border-b border-border/80 bg-muted/60 p-1.5"
          onKeyDown={(event) => {
            if (event.key === "ArrowRight") move(1);
            if (event.key === "ArrowLeft") move(-1);
          }}
        >
          {TABS.map(({ id, label, icon: Icon }) => {
            const selected = id === active;
            return (
              <button
                key={id}
                id={`guest-tab-${id}`}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls="guest-panel"
                tabIndex={selected ? 0 : -1}
                onClick={() => setActive(id)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-lg px-2 py-2 text-xs font-semibold transition-all sm:flex-row sm:justify-center sm:text-sm",
                  selected
                    ? "bg-surface text-primary shadow-soft"
                    : "text-muted-foreground hover:bg-surface/70 hover:text-foreground",
                )}
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </button>
            );
          })}
        </div>

        <div
          key={active}
          id="guest-panel"
          role="tabpanel"
          aria-labelledby={`guest-tab-${active}`}
          className="p-4 motion-safe:animate-fade-up motion-reduce:animate-none sm:p-6"
        >
          {active === "buscar" && <SearchPanel onReserve={reserve} />}
          {active === "reservar" && <BookPanel hotelId={hotelId} roomId={roomId} onReserve={reserve} />}
          {active === "pagar" && <PayPanel total={room.price * STAY.nights} />}
          {active === "avaliar" && <ReviewPanel />}
        </div>
      </Surface>
      </div>
    </section>
  );
}

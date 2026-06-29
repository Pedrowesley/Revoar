import Link from "next/link";
import { cn } from "@/lib/utils";

type HotelDetailNavProps = {
  hotelId: string;
  activeTab: "dados" | "quartos" | "fotos";
  roomCount: number;
  imageCount: number;
};

export function HotelDetailNav({ hotelId, activeTab, roomCount, imageCount }: HotelDetailNavProps) {
  const tabs = [
    { id: "dados" as const, href: `/hotels/${hotelId}`, label: "Dados" },
    { id: "quartos" as const, href: `/hotels/${hotelId}/rooms`, label: `Quartos (${roomCount})` },
    { id: "fotos" as const, href: `/hotels/${hotelId}/photos`, label: `Fotos (${imageCount})` },
  ];

  return (
    <nav className="mb-8 flex gap-2 border-b border-border">
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          href={tab.href}
          className={cn(
            "px-3 py-2 text-sm font-medium transition-colors",
            activeTab === tab.id
              ? "border-b-2 border-primary text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}

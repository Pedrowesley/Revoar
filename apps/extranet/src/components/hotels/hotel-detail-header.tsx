import Link from "next/link";
import { ArrowLeft, Trash2 } from "lucide-react";
import { HotelDetail } from "@/lib/hotel";
import { HOTEL_STATUS_LABELS, HotelStatus } from "@/lib/hotel.const";
import { HotelStatusBadge } from "@/components/hotels/hotel-status-badge";
import { Button } from "@/components/ui/button";

type HotelDetailHeaderProps = {
  hotel: HotelDetail;
  onDelete?: () => void;
  deleting?: boolean;
};

export function HotelDetailHeader({ hotel, onDelete, deleting }: HotelDetailHeaderProps) {
  const fullyLocked = !(["DRAFT", "REJECTED", "IN_REVIEW"] as HotelStatus[]).includes(hotel.status);

  return (
    <>
      <Link
        href="/hotels"
        className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Voltar para meus hotéis
      </Link>

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{hotel.name}</h1>
          <div className="mt-2">
            <HotelStatusBadge status={hotel.status} />
          </div>
        </div>
        {hotel.status === "DRAFT" && onDelete && (
          <Button variant="outline" onClick={onDelete} disabled={deleting}>
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir
          </Button>
        )}
      </div>

      {hotel.status === "IN_REVIEW" && (
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
          Hotel em análise. Alguns campos podem ser editados na aba Dados.
        </div>
      )}

      {fullyLocked && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Este hotel está {HOTEL_STATUS_LABELS[hotel.status].toLowerCase()} e não pode ser editado
          no momento.
        </div>
      )}

      {hotel.rejectionReason && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-medium">Motivo da rejeição</p>
          <p className="mt-1">{hotel.rejectionReason}</p>
        </div>
      )}
    </>
  );
}

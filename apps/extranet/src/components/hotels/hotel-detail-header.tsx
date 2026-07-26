import Link from "next/link";
import { ArrowLeft, Trash2 } from "lucide-react";
import { HotelDetail } from "@/lib/hotel";
import { HOTEL_STATUS_LABELS, HotelStatus } from "@/lib/hotel.const";
import { HotelStatusBadge } from "@/components/hotels/hotel-status-badge";
import { Alert } from "@/components/ui/alert";
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
        className="mb-6 inline-flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Voltar para meus hotéis
      </Link>

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{hotel.name}</h1>
          <div className="mt-3">
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
        <Alert variant="info" className="mb-6">
          Hotel em análise. Alguns campos podem ser editados na aba Dados.
        </Alert>
      )}

      {fullyLocked && (
        <Alert variant="warning" className="mb-6">
          Este hotel está {HOTEL_STATUS_LABELS[hotel.status].toLowerCase()} e não pode ser editado
          no momento.
        </Alert>
      )}

      {hotel.rejectionReason && (
        <Alert variant="danger" title="Motivo da rejeição" className="mb-6">
          {hotel.rejectionReason}
        </Alert>
      )}
    </>
  );
}

import { cn } from "@/lib/utils";
import { HOTEL_STATUS_COLORS, HOTEL_STATUS_LABELS, HotelStatus } from "@/lib/hotel.const";

type HotelStatusBadgeProps = {
  status: HotelStatus;
  className?: string;
};

export function HotelStatusBadge({ status, className }: HotelStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
        HOTEL_STATUS_COLORS[status],
        className,
      )}
    >
      {HOTEL_STATUS_LABELS[status]}
    </span>
  );
}

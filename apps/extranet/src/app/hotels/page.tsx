import { Suspense } from "react";
import HotelsList from "./hotels-list";
import { PageSkeleton } from "@/components/ui/skeleton";

export default function HotelsPage() {
  return (
    <Suspense fallback={<PageSkeleton rows={4} />}>
      <HotelsList />
    </Suspense>
  );
}

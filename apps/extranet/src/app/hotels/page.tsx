import { Suspense } from "react";
import HotelsList from "./hotels-list";

export default function HotelsPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-4xl px-4 py-16 text-center text-muted-foreground">Carregando...</div>}>
      <HotelsList />
    </Suspense>
  );
}

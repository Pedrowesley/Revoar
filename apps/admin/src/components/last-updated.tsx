"use client";

import { useEffect, useState } from "react";

export function LastUpdated({ updatedAt }: { updatedAt?: number }) {
  const [, tick] = useState(0);

  useEffect(() => {
    if (!updatedAt) return;
    const id = window.setInterval(() => tick((value) => value + 1), 5_000);
    return () => window.clearInterval(id);
  }, [updatedAt]);

  if (!updatedAt) return null;

  const seconds = Math.max(0, Math.floor((Date.now() - updatedAt) / 1000));
  const label = seconds < 5 ? "agora" : `${seconds}s`;

  return (
    <p className="text-xs text-muted-foreground">Atualizado há {label}</p>
  );
}

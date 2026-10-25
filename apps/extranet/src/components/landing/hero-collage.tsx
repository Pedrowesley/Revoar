import Image from "next/image";
import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const PHOTOS = [
  {
    src: "/landing/hero-pousada.jpg",
    alt: "Deque de pousada com piscina e espreguiçadeiras ao entardecer",
    className: "aspect-4/3 motion-safe:animate-rise-3 motion-reduce:animate-none lg:col-span-3 lg:row-span-2 lg:aspect-auto",
    sizes: "(min-width: 1024px) 34vw, 100vw",
    priority: true,
  },
  {
    src: "/landing/hero-quarto.jpg",
    alt: "Quarto de casal com almofadas azuis e luz quente",
    className: "hidden aspect-square motion-safe:animate-rise-4 motion-reduce:animate-none lg:col-span-2 lg:block",
    sizes: "22vw",
  },
  {
    src: "/landing/hero-piscina.jpg",
    alt: "Piscina entre palmeiras e bangalôs com montanhas ao fundo",
    className: "hidden aspect-square motion-safe:animate-rise-5 motion-reduce:animate-none lg:col-span-2 lg:block",
    sizes: "22vw",
  },
];

export function HeroCollage() {
  return (
    <div className="relative">
      <div className="grid gap-3 lg:grid-cols-5 lg:grid-rows-2">
        {PHOTOS.map(({ src, alt, className, sizes, priority }) => (
          <figure
            key={src}
            className={cn("group relative overflow-hidden rounded-3xl bg-muted shadow-lift", className)}
          >
            <Image
              src={src}
              alt={alt}
              fill
              sizes={sizes}
              priority={priority}
              loading={priority ? undefined : "eager"}
              className="object-cover motion-safe:transition-transform motion-safe:duration-700 motion-safe:group-hover:scale-105"
            />
          </figure>
        ))}
      </div>

      <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-2xl bg-surface/95 px-4 py-3 shadow-lift backdrop-blur motion-safe:animate-rise-6 motion-reduce:animate-none">
        <BadgeCheck className="size-5 text-primary" aria-hidden />
        <span className="text-sm font-semibold text-foreground">Todo hotel passa pela equipe Revoar</span>
      </div>
    </div>
  );
}

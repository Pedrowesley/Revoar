import { GuestPreview } from "@/components/landing/guest-preview";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingSections } from "@/components/landing/landing-sections";

export default function HomePage() {
  return (
    <>
      <LandingHero />
      <GuestPreview />
      <LandingSections />
    </>
  );
}

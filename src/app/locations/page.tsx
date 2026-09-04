import type { Metadata } from "next";
import Container from "@/components/layout/Container";
import Reveal from "@/components/home/Reveal";
import LocationCard from "@/components/services/LocationCard";

export const metadata: Metadata = {
  title: "Our Locations — United Kingdom & Pakistan",
  description: "RJ Services supports clients and businesses across the United Kingdom and Pakistan.",
  alternates: { canonical: "/locations" },
};

const locations = [
  { country: "United Kingdom", address: "[Insert UK Address Here]", contactHref: "/contact?location=uk" },
  { country: "Pakistan", address: "House P-1336, Sanat Singh Wala, Chak No. 207 RB, Street 03, Faisalabad, Pakistan", contactHref: "/contact?location=pakistan" },
];

export default function LocationsPage() {
  return (
    <div className="bg-black text-white">
      <Container>
        <div className="py-20 sm:py-24 text-center max-w-2xl mx-auto">
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-zinc-400">Locations</p>
          <h1 className="mt-3 text-4xl sm:text-5xl font-semibold tracking-tight">Where to Find Us</h1>
          <p className="mt-5 text-zinc-400">
            RJ Services supports clients across the United Kingdom and Pakistan.
          </p>
        </div>
      </Container>

      <Reveal>
        <Container>
          <div className="pb-24 grid grid-cols-1 md:grid-cols-2 gap-6">
            {locations.map((loc) => (
              <LocationCard key={loc.country} {...loc} />
            ))}
          </div>
        </Container>
      </Reveal>
    </div>
  );
}

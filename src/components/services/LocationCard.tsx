import Link from "next/link";
import { IconMapPin } from "@/components/home/icons";
import MapPlaceholder from "./MapPlaceholder";
import LiveMap from "./LiveMap";

export default function LocationCard({
  country,
  address,
  contactHref,
}: {
  country: string;
  address: string;
  contactHref: string;
}) {
  const hasRealAddress = !address.startsWith("[Insert");

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-7 flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 shrink-0 rounded-xl bg-white/10 flex items-center justify-center text-white">
          <IconMapPin className="w-5 h-5" />
        </div>
        <h3 className="text-xl font-semibold text-white">{country}</h3>
      </div>
      <p className="text-sm italic text-zinc-500">{address}</p>
      {hasRealAddress ? (
        <LiveMap address={address} label={country} />
      ) : (
        <MapPlaceholder label={country} />
      )}
      <Link
        href={contactHref}
        className="mt-1 inline-block text-center rounded-full border border-white/20 px-6 py-2.5 text-sm font-medium hover:bg-white/10"
      >
        Contact this location
      </Link>
    </div>
  );
}

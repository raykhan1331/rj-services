import { IconMapPin } from "@/components/home/icons";

export default function MapPlaceholder({ label }: { label: string }) {
  return (
    <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-black/30 text-center">
      <IconMapPin className="w-6 h-6 text-zinc-500" />
      <p className="text-sm text-zinc-500">Map for {label} will be available here once connected.</p>
    </div>
  );
}

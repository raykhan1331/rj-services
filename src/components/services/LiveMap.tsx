export default function LiveMap({ address, label }: { address: string; label: string }) {
  const src = `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;

  return (
    <div className="h-48 w-full overflow-hidden rounded-xl border border-white/15 bg-black/30">
      <iframe
        src={src}
        title={`Map showing ${label} location`}
        className="h-full w-full grayscale-[35%] contrast-125"
        style={{ border: 0 }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}

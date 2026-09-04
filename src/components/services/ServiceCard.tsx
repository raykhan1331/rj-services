import Link from "next/link";

export default function ServiceCard({
  icon,
  title,
  description,
  href,
  disclaimer,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  disclaimer?: string;
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-colors hover:bg-white/[0.06] hover:border-white/20">
      <div className="h-11 w-11 rounded-xl bg-white/10 flex items-center justify-center text-white">
        {icon}
      </div>
      <h3 className="mt-4 font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm text-zinc-400 leading-relaxed flex-1">{description}</p>
      {disclaimer && (
        <p className="mt-3 text-xs text-amber-400/80 leading-relaxed border-t border-white/10 pt-3">
          {disclaimer}
        </p>
      )}
      <div className="mt-5 flex gap-3">
        <Link
          href={href}
          className="flex-1 text-center rounded-full border border-white/20 px-4 py-2 text-sm font-medium hover:bg-white/10"
        >
          Learn More
        </Link>
        <Link
          href={`/contact?service=${href.split("/").pop()}`}
          className="flex-1 text-center rounded-full bg-white text-black px-4 py-2 text-sm font-medium hover:opacity-90"
        >
          Enquire
        </Link>
      </div>
    </div>
  );
}

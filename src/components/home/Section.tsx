export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  level = "h2",
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  /** Use "h1" only when this is the page's single primary heading. */
  level?: "h1" | "h2";
}) {
  const Heading = level;
  return (
    <div className="max-w-2xl mx-auto text-center">
      {eyebrow && (
        <p className="text-xs font-semibold tracking-[0.2em] uppercase text-zinc-400">
          {eyebrow}
        </p>
      )}
      <Heading className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight text-white">
        {title}
      </Heading>
      {subtitle && <p className="mt-4 text-zinc-400">{subtitle}</p>}
    </div>
  );
}

export function ServiceCard({
  icon,
  title,
  description,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-all duration-200 hover:bg-white/[0.06] hover:border-white/20 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/40"
    >
      <div className="h-11 w-11 rounded-xl bg-white/10 flex items-center justify-center text-white">
        {icon}
      </div>
      <h3 className="mt-4 font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm text-zinc-400 leading-relaxed">{description}</p>
    </a>
  );
}

export function FeatureRow({
  icon,
  title,
  description,
  href,
  reverse,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  reverse?: boolean;
}) {
  return (
    <div
      className={`flex flex-col md:flex-row ${
        reverse ? "md:flex-row-reverse" : ""
      } items-center gap-10 py-12`}
    >
      <div className="flex-1 flex justify-center">
        <div className="h-36 w-36 rounded-3xl bg-gradient-to-br from-white/10 to-white/[0.02] border border-white/10 flex items-center justify-center text-white">
          <div className="h-14 w-14">{icon}</div>
        </div>
      </div>
      <div className="flex-1 max-w-md text-center md:text-left">
        <h3 className="text-2xl font-semibold text-white">{title}</h3>
        <p className="mt-3 text-zinc-400 leading-relaxed">{description}</p>
        <a
          href={href}
          className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-white hover:opacity-70"
        >
          Learn more
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-4 h-4">
            <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </div>
    </div>
  );
}

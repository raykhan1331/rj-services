const sizes = {
  sm: { badge: 32, rj: "text-sm", tag: "text-[7px]" },
  md: { badge: 42, rj: "text-lg", tag: "text-[9px]" },
  lg: { badge: 96, rj: "text-4xl", tag: "text-xs" },
} as const;

export function LogoMark({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg viewBox="0 0 200 200" className={className} style={style} aria-hidden>
      <circle cx="100" cy="100" r="98" fill="#000" stroke="#fff" strokeWidth="2" />
      <path
        d="M100 38 C68 38 52 70 52 102 C52 111 56 118 62 123 L67 123 C63 112 63 98 70 88 C77 99 90 104 100 104 C110 104 123 99 130 88 C137 98 137 112 133 123 L138 123 C144 118 148 111 148 102 C148 70 132 38 100 38 Z"
        fill="#fff"
      />
      <ellipse cx="100" cy="100" rx="17" ry="21" fill="#000" />
      <text
        x="100"
        y="160"
        textAnchor="middle"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="46"
        fontWeight="700"
        fill="#fff"
        letterSpacing="1"
      >
        RJ
      </text>
      <line x1="38" y1="150" x2="66" y2="150" stroke="#fff" strokeWidth="1.5" />
      <line x1="134" y1="150" x2="162" y2="150" stroke="#fff" strokeWidth="1.5" />
    </svg>
  );
}

export default function Logo({
  size = "md",
  className,
}: {
  size?: keyof typeof sizes;
  className?: string;
}) {
  const s = sizes[size];
  return (
    <span className={`inline-flex items-center gap-3 ${className ?? ""}`}>
      <LogoMark className="shrink-0" style={{ width: s.badge, height: s.badge }} />
      <span className="flex flex-col leading-none">
        <span
          className={`${s.rj} font-bold tracking-wide`}
          style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
        >
          RJ
        </span>
        <span className={`${s.tag} font-medium tracking-[0.25em] uppercase text-zinc-500`}>
          Services
        </span>
      </span>
    </span>
  );
}

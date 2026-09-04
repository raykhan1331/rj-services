// Original, hand-authored line-art illustrations in the RJ Services
// monochrome style — not stock photography, not scraped, not AI-scraped
// imagery. Chosen deliberately: they carry zero licensing risk, stay on
//-brand with the existing SVG logo/icon system, and load instantly.

type IllustrationProps = { className?: string; title?: string };

// Simplified deliberately: a plain solid background rect (no gradient/defs/
// id references) plus the white line-art group. No dynamic ids, no url()
// references — nothing that depends on anything other than the shape data
// itself, so there is nothing that can fail to resolve.
function frame(children: React.ReactNode, { className, title }: IllustrationProps) {
  return (
    <svg
      viewBox="0 0 200 160"
      width="200"
      height="160"
      className={className}
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
    >
      {title && <title>{title}</title>}
      <rect x="0" y="0" width="200" height="160" rx="16" fill="#0a0a0a" />
      <g fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        {children}
      </g>
    </svg>
  );
}

/** Business professional working on a laptop. */
export function IllustrationLaptop(props: IllustrationProps) {
  return frame(
    <>
      <rect x="62" y="70" width="76" height="48" rx="4" />
      <path d="M50 118h100l-8 14H58Z" />
      <circle cx="100" cy="45" r="14" />
      <path d="M78 62c4-10 12-14 22-14s18 4 22 14" />
      <path d="M78 90h44M78 100h30" strokeWidth="1.6" opacity="0.6" />
    </>,
    { ...props, title: props.title ?? "Business professional working on a laptop" }
  );
}

/** Document review / identity verification (KYC). */
export function IllustrationDocumentReview(props: IllustrationProps) {
  return frame(
    <>
      <rect x="66" y="34" width="52" height="68" rx="4" />
      <path d="M78 50h28M78 62h28M78 74h18" strokeWidth="1.6" opacity="0.7" />
      <circle cx="126" cy="98" r="18" />
      <path d="M139 111l14 14" />
      <path d="M118 90l6 6 10-12" strokeWidth="1.6" />
    </>,
    { ...props, title: props.title ?? "Document and identity verification" }
  );
}

/** Two-person consultation / advisory meeting. */
export function IllustrationConsultation(props: IllustrationProps) {
  return frame(
    <>
      <circle cx="72" cy="56" r="14" />
      <path d="M50 100c2-16 12-24 22-24s20 8 22 24" />
      <circle cx="130" cy="56" r="14" />
      <path d="M108 100c2-16 12-24 22-24s20 8 22 24" />
      <path d="M86 118h30" strokeWidth="1.6" opacity="0.7" />
    </>,
    { ...props, title: props.title ?? "Business consultation between two professionals" }
  );
}

/** Online storefront / e-commerce. */
export function IllustrationStorefront(props: IllustrationProps) {
  return frame(
    <>
      <path d="M52 66h96l-6-24H58Z" />
      <path d="M52 66v46h96V66" />
      <path d="M80 112V86h20v26" strokeWidth="1.6" />
      <circle cx="146" cy="118" r="10" />
      <path d="M120 88l10 10 16-16" strokeWidth="1.6" />
    </>,
    { ...props, title: props.title ?? "Online store and e-commerce" }
  );
}

/** Growth chart / digital marketing. */
export function IllustrationGrowth(props: IllustrationProps) {
  return frame(
    <>
      <path d="M50 118V56M50 118h100" strokeWidth="1.6" opacity="0.5" />
      <path d="M58 104l24-20 18 14 34-38" />
      <path d="M112 60h22v22" />
    </>,
    { ...props, title: props.title ?? "Business growth and digital marketing" }
  );
}

/** UK company formation / office building. */
export function IllustrationBuilding(props: IllustrationProps) {
  return frame(
    <>
      <rect x="72" y="34" width="56" height="84" rx="2" />
      <path d="M84 50h8M100 50h8M116 50h-0M84 64h8M100 64h8M84 78h8M100 78h8M84 92h8M100 92h8" strokeWidth="1.6" opacity="0.7" />
      <path d="M60 118h80" />
      <path d="M92 118v-18h16v18" strokeWidth="1.6" />
    </>,
    { ...props, title: props.title ?? "UK company formation and office building" }
  );
}

/** Banking / card and account. */
export function IllustrationBanking(props: IllustrationProps) {
  return frame(
    <>
      <rect x="52" y="50" width="72" height="46" rx="6" />
      <path d="M52 64h72" strokeWidth="4" />
      <path d="M64 82h20" strokeWidth="1.6" opacity="0.7" />
      <circle cx="146" cy="100" r="20" />
      <path d="M138 100h16M146 92v16" strokeWidth="1.6" />
    </>,
    { ...props, title: props.title ?? "UK banking and account services" }
  );
}

/** Modern digital workspace. */
export function IllustrationWorkspace(props: IllustrationProps) {
  return frame(
    <>
      <rect x="48" y="96" width="104" height="6" rx="2" />
      <rect x="76" y="52" width="48" height="34" rx="3" />
      <path d="M96 86v10" strokeWidth="1.6" />
      <circle cx="140" cy="70" r="10" strokeWidth="1.6" />
      <path d="M136 70h8M140 66v8" strokeWidth="1.2" />
      <path d="M60 96V80c0-4 3-7 7-7" strokeWidth="1.6" opacity="0.7" />
    </>,
    { ...props, title: props.title ?? "Modern digital business workspace" }
  );
}

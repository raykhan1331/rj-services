type IconProps = { className?: string };
const base = "w-6 h-6";
const wrap = (children: React.ReactNode, className = base) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden="true">
    {children}
  </svg>
);

export const IconBank = ({ className }: IconProps) =>
  wrap(
    <>
      <path d="M3 10 12 4l9 6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 10v9M9 10v9M15 10v9M19 10v9" strokeLinecap="round" />
      <path d="M3 21h18" strokeLinecap="round" />
    </>,
    className
  );

export const IconBuilding = ({ className }: IconProps) =>
  wrap(
    <>
      <rect x="5" y="3" width="14" height="18" rx="1" />
      <path d="M9 8h.01M15 8h.01M9 12h.01M15 12h.01M9 16h.01M15 16h.01" strokeLinecap="round" />
    </>,
    className
  );

export const IconMapPin = ({ className }: IconProps) =>
  wrap(
    <>
      <path d="M12 21s7-6.4 7-11.5A7 7 0 0 0 5 9.5C5 14.6 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.3" />
    </>,
    className
  );

export const IconShield = ({ className }: IconProps) =>
  wrap(<path d="M12 3 4 6v6c0 5 3.4 8 8 9 4.6-1 8-4 8-9V6l-8-3Z" strokeLinejoin="round" />, className);

export const IconBag = ({ className }: IconProps) =>
  wrap(
    <>
      <path d="M6 8h12l-1 12H7L6 8Z" strokeLinejoin="round" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" strokeLinecap="round" />
    </>,
    className
  );

export const IconStore = ({ className }: IconProps) =>
  wrap(
    <>
      <path d="M4 9 5 4h14l1 5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 9a2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0" strokeLinecap="round" />
      <path d="M5 9v11h14V9" />
    </>,
    className
  );

export const IconMegaphone = ({ className }: IconProps) =>
  wrap(
    <>
      <path d="M3 11v2a2 2 0 0 0 2 2h1l2 5h2l-1-5h2l8 4V6l-8 4H6a2 2 0 0 0-2 1Z" strokeLinejoin="round" />
    </>,
    className
  );

export const IconBot = ({ className }: IconProps) =>
  wrap(
    <>
      <rect x="4" y="9" width="16" height="10" rx="2" />
      <path d="M12 5v4M9 14h.01M15 14h.01" strokeLinecap="round" />
      <circle cx="12" cy="4" r="1" />
    </>,
    className
  );

export const IconHelp = ({ className }: IconProps) =>
  wrap(
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5a2.5 2.5 0 1 1 3.4 2.3c-.8.35-1.4.9-1.4 1.9" strokeLinecap="round" />
      <path d="M12 17h.01" strokeLinecap="round" />
    </>,
    className
  );

export const IconMail = ({ className }: IconProps) =>
  wrap(
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" strokeLinecap="round" strokeLinejoin="round" />
    </>,
    className
  );

export const IconSearch = ({ className }: IconProps) =>
  wrap(
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m20 20-4.8-4.8" strokeLinecap="round" />
    </>,
    className
  );

export const IconShare = ({ className }: IconProps) =>
  wrap(
    <>
      <circle cx="6" cy="12" r="2.3" />
      <circle cx="17" cy="6" r="2.3" />
      <circle cx="17" cy="18" r="2.3" />
      <path d="M8 10.8 15 7M8 13.2l7 3.8" strokeLinecap="round" />
    </>,
    className
  );

export const IconTarget = ({ className }: IconProps) =>
  wrap(
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="12" cy="12" r="0.6" fill="currentColor" />
    </>,
    className
  );

export const IconGear = ({ className }: IconProps) =>
  wrap(
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v2.2M12 18.8V21M21 12h-2.2M5.2 12H3M18.4 5.6l-1.6 1.6M7.2 16.8l-1.6 1.6M18.4 18.4l-1.6-1.6M7.2 7.2 5.6 5.6" strokeLinecap="round" />
    </>,
    className
  );

export const IconDocument = ({ className }: IconProps) =>
  wrap(
    <>
      <path d="M7 3h7l4 4v14H7Z" strokeLinejoin="round" />
      <path d="M14 3v4h4M9.5 12h5M9.5 15.5h5" strokeLinecap="round" />
    </>,
    className
  );

export const IconChat = ({ className }: IconProps) =>
  wrap(
    <>
      <path d="M4 5h16v11H9l-5 4V5Z" strokeLinejoin="round" />
      <path d="M8 9h8M8 12.5h5" strokeLinecap="round" />
    </>,
    className
  );

export const IconSend = ({ className }: IconProps) =>
  wrap(<path d="M4 12 20 4l-6 16-3-7-7-1Z" strokeLinejoin="round" strokeLinecap="round" />, className);

export const IconTrash = ({ className }: IconProps) =>
  wrap(
    <>
      <path d="M5 7h14M9 7V5h6v2M6 7l1 13h10l1-13" strokeLinecap="round" strokeLinejoin="round" />
    </>,
    className
  );

export const IconClose = ({ className }: IconProps) =>
  wrap(<path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />, className);

export const IconCheck = ({ className }: IconProps) =>
  wrap(<path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />, className);

export const IconArrowRight = ({ className }: IconProps) =>
  wrap(<path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />, className ?? "w-4 h-4");

export const IconChecklist = ({ className }: IconProps) =>
  wrap(
    <>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="m8 9 1.5 1.5L12 8M8 15h8M8 12h2" strokeLinecap="round" strokeLinejoin="round" />
    </>,
    className
  );

export const IconUsers = ({ className }: IconProps) =>
  wrap(
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" strokeLinecap="round" />
      <path d="M16 5.5a3 3 0 0 1 0 5.8M21 20c0-2.8-2-5.1-4.5-5.8" strokeLinecap="round" />
    </>,
    className
  );

export const IconAd = ({ className }: IconProps) =>
  wrap(
    <>
      <path d="M4 15V9a2 2 0 0 1 2-2h6l6-3v16l-6-3H6a2 2 0 0 1-2-2Z" strokeLinejoin="round" />
      <path d="M8 17v3" strokeLinecap="round" />
    </>,
    className
  );

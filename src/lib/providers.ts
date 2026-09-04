// Bank/provider directory for the homepage provider showcase.
// Logos are official marks, used only to identify which providers RJ
// Services helps clients apply to — this is not an endorsement or
// partnership claim. Any provider without a safely-sourced logo file
// gets `logo: null` and renders as a text-based card instead.

export interface Provider {
  name: string;
  type: "Personal" | "Business";
  description: string;
  logo: string | null;
  href: string;
}

export const PROVIDERS: Provider[] = [
  {
    name: "Lloyds Bank",
    type: "Personal",
    description: "High-street personal banking.",
    logo: "/media/logos/lloyds.svg",
    href: "/contact?service=banking",
  },
  {
    name: "Halifax",
    type: "Personal",
    description: "Part of Lloyds Banking Group.",
    logo: "/media/logos/halifax.svg",
    href: "/contact?service=banking",
  },
  {
    name: "Tide",
    type: "Business",
    description: "Business banking built for UK SMEs and sole traders.",
    logo: "/media/logos/tide.webp",
    href: "/contact?service=banking",
  },
  {
    name: "Wise",
    type: "Business",
    description: "Formerly TransferWise — multi-currency business accounts.",
    logo: "/media/logos/wise.svg",
    href: "/contact?service=banking",
  },
  {
    name: "Monzo",
    type: "Personal",
    description: "Digital-first personal banking.",
    logo: "/media/logos/monzo.svg",
    href: "/contact?service=banking",
  },
  {
    name: "Taptap Business",
    type: "Business",
    description: "Business banking and payment services for UK companies.",
    logo: null,
    href: "/contact?service=banking",
  },
  {
    name: "Zempler Bank",
    type: "Business",
    description: "Formerly Cashplus Bank — UK business accounts.",
    logo: "/media/logos/zempler-bank.webp",
    href: "/contact?service=banking",
  },
];

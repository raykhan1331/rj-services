// What RJ Services actually offers, matching the real pages built on this
// site. Used so the assistant answers "do you provide X?" truthfully
// instead of deflecting to an unrelated page.

export const RJ_CATALOGUE = {
  companyFormation: {
    blurb: "Yes — RJ Services provides UK company formation assistance. We help you prepare accurate company details and documentation for submission to Companies House.",
    link: "/services/uk-company-formation",
  },
  banking: {
    blurb: "RJ Services also helps with UK personal and business bank account applications.",
    link: "/services/banking",
  },
  virtualAddress: {
    blurb: "RJ Services can help you set up a UK registered office or virtual business address, which you'll need as part of company formation.",
    link: "/services/virtual-addresses",
  },
  kyc: {
    blurb: "RJ Services helps you prepare the documentation typically required for identity and business verification (KYC) checks.",
    link: "/services/kyc-assistance",
  },
  ukBusinessSetup: {
    blurb: "For a combined approach, RJ Services' UK Business Setup service covers company formation, address, KYC, and banking together.",
    link: "/services/uk-business-setup",
  },
} as const;

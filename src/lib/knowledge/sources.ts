import type { SourceConfig } from "./types";

// Registry of official sources to monitor. Every URL below was checked
// against the provider's own live site (or GOV.UK/Companies House) before
// being added here — none are invented. To monitor another bank or
// official page later, add one entry here; nothing else in the system
// needs to change.

export const SOURCES: SourceConfig[] = [
  // Lloyds Bank
  { id: "lloyds-personal-requirements", provider: "Lloyds Bank", type: "bank", category: "personal_account_requirements", url: "https://www.lloydsbank.com/current-accounts/help-and-guidance/opening-a-bank-account.html" },
  { id: "lloyds-proof-of-identity", provider: "Lloyds Bank", type: "bank", category: "proof_of_identity", url: "https://www.lloydsbank.com/help-guidance/legal-information/privacy/proof-of-identity.html" },
  { id: "lloyds-business-requirements", provider: "Lloyds Bank", type: "bank", category: "business_account_requirements", url: "https://www.lloydsbank.com/business/businessaccountopeningguide.html" },

  // Halifax
  { id: "halifax-personal-requirements", provider: "Halifax", type: "bank", category: "personal_account_requirements", url: "https://www.halifax.co.uk/bankaccounts/account-opening-guide.html" },
  { id: "halifax-proof-of-identity", provider: "Halifax", type: "bank", category: "proof_of_identity", url: "https://www.halifax.co.uk/helpcentre/legal-information/privacy/proving-your-identity.html" },

  // Tide
  { id: "tide-proof-of-identity", provider: "Tide", type: "bank", category: "proof_of_identity", url: "https://www.tide.co/support/joining/bank-account/what-id-will-i-need-to-open-a-bank-account-with-tide/" },
  { id: "tide-business-documents", provider: "Tide", type: "bank", category: "business_documents", url: "https://www.tide.co/support/joining/registering-a-company/what-documents-are-required-to-open-a-tide-current-account/" },
  { id: "tide-eligibility", provider: "Tide", type: "bank", category: "eligibility_requirements", url: "https://www.tide.co/support/joining/bank-account/can-i-open-an-account/" },

  // Wise
  { id: "wise-business-requirements", provider: "Wise", type: "bank", category: "business_account_requirements", url: "https://wise.com/gb/blog/wise-business-account-requirements-uk" },
  { id: "wise-proof-of-address", provider: "Wise", type: "bank", category: "proof_of_address", url: "https://wise.com/help/articles/2969315/how-does-wise-verify-my-business-address" },

  // Monzo
  { id: "monzo-personal-requirements", provider: "Monzo", type: "bank", category: "personal_account_requirements", url: "https://monzo.com/help/opening-an-account/how-to-open-a-Monzo-Personal-Account" },
  { id: "monzo-business-requirements", provider: "Monzo", type: "bank", category: "business_account_requirements", url: "https://monzo.com/help/business-accounts-signup/business-account-signup-start-on-web" },

  // Taptap
  { id: "taptap-business-requirements", provider: "Taptap", type: "bank", category: "business_account_requirements", url: "https://support.taptapsend.com/hc/en-gb/articles/49489725430163-All-you-need-to-know-about-Taptap-Send-for-Businesses" },

  // Zempler Bank
  { id: "zempler-proof-of-identity", provider: "Zempler Bank", type: "bank", category: "proof_of_identity", url: "https://www.zemplerbank.com/help/applying-for-an-account/identity-verification/documents/" },
  { id: "zempler-eligibility", provider: "Zempler Bank", type: "bank", category: "eligibility_requirements", url: "https://www.zemplerbank.com/business/current-account/eligibility/" },

  // Government
  { id: "govuk-company-formation", provider: "GOV.UK", type: "government", category: "company_formation_requirements", url: "https://www.gov.uk/set-up-limited-company" },
  { id: "govuk-director-requirements", provider: "GOV.UK", type: "government", category: "director_requirements", url: "https://www.gov.uk/set-up-limited-company" },
  { id: "govuk-psc-requirements", provider: "GOV.UK", type: "government", category: "psc_beneficial_owner_requirements", url: "https://www.gov.uk/set-up-limited-company" },
  { id: "govuk-companies-house-idv", provider: "GOV.UK", type: "government", category: "companies_house_identity_verification", url: "https://www.gov.uk/limited-company-formation/register-your-company" },
  { id: "companies-house-register", provider: "Companies House", type: "government", category: "company_formation_requirements", url: "https://find-and-update.company-information.service.gov.uk/" },

  // KYC — reuses an already-verified identity-check page; a bank's ID
  // requirements are, in substance, its KYC requirements.
  { id: "tide-kyc-requirements", provider: "Tide", type: "bank", category: "kyc_requirements", url: "https://www.tide.co/support/joining/bank-account/what-id-will-i-need-to-open-a-bank-account-with-tide/" },
];

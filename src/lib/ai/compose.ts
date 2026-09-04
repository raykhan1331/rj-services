import type { ChatMessage } from "./types";
import { extractFacts, type ConversationFacts } from "./context";
import { detectIntent } from "./intent";
import { RJ_CATALOGUE } from "./rjCatalogue";
import { getRecordsByCategory, getRecordsByProvider, freshnessLine } from "@/lib/knowledge/retrieve";
import type { KnowledgeRecord } from "@/lib/knowledge/types";

const COMPLIANCE_FOOTER =
  "Requirements can change, and the final documents requested are always determined by the provider. We can't guarantee approval.";

const UNVERIFIED_NOTICE =
  "I couldn't verify the latest requirement from the official source right now. I don't want to give you outdated information.";

function companyNeededSection(accountType: ConversationFacts["accountType"]): string {
  if (accountType === "personal") {
    return "No — a personal bank account never requires you to have a UK company. Personal accounts are opened in your own name, using your personal ID and address.";
  }
  if (accountType === "sole_trader") {
    return "Not necessarily. As a sole trader you can usually open a business account without forming a limited company — most providers open sole trader accounts based on your personal ID and business details, without needing a registered company.";
  }
  return "Not necessarily — it depends on the type of account:\n• Personal account — never requires a UK company.\n• Sole trader business account — usually does not require a limited company.\n• Limited company business account — normally does require a registered UK company first, since the bank needs your company's registration details (company number, registered address, directors) to open the account.";
}

function hasCompanyNote(hasCompany: boolean | null): string | null {
  if (hasCompany === true) {
    return "Since you already have a UK company, you don't need to form another one — you can go ahead with a business bank account application using your existing company's details.";
  }
  if (hasCompany === false) {
    return "Since you don't have a UK company yet, if you're set on a limited company account you'd need to form the company first — RJ Services can help with that.";
  }
  return null;
}

async function companyFormationChecklist(): Promise<string> {
  const records = await getRecordsByCategory(["director_requirements", "psc_beneficial_owner_requirements", "companies_house_identity_verification"]);
  const verified = records.some((r) => r.extractedRequirements.length > 0);
  const bullets = [
    "A registered office address in the UK (RJ Services can help with this via our virtual/registered address service).",
    "At least one director (an individual who can act as director or company secretary).",
    "At least one shareholder — who can also be a director — or a guarantor for a company limited by guarantee.",
    "Details of anyone who qualifies as a Person with Significant Control (PSC) over the company.",
    "A SIC code describing what your company does.",
    "Identity verification: each director needs a Companies House personal identity verification code, obtained via GOV.UK One Login (online, by app, or in person at a Post Office) before or during registration.",
    "You'll receive a certificate of incorporation once the company is successfully registered.",
  ];
  const freshness = verified
    ? ` (based on the latest verified GOV.UK and Companies House information${records.some((r) => r.status === "unavailable") ? ", with one source currently unreachable — using the last verified version" : ""})`
    : "";
  return `For UK company formation, the information/documents typically involved include${freshness}:\n${bullets.map((b) => `• ${b}`).join("\n")}`;
}

async function providerDocsSection(provider: string, accountType: ConversationFacts["accountType"]): Promise<string> {
  const records = await getRecordsByProvider(provider);
  const withContent = records.filter((r) => r.extractedRequirements.length > 0);

  if (!withContent.length) {
    return `${UNVERIFIED_NOTICE} In general, UK bank accounts typically ask for proof of identity (passport or driving licence), proof of address, and — for a business account — your company or business details. I'd rather confirm ${provider}'s exact current list before giving you specifics; you're welcome to check directly with ${provider}, or send us an enquiry and we'll verify it for you.`;
  }

  // Prefer the record matching the asked account type, but fall back to whatever we have.
  const preferred =
    (accountType === "personal" && withContent.find((r) => r.category === "personal_account_requirements")) ||
    (accountType === "business" && withContent.find((r) => r.category === "business_account_requirements")) ||
    withContent[0];

  const bullets = preferred.extractedRequirements.slice(0, 6);
  return `Based on ${provider}'s official information (${freshnessLine(preferred)}):\n${bullets.map((b) => `• ${b}`).join("\n")}`;
}

function kycExplanation(): string {
  return "KYC (Know Your Customer) checks are carried out by the provider or authority themselves — typically proof of identity, proof of address, and for a business, details of directors and anyone with significant control. RJ Services helps you prepare and organise this documentation, but the verification decision is always the provider's own.";
}

function bankAccountOptionsPostFormation(): string {
  return "Once your UK company is registered, you can generally apply for a limited-company business account with providers such as Tide, Wise, Zempler Bank, or a high-street bank like Lloyds or Halifax — which one suits you depends on your eligibility, business type, and where you and your directors are based. Each provider assesses applications against its own criteria.";
}

function sequencingAdvice(): string {
  return "Generally the right order is:\n1. Form your UK company (registered address, director and PSC details, SIC code).\n2. Complete Companies House identity verification for each director.\n3. Apply for your business bank account, since most providers need your company registration details to open the account.";
}

function locationEligibilityNote(location: ConversationFacts["location"], accountType: ConversationFacts["accountType"]): string | null {
  if (location !== "pakistan" && location !== "outside_uk") return null;
  const place = location === "pakistan" ? "Pakistan" : "outside the UK";
  if (accountType === "personal") {
    return `Since you mentioned you're based in ${place}: most UK personal bank accounts require the applicant to be a UK resident, so a personal account may not be available to you directly. A UK business account tied to a UK-registered company is usually the more realistic route for non-UK residents.`;
  }
  return `Since you mentioned you're based in ${place}: eligibility for non-UK-resident applicants varies by provider. Several UK business banking providers do accept applications from directors based outside the UK once the company itself is UK-registered, but each provider runs its own eligibility and verification checks — this is worth confirming with the specific provider, or ask us and we'll help you find one that fits your situation.`;
}

/**
 * Understands the customer's full question (using conversation memory for
 * context), retrieves the relevant verified knowledge, and composes a
 * direct, multi-part, human-style answer. Returns null when nothing in
 * the message matches anything this engine can meaningfully address, so
 * the caller can fall through to the general-purpose responder.
 */
export async function composeAnswer(messages: ChatMessage[]): Promise<string | null> {
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUser) return null;

  const facts = extractFacts(messages);
  const intent = detectIntent(lastUser.text);
  const provider = intent.provider ?? facts.provider;

  const sections: string[] = [];
  let handled = false;

  if (intent.asksCompanyNeeded) {
    handled = true;
    sections.push(companyNeededSection(facts.accountType));
    const note = hasCompanyNote(facts.hasCompany);
    if (note) sections.push(note);
  }

  if (intent.asksCompanyFormationDocs) {
    handled = true;
    sections.push(await companyFormationChecklist());
  }

  if (intent.asksRJFormationService) {
    handled = true;
    sections.push(RJ_CATALOGUE.companyFormation.blurb);
  } else if (intent.mentionsCompanyFormation && facts.hasCompany !== true && !intent.asksBankAccountOptionsPostFormation) {
    // Structure calls for "what RJ Services can help with" even when not asked directly —
    // but only when the premise isn't already "I've formed my company."
    handled = true;
    sections.push(`If you haven't formed your company yet, RJ Services can help with the UK company formation process. Learn more: ${RJ_CATALOGUE.companyFormation.link}`);
  }

  if (provider && (intent.asksProviderDocs || intent.asksGenericDocs)) {
    handled = true;
    sections.push(await providerDocsSection(provider, facts.accountType));
  }

  if (intent.mentionsKYC) {
    handled = true;
    sections.push(kycExplanation());
  }

  if (intent.asksRJBankingService) {
    handled = true;
    sections.push(RJ_CATALOGUE.banking.blurb);
  }

  if (intent.asksBankAccountOptionsPostFormation) {
    handled = true;
    sections.push(bankAccountOptionsPostFormation());
  }

  if (intent.asksSequencing) {
    handled = true;
    sections.push(sequencingAdvice());
  }

  const locationNote = locationEligibilityNote(facts.location, facts.accountType);
  if (locationNote && (handled || facts.accountType || provider)) {
    sections.push(locationNote);
    handled = true;
  }

  if (!handled) return null;

  sections.push(COMPLIANCE_FOOTER);
  return sections.join("\n\n");
}

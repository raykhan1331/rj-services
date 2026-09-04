import { readKnowledge } from "./store";
import type { KnowledgeCategory, KnowledgeRecord } from "./types";

const PROVIDER_ALIASES: Record<string, string> = {
  lloyds: "Lloyds Bank",
  halifax: "Halifax",
  tide: "Tide",
  wise: "Wise",
  transferwise: "Wise",
  monzo: "Monzo",
  taptap: "Taptap",
  zempler: "Zempler Bank",
  cashplus: "Zempler Bank",
  "companies house": "Companies House",
  "gov.uk": "GOV.UK",
  govuk: "GOV.UK",
};

const CATEGORY_KEYWORDS: Record<KnowledgeCategory, string[]> = {
  personal_account_requirements: ["personal account", "personal bank"],
  business_account_requirements: ["business account", "business bank"],
  eligibility_requirements: ["eligible", "eligibility"],
  proof_of_identity: ["identity", "id document", "passport", "driving licence", "driver's licence"],
  proof_of_address: ["proof of address", "utility bill", "address verification"],
  business_documents: ["business document", "company document"],
  director_requirements: ["director"],
  psc_beneficial_owner_requirements: ["psc", "beneficial owner", "significant control"],
  kyc_requirements: ["kyc", "verification", "verify"],
  company_formation_requirements: ["form a company", "form a uk company", "set up a company", "set up a limited company", "register a company", "company formation", "incorporate", "start a company", "registering a company"],
  companies_house_identity_verification: ["companies house", "identity verification"],
};

export function identifyProvider(userText: string): string | null {
  const text = userText.toLowerCase();
  for (const [alias, name] of Object.entries(PROVIDER_ALIASES)) {
    if (text.includes(alias)) return name;
  }
  return null;
}

/** Finds verified knowledge records relevant to a customer's question, most useful first. */
export async function findRelevantKnowledge(userText: string): Promise<KnowledgeRecord[]> {
  const records = await readKnowledge();
  const text = userText.toLowerCase();
  const provider = identifyProvider(userText);

  const matchedCategories = (Object.keys(CATEGORY_KEYWORDS) as KnowledgeCategory[]).filter((cat) =>
    CATEGORY_KEYWORDS[cat].some((kw) => text.includes(kw))
  );

  // Neither a known provider nor a monitored category was mentioned — this
  // question isn't about anything the official-source system tracks (e.g.
  // eBay, marketing), so return no knowledge and let the general assistant
  // handle it, rather than surfacing unrelated bank/government knowledge.
  if (!provider && !matchedCategories.length) return [];

  let candidates = records.filter((r) => r.status !== "never_checked");
  if (provider) candidates = candidates.filter((r) => r.provider === provider);
  if (matchedCategories.length) candidates = candidates.filter((r) => matchedCategories.includes(r.category));

  // Records that actually hold extracted content are more useful than a
  // provider match that came back empty (e.g. a source that returned a
  // page we couldn't extract anything from) — surface those first.
  candidates = [...candidates].sort((a, b) => b.extractedRequirements.length - a.extractedRequirements.length);

  return candidates.slice(0, 4);
}

/** Direct lookup by category, for callers that already know exactly what they need. */
export async function getRecordsByCategory(categories: KnowledgeCategory[]): Promise<KnowledgeRecord[]> {
  const records = await readKnowledge();
  return records.filter((r) => r.status !== "never_checked" && categories.includes(r.category));
}

/** Direct lookup by provider name (as stored, e.g. "Lloyds Bank", "Tide"). */
export async function getRecordsByProvider(provider: string): Promise<KnowledgeRecord[]> {
  const records = await readKnowledge();
  return records.filter((r) => r.status !== "never_checked" && r.provider === provider);
}

export function freshnessLine(r: KnowledgeRecord): string {
  if (r.status === "unavailable") {
    return `last verified ${r.lastChanged ?? "unknown"} (source temporarily unreachable on the latest check — using the last verified version)`;
  }
  return `verified ${r.lastChanged ?? r.lastChecked ?? "unknown"}`;
}

/** Formats knowledge records as system-prompt context for the real AI call. */
export function formatKnowledgeForPrompt(records: KnowledgeRecord[]): string {
  if (!records.length) return "";
  const blocks = records.map((r) => {
    const reqs = r.extractedRequirements.length
      ? r.extractedRequirements.map((x) => `  - ${x}`).join("\n")
      : "  (no specific requirements extracted yet)";
    return `Provider: ${r.provider}\nCategory: ${r.category}\nSource: ${r.sourceUrl}\nFreshness: ${freshnessLine(r)}\nExtracted requirements:\n${reqs}`;
  });
  return `\n\nVERIFIED OFFICIAL SOURCE KNOWLEDGE (use this as the source of truth for this answer; mention that requirements can change and the provider makes the final decision):\n\n${blocks.join("\n\n---\n\n")}`;
}

/** Formats a direct answer from knowledge records for the no-AI-key fallback path. */
export function formatKnowledgeAnswer(records: KnowledgeRecord[], providerIdentified: boolean): string {
  const withContent = records.filter((r) => r.extractedRequirements.length > 0);
  // GOV.UK and Companies House are complementary sources for the same UK
  // government process, not alternative providers to choose between — only
  // genuinely distinct bank providers make an answer ambiguous.
  const distinctBankProviders = [...new Set(records.filter((r) => r.type === "bank").map((r) => r.provider))];
  const footer = "Requirements can change and the final documents requested are determined by the provider. We can't guarantee approval.";

  // Ambiguous: several bank providers could apply and the customer didn't name one.
  if (!providerIdentified && distinctBankProviders.length > 1) {
    const list = distinctBankProviders.join(", ");
    return `This can vary by provider — we work with ${list} for this. Could you let me know which one you're asking about? ${footer}`;
  }

  const best = withContent[0] ?? records[0];
  const lines = best.extractedRequirements.slice(0, 6);
  const intro = `Based on ${best.provider}'s official information (${freshnessLine(best)}):`;
  const body = lines.length
    ? lines.map((l) => `• ${l}`).join("\n")
    : "We don't have specific requirements extracted for this yet — please check directly with the provider.";
  return `${intro}\n${body}\n\n${footer}`;
}

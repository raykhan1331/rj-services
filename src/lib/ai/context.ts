import type { ChatMessage } from "./types";
import { identifyProvider } from "@/lib/knowledge/retrieve";
import { normalizeTypos } from "./fuzzy";

export type AccountType = "personal" | "sole_trader" | "business" | null;
export type Location = "uk" | "pakistan" | "outside_uk" | null;

export interface ConversationFacts {
  location: Location;
  accountType: AccountType;
  /** true = customer already has a UK company, false = explicitly does not yet, null = not mentioned. */
  hasCompany: boolean | null;
  provider: string | null;
}

const HAS_COMPANY_YES = /\b(i (already )?have a (uk )?company|i've (already )?formed (a|my) (uk )?company|already formed (a|my) (uk )?company|already (have|got) (a|my) (uk )?(limited )?company)\b/;
const HAS_COMPANY_NO = /\b(don'?t have a (uk )?company|do not have a (uk )?company|no (uk )?company (yet)?|haven'?t formed|have not formed|not formed (a company )?yet|not yet formed)\b/;

/**
 * Scans the full conversation (oldest to newest) for facts the customer has
 * stated, so later turns are answered with the context already given —
 * e.g. "I am in Pakistan" followed later by "I want a UK business account".
 * A later statement for the same slot overrides an earlier one.
 */
export function extractFacts(messages: ChatMessage[]): ConversationFacts {
  const facts: ConversationFacts = { location: null, accountType: null, hasCompany: null, provider: null };

  for (const m of messages) {
    if (m.role !== "user") continue;
    const t = normalizeTypos(m.text.toLowerCase());

    if (/\bpakistan\b/.test(t)) {
      facts.location = "pakistan";
    } else if (/\b(outside (of )?the uk|not (currently )?(in|based in) the uk|non[- ]uk resident|i (do not|don'?t) live in the uk)\b/.test(t)) {
      facts.location = "outside_uk";
    } else if (/\b(in the uk|uk[- ]based|i live in the uk|i'?m in the uk|based in the uk)\b/.test(t)) {
      facts.location = "uk";
    }

    if (/\bsole trader\b/.test(t)) {
      facts.accountType = "sole_trader";
    } else if (/\bpersonal (bank )?account\b/.test(t)) {
      facts.accountType = "personal";
    } else if (/\bbusiness (bank )?account\b/.test(t)) {
      facts.accountType = "business";
    }

    if (HAS_COMPANY_NO.test(t)) {
      facts.hasCompany = false;
    } else if (HAS_COMPANY_YES.test(t)) {
      facts.hasCompany = true;
    }

    const provider = identifyProvider(m.text);
    if (provider && provider !== "GOV.UK" && provider !== "Companies House") {
      facts.provider = provider;
    }
  }

  return facts;
}

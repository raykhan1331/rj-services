import { identifyProvider } from "@/lib/knowledge/retrieve";
import { normalizeTypos } from "./fuzzy";

export interface Intent {
  mentionsCompanyFormation: boolean;
  asksCompanyNeeded: boolean;
  asksCompanyFormationDocs: boolean;
  asksRJFormationService: boolean;
  asksProviderDocs: boolean;
  asksGenericDocs: boolean;
  asksBankAccountOptionsPostFormation: boolean;
  asksSequencing: boolean;
  mentionsKYC: boolean;
  asksRJBankingService: boolean;
  provider: string | null;
}

const RE_COMPANY_FORMATION = /\b(form(ing|ed)?|register(ing|ed)?|set(ting)? up|incorporat\w*)\b[\s\S]{0,25}\b(a |my |the )?(uk )?(limited )?compan(y|ies)\b|\bcompany formation\b/;
const RE_NEED = /\b(do i need|need to|is .*(required|needed)|need a|required to|have to)\b/;
const RE_NEED_COMPANY = /\b(do i need|need a|need to (have|form|register)|is .*(required|needed)|required to (have|register|form)|have to (have|form|register))\b[\s\S]{0,25}\b(a |my |the )?(uk )?(limited )?compan(y|ies)\b/;
const RE_RJ_PROVIDE = /\b(do you|does rj services|can you|are you able to|will you|you also|you guys|you can)\b[\s\S]{0,50}\b(provide|offer|help( me)?( out)?|assist)\b/;
const RE_DOCS_PHRASE = /\bwhat (do i need|documents|information|do you need)\b|\bdocuments? (do i need|are (required|needed))\b|\bwhat'?s (needed|required)\b/;
const RE_POST_FORMATION = /\bafter\b[\s\S]{0,20}\bform|\bonce\b[\s\S]{0,20}\bform|\bwhich[\s\S]{0,15}(business )?(bank )?accounts?[\s\S]{0,15}(can|could) i apply/;
const RE_SEQUENCING = /\bwhat should i do first\b|\bwhich (should i )?do first\b|\bdo first\b|\bfirst,? (form|open|apply)\b|\band then\b|\bwhat.?s the (right|correct) order\b/;
const RE_KYC = /\bkyc\b/;
const RE_MENTIONS_BANKING = /\b(bank account|business account|banking|open(ing)? an? account)\b/;
const RE_NECESSITY_STRONG = /\b(mandatory|is it required|do i have to|is it necessary|necessary)\b/;

export function detectIntent(rawText: string): Intent {
  // Correct likely typos (compnay -> company, doucments -> documents, etc.)
  // before any keyword matching runs, so real-world messages with spelling
  // mistakes are understood the same as cleanly typed ones.
  const t = normalizeTypos(rawText.toLowerCase());

  const mentionsCompanyFormation = RE_COMPANY_FORMATION.test(t);
  const mentionsNeed = RE_NEED.test(t);
  const asksDocsPhrase = RE_DOCS_PHRASE.test(t);
  const provider = identifyProvider(normalizeTypos(rawText));

  // A "what documents do I need to form a company" question already implies
  // they're forming one, so the "do you need a company at all" explainer
  // would normally be a redundant preamble — UNLESS the message also
  // contains an explicit necessity signal ("first", "mandatory", "have to"),
  // which means the customer is genuinely asking both things at once.
  const asksCompanyFormationDocs = mentionsCompanyFormation && asksDocsPhrase;
  const hasNecessitySignal =
    RE_NEED_COMPANY.test(t) || RE_NECESSITY_STRONG.test(t) || (mentionsCompanyFormation && /\bfirst\b/.test(t));
  const asksCompanyNeeded =
    hasNecessitySignal || (!asksCompanyFormationDocs && mentionsCompanyFormation && mentionsNeed);

  return {
    mentionsCompanyFormation,
    asksCompanyNeeded,
    asksCompanyFormationDocs,
    asksRJFormationService: mentionsCompanyFormation && RE_RJ_PROVIDE.test(t),
    asksProviderDocs: !!provider && asksDocsPhrase,
    asksGenericDocs: asksDocsPhrase && !provider && !mentionsCompanyFormation,
    asksBankAccountOptionsPostFormation: RE_POST_FORMATION.test(t),
    asksSequencing: RE_SEQUENCING.test(t) && (mentionsCompanyFormation || /\baccount\b/.test(t)),
    mentionsKYC: RE_KYC.test(t),
    asksRJBankingService: RE_RJ_PROVIDE.test(t) && RE_MENTIONS_BANKING.test(t),
    provider: provider && provider !== "GOV.UK" && provider !== "Companies House" ? provider : null,
  };
}

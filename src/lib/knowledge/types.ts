export type KnowledgeCategory =
  | "personal_account_requirements"
  | "business_account_requirements"
  | "eligibility_requirements"
  | "proof_of_identity"
  | "proof_of_address"
  | "business_documents"
  | "director_requirements"
  | "psc_beneficial_owner_requirements"
  | "kyc_requirements"
  | "company_formation_requirements"
  | "companies_house_identity_verification";

export type SourceType = "bank" | "government";

export type SourceStatus = "ok" | "unavailable" | "never_checked";

export interface SourceConfig {
  id: string;
  provider: string;
  type: SourceType;
  category: KnowledgeCategory;
  url: string;
}

export interface KnowledgeRecord {
  id: string;
  provider: string;
  type: SourceType;
  sourceUrl: string;
  pageTitle: string | null;
  category: KnowledgeCategory;
  extractedRequirements: string[];
  contentHash: string | null;
  /** Bumps only when detected content actually changes — never on an unchanged re-check. */
  version: number;
  lastChecked: string | null;
  lastChanged: string | null;
  status: SourceStatus;
  lastError: string | null;
  lastChangeSummary: string | null;
}

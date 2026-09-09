import { isGoogleOAuthConfigured } from "./config";
import { getConnectionMetadata } from "./tokenStore";
import type { GscConnectionStatus } from "../types";

// STEP 3 Task 7 — the ONLY function API routes should call to report
// connection state. Returns metadata only; never a token value.
export async function getConnectionStatus(lastError: string | null = null): Promise<GscConnectionStatus> {
  if (!isGoogleOAuthConfigured()) {
    return { state: "not-configured", propertyUrl: null, connectedAt: null, scope: null, lastError };
  }

  const meta = await getConnectionMetadata();
  if (!meta) {
    return { state: "not-connected", propertyUrl: null, connectedAt: null, scope: null, lastError };
  }

  return {
    state: lastError ? "needs-reauth" : "connected",
    propertyUrl: meta.propertyUrl,
    connectedAt: meta.connectedAt,
    scope: meta.scope,
    lastError,
  };
}

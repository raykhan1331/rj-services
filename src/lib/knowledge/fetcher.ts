export interface FetchResult {
  ok: boolean;
  pageTitle: string | null;
  text: string | null;
  error: string | null;
}

// Fetches one official source page. Server-only — never called from the browser.
export async function fetchSource(url: string): Promise<FetchResult> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "RJServicesKnowledgeBot/1.0 (+official source monitoring for RJ Services)",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return { ok: false, pageTitle: null, text: null, error: `HTTP ${res.status}` };
    }

    const html = await res.text();
    return { ok: true, pageTitle: extractTitle(html), text: htmlToText(html), error: null };
  } catch (err) {
    return { ok: false, pageTitle: null, text: null, error: err instanceof Error ? err.message : "Fetch failed" };
  }
}

function extractTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return match ? match[1].trim() : null;
}

function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&rsquo;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

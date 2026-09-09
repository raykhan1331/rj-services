import { parseHtml } from "./htmlParser";
import type { ParsedPage } from "./types";

const FETCH_TIMEOUT_MS = 10_000;

export async function fetchText(url: string): Promise<{ status: number | null; text: string | null; error: string | null }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { "User-Agent": "RJServicesSeoAgent/1.0" } });
    const text = await res.text();
    return { status: res.status, text, error: null };
  } catch (err) {
    return { status: null, text: null, error: err instanceof Error ? err.message : "Unknown fetch error" };
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchAndParsePage(url: string): Promise<ParsedPage> {
  const { status, text, error } = await fetchText(url);
  if (!text) {
    return {
      url,
      httpStatus: status,
      fetchError: error,
      title: null,
      metaDescription: null,
      canonical: null,
      robotsMeta: null,
      ogTitle: null,
      ogDescription: null,
      ogUrl: null,
      h1s: [],
      h2s: [],
      h3s: [],
      images: [],
      internalLinks: [],
      internalLinkDetails: [],
      externalLinks: [],
      jsonLdTypes: [],
      wordCount: 0,
      contentSnippet: "",
    };
  }
  return { url, httpStatus: status, fetchError: null, ...parseHtml(url, text) };
}

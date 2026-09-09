import type { ParsedPage } from "./types";

// Deliberately regex-based rather than pulling in a DOM/HTML-parsing
// dependency (cheerio, jsdom, etc.) — the project's instruction is to keep
// dependencies minimal, and the fields we need (title, meta tags, headings,
// links, images, JSON-LD) are all reliably extractable this way from
// server-rendered Next.js output without a full parser.

function matchAll(html: string, re: RegExp): RegExpMatchArray[] {
  return Array.from(html.matchAll(re));
}

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    // STEP 9 fix — React/Next.js's server-rendered HTML encodes an
    // apostrophe as the HEX entity &#x27; (or &#X27;), not just the
    // decimal &#39; already handled above. Missing this meant any
    // rendered apostrophe never decoded back to a literal "'", so
    // evidence captured from HTML could never exact-match the same text
    // in TypeScript source — discovered because it broke STEP 9's
    // execution staleness check on real pages ("RJ Services'" etc).
    .replace(/&#0?39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&#x2019;/gi, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function stripTags(html: string): string {
  return decodeEntities(html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " "));
}

function attr(tag: string, name: string): string | null {
  const re = new RegExp(`${name}\\s*=\\s*["']([^"']*)["']`, "i");
  const m = tag.match(re);
  return m ? decodeEntities(m[1]) : null;
}

export function parseHtml(url: string, html: string): Omit<ParsedPage, "url" | "httpStatus" | "fetchError"> {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? decodeEntities(titleMatch[1]) : null;

  const metaTags = matchAll(html, /<meta\s+[^>]*>/gi).map((m) => m[0]);
  const findMeta = (attrName: "name" | "property", value: string) => {
    const tag = metaTags.find((t) => new RegExp(`${attrName}\\s*=\\s*["']${value}["']`, "i").test(t));
    return tag ? attr(tag, "content") : null;
  };

  const canonicalMatch = html.match(/<link\s+[^>]*rel\s*=\s*["']canonical["'][^>]*>/i);
  const canonical = canonicalMatch ? attr(canonicalMatch[0], "href") : null;

  const h1s = matchAll(html, /<h1[^>]*>([\s\S]*?)<\/h1>/gi).map((m) => stripTags(m[1]));
  const h2s = matchAll(html, /<h2[^>]*>([\s\S]*?)<\/h2>/gi).map((m) => stripTags(m[1]));
  const h3s = matchAll(html, /<h3[^>]*>([\s\S]*?)<\/h3>/gi).map((m) => stripTags(m[1]));

  const images = matchAll(html, /<img\s+[^>]*>/gi).map((m) => ({
    src: attr(m[0], "src") ?? "",
    alt: attr(m[0], "alt"),
  }));

  let origin: string;
  try {
    origin = new URL(url).origin;
  } catch {
    origin = "";
  }

  const internalLinks = new Set<string>();
  const externalLinks = new Set<string>();
  // STEP 7 Task 1/5 — captures the FULL <a>...</a> element (not just the
  // opening tag, as the internalLinks-only extraction below does) so the
  // real visible anchor text is available for the link graph and anchor-
  // text-quality checks. Reuses the same already-fetched HTML — no new
  // network request.
  const internalLinkDetails: { href: string; anchorText: string }[] = [];
  for (const m of matchAll(html, /<a\s+[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const href = decodeEntities(m[1]);
    const anchorText = stripTags(m[2]);
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("javascript:")) {
      continue;
    }
    if (href.startsWith("/")) {
      internalLinks.add(href);
      internalLinkDetails.push({ href, anchorText });
    } else if (href.startsWith("http")) {
      try {
        const linkOrigin = new URL(href).origin;
        if (linkOrigin === origin) {
          const path = new URL(href).pathname;
          internalLinks.add(path);
          internalLinkDetails.push({ href: path, anchorText });
        } else {
          externalLinks.add(href);
        }
      } catch {
        // ignore malformed hrefs
      }
    }
  }

  const jsonLdTypes: string[] = [];
  for (const m of matchAll(html, /<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const parsed = JSON.parse(m[1].trim());
      const items = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of items) {
        if (item && typeof item === "object" && "@type" in item) {
          jsonLdTypes.push(String((item as Record<string, unknown>)["@type"]));
        }
      }
    } catch {
      // malformed JSON-LD is itself worth flagging by the caller via an empty jsonLdTypes result
    }
  }

  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const bodyText = bodyMatch ? stripTags(bodyMatch[1].replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "")) : "";
  const bodyWords = bodyText.split(/\s+/).filter(Boolean);
  const wordCount = bodyWords.length;
  // STEP 6 — a short, real prefix of the page's own visible text, kept
  // only to ground on-page recommendations in actual content.
  const contentSnippet = bodyWords.slice(0, 40).join(" ");

  return {
    contentSnippet,
    title,
    metaDescription: findMeta("name", "description"),
    robotsMeta: findMeta("name", "robots"),
    ogTitle: findMeta("property", "og:title"),
    ogDescription: findMeta("property", "og:description"),
    ogUrl: findMeta("property", "og:url"),
    canonical,
    h1s,
    h2s,
    h3s,
    images,
    internalLinks: Array.from(internalLinks),
    internalLinkDetails,
    externalLinks: Array.from(externalLinks),
    jsonLdTypes,
    wordCount,
  };
}

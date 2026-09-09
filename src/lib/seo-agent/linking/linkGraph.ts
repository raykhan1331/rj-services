import type { CrawledPage } from "../crawler";
import type { LinkGraphEdge, LinkGraphNode, LinkGraphSummary, OrphanClassification } from "../types";

// STEP 7 Task 1/2 — builds a lightweight internal-link graph from the
// SAME in-memory crawl runAudit.ts already performed (no new crawl, no
// new network request). Nodes are real crawled pages; edges are real
// <a> elements found on those pages, each carrying its real visible
// anchor text (STEP 7's htmlParser.ts extension).

const FEW_INCOMING_THRESHOLD = 2;
const FEW_OUTGOING_THRESHOLD = 2;
const WEAKLY_CONNECTED_MAX = 2; // 1-2 inbound = weakly connected; 0 = potential orphan; 3+ = normally connected

function normalizePath(p: string): string {
  const stripped = p.split("?")[0].split("#")[0];
  return stripped.length > 1 && stripped.endsWith("/") ? stripped.slice(0, -1) : stripped || "/";
}

function classify(inboundCount: number): OrphanClassification {
  if (inboundCount === 0) return "potential-orphan";
  if (inboundCount <= WEAKLY_CONNECTED_MAX) return "weakly-connected";
  return "normally-connected";
}

export function buildLinkGraph(crawled: CrawledPage[]): LinkGraphSummary {
  const fetchable = crawled.filter((c) => !c.parsed.fetchError);

  // Edges: group by (source, target) so multiple links between the same
  // two pages become one edge with all their distinct real anchor texts.
  const edgeMap = new Map<string, LinkGraphEdge>();
  const inboundCount = new Map<string, number>();
  const outboundCount = new Map<string, number>();

  for (const { route, parsed } of fetchable) {
    const source = normalizePath(route.path);
    let outbound = 0;
    for (const { href, anchorText } of parsed.internalLinkDetails) {
      const target = normalizePath(href);
      if (target === source) continue; // self-links aren't meaningful graph edges
      outbound += 1;
      inboundCount.set(target, (inboundCount.get(target) ?? 0) + 1);

      const key = `${source}→${target}`;
      const existing = edgeMap.get(key);
      const trimmedAnchor = anchorText.trim();
      if (existing) {
        if (trimmedAnchor && !existing.anchorTexts.includes(trimmedAnchor)) existing.anchorTexts.push(trimmedAnchor);
      } else {
        edgeMap.set(key, { source, target, anchorTexts: trimmedAnchor ? [trimmedAnchor] : [] });
      }
    }
    outboundCount.set(source, outbound);
  }

  const nodes: LinkGraphNode[] = fetchable.map(({ route }) => {
    const path = normalizePath(route.path);
    const inbound = inboundCount.get(path) ?? 0;
    return {
      path,
      kind: route.kind,
      isPriority: route.kind === "service" || route.kind === "hub",
      inboundCount: inbound,
      outboundCount: outboundCount.get(path) ?? 0,
      classification: classify(inbound),
    };
  });

  const potentialOrphanCount = nodes.filter((n) => n.classification === "potential-orphan").length;
  const weaklyConnectedCount = nodes.filter((n) => n.classification === "weakly-connected").length;
  const pagesWithFewIncoming = nodes.filter((n) => n.isPriority && n.inboundCount < FEW_INCOMING_THRESHOLD).map((n) => n.path);
  const pagesWithFewOutgoing = nodes.filter((n) => n.outboundCount < FEW_OUTGOING_THRESHOLD).map((n) => n.path);

  return {
    nodes,
    edges: Array.from(edgeMap.values()),
    totalInternalLinks: Array.from(edgeMap.values()).length,
    potentialOrphanCount,
    weaklyConnectedCount,
    pagesWithFewIncoming,
    pagesWithFewOutgoing,
  };
}

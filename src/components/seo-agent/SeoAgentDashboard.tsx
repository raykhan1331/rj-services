"use client";

import { useCallback, useEffect, useState } from "react";

// STEP 8 Task 10 / STEP 9 Task 4/12 — internal SEO Agent dashboard:
// overview + Change Management (action queue, approvals, execution,
// rollback) + AI SEO Assistant. Deliberately separate from
// src/components/chat/ChatWidget (the CUSTOMER-facing chatbot) —
// different component tree, different API routes, never touches or
// imports anything under src/lib/ai/**.
//
// Gated by the SAME shared admin secret every /api/seo-agent/* route
// already requires (checkSeoAgentAuth) — entered once, kept in
// sessionStorage for this tab only (never localStorage, never sent
// anywhere but this site's own API routes).

const SECRET_STORAGE_KEY = "seo-agent-admin-secret";

interface EvidenceItem {
  url?: string;
  metric?: string;
  currentValue?: string;
  issue?: string;
  reason?: string;
  recommendedAction?: string;
  actionId?: string;
}

interface AssistantResult {
  question: string;
  intent: string;
  text: string;
  evidence: EvidenceItem[];
  relatedActionIds: string[];
  gscUsed: boolean;
  aiPolished: boolean;
  aiProvider: string;
}

interface Overview {
  quickActions: string[];
  gscConnected: boolean;
  lastScanAt: string | null;
  overallScore: number | null;
  pendingApprovals: number;
}

interface ActionItem {
  id: string;
  page: string | null;
  issueType: string;
  problem: string;
  evidence?: string;
  recommendedValue?: string;
  recommendedAction: string;
  expectedBenefit: string;
  riskLevel: "low" | "medium" | "high";
  automationTier: string;
  requiresApproval: boolean;
  status: string;
  source: string;
  createdAt: string;
}

interface ChangeManagement {
  pendingApprovals: number;
  approvedActions: number;
  executingActions: number;
  completedActions: number;
  failedActions: number;
  rollbackAvailable: number;
  rejectedActions: number;
  highRiskActions: number;
}

interface HealthScoreFactor {
  factor: string;
  weight: number;
  contribution: number;
  explanation: string;
}

interface HealthScore {
  score: number;
  factors: HealthScoreFactor[];
  unavailableComponents: string[];
}

interface Alert {
  id: string;
  type: string;
  severity: "critical" | "warning" | "info";
  page: string | null;
  evidence: string;
  detectedAt: string;
  recommendedNextStep: string;
}

interface MonitoringRun {
  id: string;
  startedAt: string;
  endedAt: string | null;
  status: string;
  modulesExecuted: string[];
  modulesFailed: { module: string; error: string }[];
}

interface GscConnectionStatus {
  state: "not-configured" | "not-connected" | "connected" | "needs-reauth";
  propertyUrl: string | null;
  connectedAt: string | null;
  scope: string | null;
  lastError: string | null;
}

interface GscRow {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface GscPerformanceSummary {
  range: { startDate: string; endDate: string };
  totalClicks: number;
  totalImpressions: number;
  averageCtr: number;
  averagePosition: number;
  topQueries: GscRow[];
  topPages: GscRow[];
}

interface GscPeriodComparison {
  current: GscPerformanceSummary;
  previous: GscPerformanceSummary;
}

type ChatEntry = { role: "user"; text: string } | { role: "assistant"; result: AssistantResult };

function useSeoAgentFetch(secret: string) {
  return useCallback(
    async (path: string, init?: RequestInit) => {
      return fetch(path, { ...init, headers: { ...(init?.headers ?? {}), "x-seo-agent-secret": secret, "Content-Type": "application/json" } });
    },
    [secret]
  );
}

export default function SeoAgentDashboard() {
  const [secret, setSecret] = useState("");
  const [secretInput, setSecretInput] = useState(() => (typeof window !== "undefined" ? sessionStorage.getItem(SECRET_STORAGE_KEY) ?? "" : ""));
  const [unlocked, setUnlocked] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [changeManagement, setChangeManagement] = useState<ChangeManagement | null>(null);
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [actionsFilter, setActionsFilter] = useState<"needs-decision" | "approved" | "completed" | "all">("needs-decision");
  const [history, setHistory] = useState<ChatEntry[]>([]);
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<Record<string, string>>({});
  const [healthScore, setHealthScore] = useState<HealthScore | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [latestRun, setLatestRun] = useState<MonitoringRun | null>(null);
  const [runningMonitoring, setRunningMonitoring] = useState(false);
  const [monitoringMessage, setMonitoringMessage] = useState<string | null>(null);
  const [gscStatus, setGscStatus] = useState<GscConnectionStatus | null>(null);
  const [gscPerformance, setGscPerformance] = useState<GscPeriodComparison | null>(null);
  const [gscBusy, setGscBusy] = useState(false);
  const [gscMessage, setGscMessage] = useState<string | null>(null);

  const seoFetch = useSeoAgentFetch(secret);

  const loadOverview = useCallback(async (secretToUse: string) => {
    const res = await fetch("/api/seo-agent/assistant", { headers: { "x-seo-agent-secret": secretToUse } });
    if (res.status === 401) return false;
    if (res.status === 501) {
      setAuthError("SEO Agent admin access is not configured on the server (SEO_AGENT_ADMIN_SECRET is unset).");
      return false;
    }
    const data: Overview = await res.json();
    setOverview(data);
    return true;
  }, []);

  const loadActionsAndChanges = useCallback(
    async (secretToUse: string) => {
      const [actionsRes, dashRes, alertsRes, statusRes] = await Promise.all([
        fetch("/api/seo-agent/actions", { headers: { "x-seo-agent-secret": secretToUse } }),
        fetch("/api/seo-agent/dashboard", { headers: { "x-seo-agent-secret": secretToUse } }),
        fetch("/api/seo-agent/alerts", { headers: { "x-seo-agent-secret": secretToUse } }),
        fetch("/api/seo-agent/monitoring/status", { headers: { "x-seo-agent-secret": secretToUse } }),
      ]);
      if (actionsRes.ok) {
        const data = await actionsRes.json();
        setActions(data.actions ?? []);
      }
      if (dashRes.ok) {
        const data = await dashRes.json();
        setChangeManagement(data.changeManagement ?? null);
        setGscStatus(data.searchConsole?.connection ?? null);
        setGscPerformance(data.searchConsole?.performance ?? null);
      }
      if (alertsRes.ok) {
        const data = await alertsRes.json();
        setHealthScore(data.healthScore ?? null);
        setAlerts(data.alerts ?? []);
      }
      if (statusRes.ok) {
        const data = await statusRes.json();
        setLatestRun(data.latestRun ?? null);
      }
    },
    []
  );

  const runMonitoringNow = useCallback(async () => {
    setRunningMonitoring(true);
    setMonitoringMessage(null);
    try {
      const res = await seoFetch("/api/seo-agent/monitoring/run", { method: "GET" });
      const data = await res.json();
      setMonitoringMessage(data.skipped ? data.reason : `Monitoring run ${data.run?.status ?? "finished"} — health score ${data.healthScore?.score ?? "N/A"}/100.`);
      await Promise.all([loadOverview(secret), loadActionsAndChanges(secret)]);
    } catch {
      setMonitoringMessage("Monitoring run request failed.");
    } finally {
      setRunningMonitoring(false);
    }
  }, [seoFetch, secret, loadOverview, loadActionsAndChanges]);

  const refreshGscStatus = useCallback(async () => {
    await loadActionsAndChanges(secret);
  }, [secret, loadActionsAndChanges]);

  const connectGsc = useCallback(async () => {
    setGscBusy(true);
    setGscMessage(null);
    try {
      const res = await seoFetch("/api/seo-agent/gsc/connect");
      const data = await res.json();
      if (!res.ok || !data.authUrl) {
        setGscMessage(data.error?.message ?? data.error ?? "Could not start the Google authorization flow.");
        return;
      }
      // Opened in a new tab so the exchange happens in the site owner's
      // OWN logged-in Google session — never handled inside this SPA.
      window.open(data.authUrl, "_blank", "noopener,noreferrer");
      setGscMessage("A new tab opened for Google authorization. After approving access there, come back here and click \"Refresh Status\".");
    } catch {
      setGscMessage("Could not reach the server to start the Google authorization flow.");
    } finally {
      setGscBusy(false);
    }
  }, [seoFetch]);

  const disconnectGsc = useCallback(async () => {
    setGscBusy(true);
    setGscMessage(null);
    try {
      await seoFetch("/api/seo-agent/gsc/disconnect", { method: "POST" });
      setGscMessage("Search Console disconnected. The locally stored authorization was removed.");
      await refreshGscStatus();
    } catch {
      setGscMessage("Disconnect request failed.");
    } finally {
      setGscBusy(false);
    }
  }, [seoFetch, refreshGscStatus]);

  const tryUnlock = useCallback(
    async (candidate: string) => {
      setAuthError(null);
      const ok = await loadOverview(candidate);
      if (ok) {
        setSecret(candidate);
        setUnlocked(true);
        sessionStorage.setItem(SECRET_STORAGE_KEY, candidate);
        loadActionsAndChanges(candidate);
      } else {
        setAuthError((prev) => prev ?? "Incorrect admin secret.");
      }
    },
    [loadOverview, loadActionsAndChanges]
  );

  useEffect(() => {
    if (secretInput && !unlocked) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      tryUnlock(secretInput);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([loadOverview(secret), loadActionsAndChanges(secret)]);
  }, [secret, loadOverview, loadActionsAndChanges]);

  const askQuestion = useCallback(
    async (q: string) => {
      if (!q.trim() || asking) return;
      setAsking(true);
      setHistory((h) => [...h, { role: "user", text: q }]);
      setQuestion("");
      try {
        const res = await seoFetch("/api/seo-agent/assistant", { method: "POST", body: JSON.stringify({ question: q }) });
        const result: AssistantResult = await res.json();
        setHistory((h) => [...h, { role: "assistant", result }]);
      } catch {
        setHistory((h) => [...h, { role: "assistant", result: { question: q, intent: "unknown", text: "The assistant request failed — please try again.", evidence: [], relatedActionIds: [], gscUsed: false, aiPolished: false, aiProvider: "none" } }]);
      } finally {
        setAsking(false);
      }
    },
    [asking, seoFetch]
  );

  const decideAction = useCallback(
    async (actionId: string, status: "approved" | "rejected" | "skipped") => {
      setActionBusy(actionId);
      try {
        await seoFetch(`/api/seo-agent/actions/${encodeURIComponent(actionId)}`, { method: "PATCH", body: JSON.stringify({ status }) });
        await refreshAll();
      } finally {
        setActionBusy(null);
      }
    },
    [seoFetch, refreshAll]
  );

  const executeAction = useCallback(
    async (actionId: string) => {
      setActionBusy(actionId);
      try {
        const res = await seoFetch(`/api/seo-agent/actions/${encodeURIComponent(actionId)}/execute`, { method: "POST", body: JSON.stringify({}) });
        const data = await res.json();
        setActionMessage((m) => ({ ...m, [actionId]: data.message }));
        await refreshAll();
      } finally {
        setActionBusy(null);
      }
    },
    [seoFetch, refreshAll]
  );

  const rollbackAction = useCallback(
    async (actionId: string) => {
      setActionBusy(actionId);
      try {
        const res = await seoFetch(`/api/seo-agent/actions/${encodeURIComponent(actionId)}/rollback`, { method: "POST", body: JSON.stringify({ confirm: true }) });
        const data = await res.json();
        setActionMessage((m) => ({ ...m, [actionId]: data.message }));
        await refreshAll();
      } finally {
        setActionBusy(null);
      }
    },
    [seoFetch, refreshAll]
  );

  if (!unlocked) {
    return (
      <div className="min-h-[70vh] bg-black text-white flex items-center justify-center px-6">
        <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h1 className="text-lg font-semibold">SEO Agent Dashboard</h1>
          <p className="mt-2 text-sm text-zinc-400">Internal tool. Enter the admin secret to continue.</p>
          <input
            type="password"
            value={secretInput}
            onChange={(e) => setSecretInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && tryUnlock(secretInput)}
            placeholder="Admin secret"
            className="mt-4 w-full rounded-full border border-white/20 bg-transparent px-4 py-2 text-sm outline-none focus:border-white/40"
          />
          {authError && <p className="mt-2 text-xs text-red-400">{authError}</p>}
          <button onClick={() => tryUnlock(secretInput)} className="mt-4 w-full rounded-full bg-white text-black px-4 py-2 text-sm font-medium hover:opacity-90">
            Unlock
          </button>
        </div>
      </div>
    );
  }

  const filteredActions = actions.filter((a) => {
    if (actionsFilter === "needs-decision") return a.status === "pending" || a.status === "review-required";
    if (actionsFilter === "approved") return a.status === "approved" || a.status === "executing" || a.status === "validating";
    if (actionsFilter === "completed") return a.status === "done" || a.status === "rollback-available";
    return true;
  });

  return (
    <div className="bg-black text-white min-h-screen">
      <div className="mx-auto w-full max-w-5xl px-6 py-12">
        <h1 className="text-2xl font-semibold">SEO Agent Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-400">Internal tool — not indexed, not linked from the public site.</p>

        {overview && (
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <OverviewCard label="Overall Score" value={overview.overallScore !== null ? `${overview.overallScore}/100` : "N/A"} />
            <OverviewCard label="Pending Approvals" value={String(overview.pendingApprovals)} />
            <OverviewCard label="Search Console" value={overview.gscConnected ? "Connected" : "Not connected"} />
            <OverviewCard label="Last Scan" value={overview.lastScanAt ? new Date(overview.lastScanAt).toLocaleString() : "Never"} />
          </div>
        )}

        <div className="mt-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-sm font-semibold text-zinc-300">Monitoring &amp; Alerts</h2>
            <button onClick={runMonitoringNow} disabled={runningMonitoring} className="rounded-full border border-white/20 px-3 py-1 text-xs hover:bg-white/10 disabled:opacity-40">
              {runningMonitoring ? "Running…" : "Run Monitoring Now"}
            </button>
          </div>
          {monitoringMessage && <p className="mt-1 text-xs text-zinc-400">{monitoringMessage}</p>}
          <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <OverviewCard label="SEO Health Score" value={healthScore ? `${healthScore.score}/100` : "N/A"} />
            <OverviewCard label="Open Alerts" value={String(alerts.length)} />
            <OverviewCard label="Critical Alerts" value={String(alerts.filter((a) => a.severity === "critical").length)} />
            <OverviewCard label="Latest Run" value={latestRun ? latestRun.status : "Never run"} />
          </div>
          {alerts.length > 0 && (
            <div className="mt-3 space-y-2">
              {alerts.slice(0, 6).map((a) => (
                <div key={a.id} className="rounded-lg border border-white/10 bg-black/30 p-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className={`font-semibold ${a.severity === "critical" ? "text-red-300" : a.severity === "warning" ? "text-amber-300" : "text-zinc-400"}`}>{a.severity.toUpperCase()}</span>
                    <span className="text-zinc-500">{new Date(a.detectedAt).toLocaleString()}</span>
                  </div>
                  <p className="mt-1 text-zinc-300">{a.type}{a.page ? ` — ${a.page}` : ""}</p>
                  <p className="mt-1 text-zinc-400">{a.evidence}</p>
                  <p className="mt-1 text-emerald-300/90">{a.recommendedNextStep}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-sm font-semibold text-zinc-300">Search Console</h2>
            <div className="flex gap-2">
              <button onClick={refreshGscStatus} disabled={gscBusy} className="rounded-full border border-white/20 px-3 py-1 text-xs hover:bg-white/10 disabled:opacity-40">
                Refresh Status
              </button>
              {gscStatus?.state === "connected" ? (
                <button onClick={disconnectGsc} disabled={gscBusy} className="rounded-full border border-white/20 px-3 py-1 text-xs hover:bg-white/10 disabled:opacity-40">
                  Disconnect
                </button>
              ) : (
                <button
                  onClick={connectGsc}
                  disabled={gscBusy || gscStatus?.state === "not-configured"}
                  title={gscStatus?.state === "not-configured" ? "Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GSC_TOKEN_ENCRYPTION_SECRET first." : undefined}
                  className="rounded-full border border-white/20 px-3 py-1 text-xs hover:bg-white/10 disabled:opacity-40"
                >
                  Connect Search Console
                </button>
              )}
            </div>
          </div>

          <p className="mt-2 text-xs text-zinc-500">
            {gscStatus?.state === "not-configured" && "Google Search Console is not configured on the server yet (missing GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GSC_TOKEN_ENCRYPTION_SECRET)."}
            {gscStatus?.state === "not-connected" && "Google Search Console is not connected."}
            {gscStatus?.state === "needs-reauth" && `Google Search Console needs to be reconnected${gscStatus.lastError ? ` — ${gscStatus.lastError}` : "."}`}
            {gscStatus?.state === "connected" && `Connected to ${gscStatus.propertyUrl}${gscStatus.connectedAt ? ` since ${new Date(gscStatus.connectedAt).toLocaleString()}` : ""}.`}
            {!gscStatus && "Loading Search Console status…"}
          </p>
          {gscMessage && <p className="mt-1 text-xs text-emerald-300/90">{gscMessage}</p>}

          {gscStatus?.state === "connected" &&
            (() => {
              const hasData = gscPerformance && (gscPerformance.current.totalClicks > 0 || gscPerformance.current.totalImpressions > 0);
              if (!gscPerformance) {
                return <p className="mt-3 text-xs text-zinc-400">Google Search Console is connected, but no Search Analytics data is available for the selected period.</p>;
              }
              if (!hasData) {
                return (
                  <p className="mt-3 text-xs text-zinc-400">
                    Google Search Console is connected, but no Search Analytics data is available for the selected period ({gscPerformance.current.range.startDate} – {gscPerformance.current.range.endDate}).
                  </p>
                );
              }
              return (
                <div className="mt-3">
                  <p className="text-[10px] uppercase tracking-wide text-emerald-400/80">
                    Real Search Console data — {gscPerformance.current.range.startDate} to {gscPerformance.current.range.endDate}
                  </p>
                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <OverviewCard label="Clicks" value={String(gscPerformance.current.totalClicks)} />
                    <OverviewCard label="Impressions" value={String(gscPerformance.current.totalImpressions)} />
                    <OverviewCard label="Avg CTR" value={`${(gscPerformance.current.averageCtr * 100).toFixed(1)}%`} />
                    <OverviewCard label="Avg Position" value={gscPerformance.current.averagePosition.toFixed(1)} />
                  </div>
                  {gscPerformance.current.topQueries.length > 0 && (
                    <div className="mt-3 rounded-lg border border-white/10 bg-black/30 p-3 text-xs">
                      <p className="text-zinc-500">Top queries (real GSC data)</p>
                      <ul className="mt-1 space-y-1">
                        {gscPerformance.current.topQueries.slice(0, 5).map((q, i) => (
                          <li key={i} className="text-zinc-300">
                            &quot;{q.keys[0]}&quot; — {q.clicks} clicks, {q.impressions} impressions, {(q.ctr * 100).toFixed(1)}% CTR, pos {q.position.toFixed(1)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })()}
        </div>

        {changeManagement && (
          <div className="mt-6">
            <h2 className="text-sm font-semibold text-zinc-300">Change Management</h2>
            <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <OverviewCard label="Approved" value={String(changeManagement.approvedActions)} />
              <OverviewCard label="Executing" value={String(changeManagement.executingActions)} />
              <OverviewCard label="Completed" value={String(changeManagement.completedActions)} />
              <OverviewCard label="Failed" value={String(changeManagement.failedActions)} />
              <OverviewCard label="Rollback Available" value={String(changeManagement.rollbackAvailable)} />
              <OverviewCard label="Rejected/Skipped" value={String(changeManagement.rejectedActions)} />
              <OverviewCard label="High Risk (open)" value={String(changeManagement.highRiskActions)} />
            </div>
          </div>
        )}

        <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="font-semibold">Action Queue</h2>
            <div className="flex gap-2 text-xs">
              {(["needs-decision", "approved", "completed", "all"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setActionsFilter(f)}
                  className={`rounded-full border px-3 py-1 ${actionsFilter === f ? "border-white bg-white text-black" : "border-white/20 hover:bg-white/10"}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 space-y-3 max-h-[60vh] overflow-y-auto">
            {filteredActions.length === 0 && <p className="text-sm text-zinc-500">No actions in this view.</p>}
            {filteredActions.map((a) => (
              <ActionCard key={a.id} action={a} busy={actionBusy === a.id} message={actionMessage[a.id]} onDecide={decideAction} onExecute={executeAction} onRollback={rollbackAction} />
            ))}
          </div>
        </div>

        <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="font-semibold">AI SEO Assistant</h2>
          <p className="mt-1 text-sm text-zinc-400">Ask about your SEO data. Answers are built from real crawl/Search Console/keyword evidence — never invented.</p>

          {overview && overview.quickActions.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {overview.quickActions.map((qa) => (
                <button key={qa} onClick={() => askQuestion(qa)} disabled={asking} className="rounded-full border border-white/20 px-3 py-1.5 text-xs hover:bg-white/10 disabled:opacity-40">
                  {qa}
                </button>
              ))}
            </div>
          )}

          <div className="mt-6 space-y-4 max-h-[50vh] overflow-y-auto">
            {history.length === 0 && <p className="text-sm text-zinc-500">No questions asked yet — try a quick action above, or type your own below.</p>}
            {history.map((entry, i) =>
              entry.role === "user" ? (
                <div key={i} className="rounded-xl bg-white/10 px-4 py-2 text-sm max-w-[85%]">
                  {entry.text}
                </div>
              ) : (
                <AnswerCard key={i} result={entry.result} onDecide={(id, status) => decideAction(id, status)} busyId={actionBusy} />
              )
            )}
            {asking && <p className="text-sm text-zinc-500">Thinking…</p>}
          </div>

          <div className="mt-6 flex gap-2">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && askQuestion(question)}
              placeholder="Ask a question about your SEO data..."
              className="flex-1 rounded-full border border-white/20 bg-transparent px-4 py-2 text-sm outline-none focus:border-white/40"
            />
            <button onClick={() => askQuestion(question)} disabled={asking || !question.trim()} className="rounded-full bg-white text-black px-5 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-40">
              Ask
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function OverviewCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs text-zinc-400">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

const RISK_COLOR: Record<string, string> = { low: "text-emerald-300", medium: "text-amber-300", high: "text-red-300" };

/** STEP 9 Task 4 — every field the task requires: Action, URL, Current
 * value, Proposed value, Reason, Evidence, Expected benefit, Risk level,
 * Date detected, Source module, Approval status. Approve/Reject/Skip are
 * always distinct, unambiguous buttons — never a single toggle. */
function ActionCard({
  action,
  busy,
  message,
  onDecide,
  onExecute,
  onRollback,
}: {
  action: ActionItem;
  busy: boolean;
  message?: string;
  onDecide: (id: string, status: "approved" | "rejected" | "skipped") => void;
  onExecute: (id: string) => void;
  onRollback: (id: string) => void;
}) {
  const needsDecision = action.status === "pending" || action.status === "review-required";
  const canExecute = action.status === "approved";
  const canRollback = action.status === "rollback-available";

  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-4 text-xs">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="font-mono text-zinc-300">{action.page ?? "(site-wide)"}</span>
        <span className={`font-semibold ${RISK_COLOR[action.riskLevel]}`}>{action.riskLevel.toUpperCase()} RISK</span>
      </div>
      <p className="mt-1 text-zinc-400">
        Action: <span className="text-zinc-200">{action.issueType}</span> · Source module: <span className="text-zinc-200">{action.source}</span> · Detected: <span className="text-zinc-200">{new Date(action.createdAt).toLocaleString()}</span> · Status:{" "}
        <span className="text-zinc-200">{action.status}</span>
      </p>
      <p className="mt-2 text-zinc-300">{action.problem}</p>
      {action.evidence && (
        <p className="mt-1 text-zinc-400">
          Current value: <span className="text-zinc-200">{action.evidence}</span>
        </p>
      )}
      {action.recommendedValue && (
        <p className="text-zinc-400">
          Proposed value: <span className="text-emerald-300/90">{action.recommendedValue}</span>
        </p>
      )}
      <p className="mt-1 text-zinc-400">Expected benefit: {action.expectedBenefit}</p>
      {message && <p className="mt-2 text-amber-300/90">{message}</p>}

      <div className="mt-3 flex flex-wrap gap-2">
        {needsDecision && (
          <>
            <button onClick={() => onDecide(action.id, "approved")} disabled={busy} className="rounded-full border border-emerald-400/40 text-emerald-300 px-3 py-1 hover:bg-emerald-400/10 disabled:opacity-40">
              Approve
            </button>
            <button onClick={() => onDecide(action.id, "rejected")} disabled={busy} className="rounded-full border border-red-400/40 text-red-300 px-3 py-1 hover:bg-red-400/10 disabled:opacity-40">
              Reject
            </button>
            <button onClick={() => onDecide(action.id, "skipped")} disabled={busy} className="rounded-full border border-white/20 text-zinc-300 px-3 py-1 hover:bg-white/10 disabled:opacity-40">
              Skip
            </button>
          </>
        )}
        {canExecute && (
          <button onClick={() => onExecute(action.id)} disabled={busy} className="rounded-full border border-sky-400/40 text-sky-300 px-3 py-1 hover:bg-sky-400/10 disabled:opacity-40">
            Execute
          </button>
        )}
        {canRollback && (
          <button onClick={() => onRollback(action.id)} disabled={busy} className="rounded-full border border-amber-400/40 text-amber-300 px-3 py-1 hover:bg-amber-400/10 disabled:opacity-40">
            Rollback
          </button>
        )}
      </div>
    </div>
  );
}

function AnswerCard({ result, onDecide, busyId }: { result: AssistantResult; onDecide: (id: string, status: "approved" | "rejected") => void; busyId: string | null }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm max-w-[95%]">
      <p className="text-zinc-100 leading-relaxed">{result.text}</p>
      <div className="mt-2 flex gap-2 text-[11px] text-zinc-500">
        <span>intent: {result.intent}</span>
        <span>·</span>
        <span>{result.gscUsed ? "uses real GSC data" : "on-page/crawl evidence only"}</span>
        {result.aiPolished && (
          <>
            <span>·</span>
            <span>phrased by {result.aiProvider}</span>
          </>
        )}
      </div>

      {result.evidence.length > 0 && (
        <div className="mt-3 space-y-2 border-t border-white/10 pt-3">
          {result.evidence.map((e, i) => (
            <div key={i} className="rounded-lg bg-black/40 p-3 text-xs">
              {e.url && <p className="font-mono text-zinc-300">{e.url}</p>}
              {e.issue && <p className="mt-1 text-zinc-400">Issue: {e.issue}</p>}
              {(e.currentValue || e.metric) && <p className="text-zinc-400">Metric: {e.currentValue ?? e.metric}</p>}
              {e.reason && <p className="mt-1 text-zinc-300">{e.reason}</p>}
              {e.recommendedAction && <p className="mt-1 text-emerald-300/90">Recommended: {e.recommendedAction}</p>}
              {e.actionId && (
                <div className="mt-2 flex gap-2">
                  <button onClick={() => onDecide(e.actionId!, "approved")} disabled={busyId === e.actionId} className="rounded-full border border-emerald-400/40 text-emerald-300 px-3 py-1 text-[11px] hover:bg-emerald-400/10 disabled:opacity-40">
                    Approve
                  </button>
                  <button onClick={() => onDecide(e.actionId!, "rejected")} disabled={busyId === e.actionId} className="rounded-full border border-red-400/40 text-red-300 px-3 py-1 text-[11px] hover:bg-red-400/10 disabled:opacity-40">
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

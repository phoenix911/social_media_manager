// Global channels page — where you ADD a new channel (OAuth or
// manual paste). Lives at /channels. Project-scoped pages can only
// LINK existing channels (see /p/:slug/channels).

import { useState } from "react";
import { Link } from "react-router";
import useSWR, { mutate } from "swr";
import type { Account, Project } from "@smm/shared";
import { api, ApiCallError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PLATFORMS_META, type PlatformMeta } from "@/lib/platforms";
import { ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { CopyChip } from "@/components/CopyChip";

const Channels = () => {
  const { data: aData } = useSWR<{ accounts: Account[] }>("/api/accounts");
  const [openCard, setOpenCard] = useState<string | null>(null);
  const channels = (aData?.accounts ?? []).filter((a) => !a.revokedAt);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <header>
        <h1 className="text-xl sm:text-2xl font-semibold">channels</h1>
        <p className="text-sm text-muted-foreground">
          your channels live at the user level. create one here, then link it into any project
          from <code className="text-xs">/p/&lt;slug&gt;/channels</code>.
        </p>
      </header>

      {channels.length > 0 && (
        <section>
          <h2 className="text-xs uppercase tracking-wide text-muted-foreground mb-2">your channels</h2>
          <ul className="space-y-2">
            {channels.map((a) => (
              <li key={a.id} className="rounded-lg border p-3 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <ChannelInfo account={a} />
                  <TokenState account={a} />
                </div>
                <TokenRefreshForm account={a} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-xs uppercase tracking-wide text-muted-foreground">add a new channel</h2>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {PLATFORMS_META.map((p) => (
            <li key={p.id}>
              <PlatformCard
                meta={p}
                open={openCard === p.id}
                onToggle={() => setOpenCard(openCard === p.id ? null : p.id)}
                onAdded={() => mutate("/api/accounts")}
              />
            </li>
          ))}
        </ul>
      </section>

      <div className="text-sm text-muted-foreground border-t pt-4">
        <Link to="/" className="hover:text-foreground">← back to home</Link>
      </div>
    </div>
  );
};

// Read-only badge showing whether this account has a real OAuth token
// or just the placeholder one. Drives the "missing: channel-token" gate
// elsewhere in the app.
const TokenState = ({ account }: { account: Account }) => {
  const placeholder = (account.meta as { placeholder?: boolean } | null)?.placeholder === true;
  if (placeholder) {
    return (
      <span className="inline-flex items-center rounded-full bg-red-500/10 text-red-700 dark:text-red-300 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide">
        token missing
      </span>
    );
  }
  const exp = account.expiresAt ? new Date(account.expiresAt) : null;
  const daysLeft = exp ? Math.floor((exp.getTime() - Date.now()) / 86_400_000) : null;
  const tone =
    daysLeft != null && daysLeft < 7
      ? "bg-amber-500/10 text-amber-700 dark:text-amber-300"
      : "bg-green-500/10 text-green-700 dark:text-green-300";
  const label = exp
    ? daysLeft != null && daysLeft < 0
      ? "token expired"
      : `token · ${daysLeft}d left`
    : "token set";
  return (
    <span className={`inline-flex items-center rounded-full ${tone} px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide`}>
      {label}
    </span>
  );
};

// Re-paste an OAuth long-lived token whenever it's about to expire.
// Calls POST /api/accounts/:id/inject-token (session-auth + owner check).
const TokenRefreshForm = ({ account }: { account: Account }) => {
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState("");
  const [days, setDays] = useState(59);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const submit = async () => {
    if (!token.trim()) {
      setMsg({ ok: false, text: "paste a token first" });
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const expiresAt = new Date(Date.now() + days * 86_400_000).toISOString();
      await api(`/api/accounts/${account.id}/inject-token`, {
        method: "POST",
        body: JSON.stringify({ accessToken: token.trim(), expiresAt }),
      });
      setMsg({ ok: true, text: `token saved · expires in ${days} days` });
      setToken("");
      mutate("/api/accounts");
    } catch (e) {
      setMsg({ ok: false, text: e instanceof ApiCallError ? e.message : "failed" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="text-xs">
      <button
        type="button"
        className="text-muted-foreground hover:text-foreground underline underline-offset-2"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "hide token form" : "update channel token"}
      </button>
      {open && (
        <div className="mt-2 space-y-2 rounded-md border p-2 bg-muted/30">
          <label className="block">
            <span className="block text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
              long-lived access token
            </span>
            <textarea
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="paste IGAA…"
              spellCheck={false}
              className="block w-full min-h-[80px] rounded-md border border-input bg-transparent px-2 py-1.5 text-xs font-mono"
            />
          </label>
          <label className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">expires in (days)</span>
            <input
              type="number"
              min={1}
              max={120}
              value={days}
              onChange={(e) => setDays(Math.max(1, Math.min(120, Number(e.target.value) || 59)))}
              className="h-7 w-16 rounded-md border border-input bg-transparent px-2 text-xs"
            />
          </label>
          <div className="flex items-center gap-2">
            <Button onClick={submit} disabled={busy} size="sm">
              {busy ? "saving…" : "save token"}
            </Button>
            {msg && (
              <span className={msg.ok ? "text-green-600" : "text-destructive"}>{msg.text}</span>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground">
            For Instagram, get the long-lived token from Meta dashboard →
            Instagram → API setup with Instagram login → Generate access token.
          </p>
        </div>
      )}
    </div>
  );
};

const ChannelInfo = ({ account }: { account: Account }) => {
  const meta = PLATFORMS_META.find((p) => p.id === account.platform);
  return (
    <div className="flex items-center gap-3 min-w-0">
      <span
        className="w-7 h-7 rounded grid place-items-center text-white text-xs font-semibold shrink-0"
        style={{ backgroundColor: meta?.color ?? "#666" }}
      >
        {meta?.name?.[0] ?? "?"}
      </span>
      <div className="min-w-0">
        <div className="font-medium truncate">{account.handle}</div>
        <div className="text-xs text-muted-foreground capitalize">{account.platform}</div>
      </div>
    </div>
  );
};

// ── platform card with setup steps + connect/manual flow ───────────
const PlatformCard = ({
  meta,
  open,
  onToggle,
  onAdded,
}: {
  meta: PlatformMeta;
  open: boolean;
  onToggle: () => void;
  onAdded: () => void;
}) => (
  <div className="rounded-lg border overflow-hidden">
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between gap-3 p-3 hover:bg-accent transition-colors text-left"
    >
      <div className="flex items-center gap-3 min-w-0">
        <span
          className="w-8 h-8 rounded grid place-items-center text-white text-sm font-semibold shrink-0"
          style={{ backgroundColor: meta.color }}
        >
          {meta.name[0]}
        </span>
        <div className="min-w-0">
          <div className="font-medium truncate">{meta.name}</div>
          <div className="text-xs text-muted-foreground truncate">{meta.description}</div>
        </div>
      </div>
      {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
    </button>
    {open && (
      <div className="border-t p-3 sm:p-4 space-y-4 bg-muted/20">
        <div>
          <h3 className="text-xs uppercase tracking-wide text-muted-foreground mb-2">setup</h3>
          <ol className="space-y-1.5 text-sm list-decimal list-inside">
            {meta.setup.map((step, i) => (
              <li key={i} className="leading-snug">
                <span>{step.text}</span>
                {step.link && (
                  <a
                    href={step.link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 ml-1 text-primary hover:underline"
                    title={step.link.url}
                  >
                    <ExternalLink size={12} />
                  </a>
                )}
                {step.copy && (
                  <div className="mt-1">
                    <CopyChip value={step.copy} />
                  </div>
                )}
              </li>
            ))}
          </ol>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={() => connectOauth(meta.id)} className="sm:flex-1">
            Connect via OAuth
          </Button>
          <ManualForm meta={meta} onSaved={onAdded} />
        </div>
      </div>
    )}
  </div>
);

const connectOauth = async (platform: string) => {
  try {
    const { authorize_url } = await api<{ authorize_url: string }>(`/api/oauth/${platform}/start`, {
      method: "POST",
      body: JSON.stringify({ returnTo: "/channels" }),
    });
    window.location.href = authorize_url;
  } catch (e) {
    alert(e instanceof ApiCallError ? e.message : "OAuth start failed");
  }
};

const ManualForm = ({
  meta,
  onSaved,
}: {
  meta: PlatformMeta;
  onSaved: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const [handle, setHandle] = useState("");
  const [externalId, setExternalId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [refreshToken, setRefreshToken] = useState("");
  const [scopes, setScopes] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    setErr(null);
    setBusy(true);
    try {
      await api("/api/accounts", {
        method: "POST",
        body: JSON.stringify({
          // No projectId — channels are project-independent. Link
          // to projects from /p/<slug>/channels.
          platform: meta.id,
          handle,
          externalId: externalId || handle,
          scopes,
          accessToken,
          refreshToken: refreshToken || null,
        }),
      });
      onSaved();
      setOpen(false);
      setHandle(""); setExternalId(""); setAccessToken(""); setRefreshToken(""); setScopes("");
    } catch (e) {
      setErr(e instanceof ApiCallError ? e.message : "save failed");
    } finally {
      setBusy(false);
    }
  };

  if (!open) return <Button variant="outline" onClick={() => setOpen(true)} className="sm:flex-1">Add manually</Button>;

  return (
    <div className="w-full rounded-md border p-3 space-y-2 bg-background">
      <p className="text-xs text-muted-foreground">
        Tokens encrypted at rest (AES-GCM). Use this when you already have credentials.
      </p>
      <Input placeholder="handle (e.g. @sangeet)" value={handle} onChange={(e) => setHandle(e.target.value)} />
      <Input placeholder="external id (defaults to handle)" value={externalId} onChange={(e) => setExternalId(e.target.value)} />
      <Input placeholder="access token" type="password" value={accessToken} onChange={(e) => setAccessToken(e.target.value)} />
      <Input placeholder="refresh token (optional)" type="password" value={refreshToken} onChange={(e) => setRefreshToken(e.target.value)} />
      <Input placeholder="scopes (optional)" value={scopes} onChange={(e) => setScopes(e.target.value)} />
      {err && <p className="text-sm text-destructive">{err}</p>}
      <div className="flex gap-2">
        <Button onClick={submit} disabled={!handle || !accessToken || busy} className="flex-1">save</Button>
        <Button variant="ghost" onClick={() => setOpen(false)}>cancel</Button>
      </div>
    </div>
  );
};

export default Channels;

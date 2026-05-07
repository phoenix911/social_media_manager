// API keys for programmatic / MCP access. The plaintext value is
// shown exactly once (right after creation) — copy and store it
// outside the app, no recovery if lost.

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CopyChip } from "@/components/CopyChip";
import { api, ApiCallError } from "@/lib/api";
import { Trash2 } from "lucide-react";

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
  lastUsedAt: string | null;
}

const ApiKeysCard = () => {
  const { data, isLoading } = useSWR<{ keys: ApiKey[] }>("/api/api-keys");
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<{ name: string; plaintext: string } | null>(null);

  const submit = async () => {
    setErr(null);
    setBusy(true);
    try {
      const r = await api<{ name: string; plaintext: string }>("/api/api-keys", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      setRevealed({ name: r.name, plaintext: r.plaintext });
      setName("");
      setCreating(false);
      mutate("/api/api-keys");
    } catch (e) {
      setErr(e instanceof ApiCallError ? e.message : "failed");
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (id: string) => {
    if (!confirm("revoke this key? in-flight requests using it will start failing immediately.")) return;
    await api(`/api/api-keys/${id}`, { method: "DELETE" });
    mutate("/api/api-keys");
  };

  const keys = data?.keys ?? [];

  return (
    <section>
      <div className="flex items-center justify-between mb-3 gap-3">
        <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">api keys</h2>
        {!creating && (
          <Button size="sm" onClick={() => setCreating(true)}>+ new key</Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground mb-3">
        Keys let an LLM (or any HTTP client) read + create + edit projects, tracks, and drafts
        on your behalf. They cannot delete anything or touch channels / media / OAuth. See{" "}
        <a href="/mcp" className="underline">/mcp</a> for the document to paste into your LLM.
      </p>

      {creating && (
        <div className="rounded-lg border p-3 sm:p-4 mb-3 space-y-2 bg-muted/30">
          <Input
            placeholder="key name (e.g. claude-desktop / personal-mcp)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          {err && <p className="text-sm text-destructive">{err}</p>}
          <div className="flex gap-2">
            <Button onClick={submit} disabled={!name || busy} className="flex-1 sm:flex-none">create</Button>
            <Button variant="ghost" onClick={() => { setCreating(false); setErr(null); }}>cancel</Button>
          </div>
        </div>
      )}

      {revealed && (
        <div className="rounded-lg border-2 border-amber-500/60 p-3 sm:p-4 mb-3 space-y-2 bg-amber-50/40 dark:bg-amber-950/20">
          <div className="text-sm font-medium">your new key — shown once</div>
          <div className="text-xs text-muted-foreground">
            Copy this now. It will not be displayed again. If lost, revoke and create a new one.
          </div>
          <CopyChip value={revealed.plaintext} />
          <Button variant="ghost" size="sm" onClick={() => setRevealed(null)}>I've copied it</Button>
        </div>
      )}

      {isLoading && <p className="text-sm text-muted-foreground">loading…</p>}

      {keys.length === 0 && !isLoading && !creating && (
        <p className="text-sm text-muted-foreground">
          no keys yet — click <strong>+ new key</strong> to create one.
        </p>
      )}

      {keys.length > 0 && (
        <ul className="grid grid-cols-1 gap-2">
          {keys.map((k) => (
            <li key={k.id} className="rounded-lg border p-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium truncate">{k.name}</div>
                <div className="text-xs text-muted-foreground font-mono">
                  {k.prefix}…  ·  created {k.createdAt.slice(0, 10)}
                  {k.lastUsedAt ? `  ·  last used ${k.lastUsedAt.slice(0, 10)}` : "  ·  never used"}
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => revoke(k.id)} title="revoke">
                <Trash2 size={14} />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default ApiKeysCard;

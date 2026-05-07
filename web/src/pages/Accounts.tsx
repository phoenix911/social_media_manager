// Per-project channels page — LINK-only mode. Add new channels at /channels.

import { useState } from "react";
import { Link, useParams } from "react-router";
import useSWR, { mutate } from "swr";
import type { Account, Project } from "@smm/shared";
import { api, ApiCallError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { PLATFORMS_META } from "@/lib/platforms";
import { Plus, Trash2 } from "lucide-react";

const AccountsPage = () => {
  const { slug } = useParams();
  const { data: pData } = useSWR<{ project: Project }>(slug ? `/api/projects/${slug}` : null);
  const project = pData?.project;
  const projectChannelsKey = project ? `/api/accounts?projectId=${project.id}` : null;
  const { data: thisProj } = useSWR<{ accounts: Account[] }>(projectChannelsKey);
  const { data: mine } = useSWR<{ accounts: Account[] }>("/api/accounts");

  const [linking, setLinking] = useState(false);

  if (!project) return <div className="p-6 text-muted-foreground">loading…</div>;

  const linkedHere = (thisProj?.accounts ?? []).filter((a) => !a.revokedAt);
  const linkedIds = new Set(linkedHere.map((a) => a.id));
  const linkable = (mine?.accounts ?? [])
    .filter((a) => !a.revokedAt)
    .filter((a) => !linkedIds.has(a.id));

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold">channels</h1>
          <p className="text-sm text-muted-foreground">
            channels linked to this project. add a new channel at{" "}
            <Link to="/channels" className="underline hover:text-foreground">/channels</Link>, then link it here.
          </p>
        </div>
        <Button size="sm" onClick={() => setLinking((l) => !l)}>
          <Plus size={14} className="mr-1" /> link channel
        </Button>
      </header>

      {linking && (
        <section className="rounded-lg border p-3 sm:p-4 bg-muted/30 space-y-2">
          <h2 className="text-xs uppercase tracking-wide text-muted-foreground">your channels — pick to link</h2>
          {linkable.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              all your channels are already linked here. add a new one at{" "}
              <Link to="/channels" className="underline hover:text-foreground">/channels</Link>.
            </p>
          ) : (
            <ul className="space-y-1">
              {linkable.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3">
                  <ChannelRow account={a} />
                  <Button
                    size="sm"
                    onClick={async () => {
                      try {
                        await api(`/api/accounts/${a.id}/projects/${project.id}`, { method: "POST" });
                        mutate(projectChannelsKey);
                      } catch (e) {
                        alert(e instanceof ApiCallError ? e.message : "failed");
                      }
                    }}
                  >
                    link
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section>
        <h2 className="text-xs uppercase tracking-wide text-muted-foreground mb-2">linked here</h2>
        {linkedHere.length === 0 ? (
          <p className="text-sm text-muted-foreground">no channels linked yet.</p>
        ) : (
          <ul className="space-y-2">
            {linkedHere.map((a) => (
              <li key={a.id} className="rounded-lg border p-3 flex items-center justify-between gap-3">
                <ChannelRow account={a} />
                <UnlinkOrRevoke
                  account={a}
                  projectId={project.id}
                  isHome={a.projectId === project.id}
                  onChange={() => mutate(projectChannelsKey)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

const ChannelRow = ({ account }: { account: Account }) => {
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

const UnlinkOrRevoke = ({
  account,
  projectId,
  isHome,
  onChange,
}: {
  account: Account;
  projectId: string;
  isHome: boolean;
  onChange: () => void;
}) => {
  const action = isHome
    ? async () => {
        if (!confirm(`Disconnect ${account.handle}? This revokes the channel everywhere.`)) return;
        await api(`/api/accounts/${account.id}`, { method: "DELETE" });
        onChange();
      }
    : async () => {
        if (!confirm(`Unlink ${account.handle} from this project? It stays connected on its home project.`)) return;
        await api(`/api/accounts/${account.id}/projects/${projectId}`, { method: "DELETE" });
        onChange();
      };
  return (
    <button
      onClick={action}
      className="text-xs text-muted-foreground hover:text-destructive p-1 rounded-md hover:bg-accent"
      title={isHome ? "disconnect everywhere" : "unlink from this project"}
      aria-label={isHome ? "disconnect" : "unlink"}
    >
      <Trash2 size={14} />
    </button>
  );
};

export default AccountsPage;

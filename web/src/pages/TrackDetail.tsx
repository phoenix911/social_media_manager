import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router";
import useSWR, { mutate } from "swr";
import type { Account, Draft, Project, Track } from "@smm/shared";
import { api, ApiCallError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatOffset, localInputToUtcIso, utcIsoToLocalInput, userTz } from "@/lib/time";
import { DateTime } from "@/components/DateTime";

const STATUS_EMOJI: Record<string, string> = {
  draft: "✏️",
  ready: "📋",
  scheduled: "🗓",
  publishing: "⏳",
  published: "✅",
  failed: "🚨",
  archived: "🗄",
};

const TrackDetail = () => {
  const { slug, trackId } = useParams();
  const navigate = useNavigate();

  const { data: pData } = useSWR<{ project: Project }>(slug ? `/api/projects/${slug}` : null);
  const project = pData?.project;
  const { data: tData } = useSWR<{ track: Track }>(trackId ? `/api/tracks/${trackId}` : null);
  const track = tData?.track;
  const { data: aData } = useSWR<{ accounts: Account[] }>(
    project ? `/api/accounts?projectId=${project.id}` : null,
  );
  const { data: dData } = useSWR<{ drafts: Draft[] }>(
    project && trackId ? `/api/drafts?projectId=${project.id}&trackId=${trackId}` : null,
  );

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editStart, setEditStart] = useState("");
  const [editAccountId, setEditAccountId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const beginEdit = () => {
    if (!track) return;
    setEditName(track.name);
    setEditDesc(track.description ?? "");
    setEditStart(utcIsoToLocalInput(track.startAt));
    setEditAccountId(track.accountId);
    setEditing(true);
    setErr(null);
  };

  const save = async () => {
    if (!track) return;
    setErr(null);
    try {
      await api(`/api/tracks/${track.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: editName,
          description: editDesc || null,
          accountId: editAccountId,
          startAt: editStart ? localInputToUtcIso(editStart) : null,
          tz: userTz(),
        }),
      });
      mutate(`/api/tracks/${track.id}`);
      mutate(`/api/tracks?projectId=${project!.id}`);
      mutate(`/api/drafts?projectId=${project!.id}&trackId=${track.id}`);
      setEditing(false);
    } catch (e) {
      setErr(e instanceof ApiCallError ? e.message : "save failed");
    }
  };

  const newDraft = async () => {
    if (!project || !track) return;
    try {
      const { draft } = await api<{ draft: Draft }>("/api/drafts", {
        method: "POST",
        body: JSON.stringify({
          projectId: project.id,
          trackId: track.id,
          title: null,
          body: "",
        }),
      });
      navigate(`/p/${slug}/draft/${draft.id}`);
    } catch (e) {
      alert(e instanceof ApiCallError ? e.message : "failed");
    }
  };

  if (!project || !track) return <div className="p-6 text-muted-foreground">loading…</div>;

  const drafts = (dData?.drafts ?? []).slice().sort((a, b) => {
    // Sequence first (nulls last), then offset.
    const sa = a.sequenceInTrack ?? Number.POSITIVE_INFINITY;
    const sb = b.sequenceInTrack ?? Number.POSITIVE_INFINITY;
    if (sa !== sb) return sa - sb;
    const oa = a.trackOffsetMinutes ?? Number.POSITIVE_INFINITY;
    const ob = b.trackOffsetMinutes ?? Number.POSITIVE_INFINITY;
    return oa - ob;
  });
  const account = (aData?.accounts ?? []).find((a) => a.id === track.accountId);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
      <Link to={`/p/${slug}`} className="text-xs text-muted-foreground hover:text-foreground inline-block mb-2">
        ← {project.name}
      </Link>

      {!editing ? (
        <header className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-semibold leading-tight">{track.name}</h1>
            {track.description && <p className="text-sm text-muted-foreground mt-1">{track.description}</p>}
            <div className="text-xs text-muted-foreground mt-2 space-y-0.5">
              <div>
                <span className="opacity-60">channel:</span>{" "}
                {account ? `${account.platform} · ${account.handle}` : "not set"}
              </div>
              <div>
                <span className="opacity-60">starts:</span> <DateTime value={track.startAt} tz={track.tz} />
              </div>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={beginEdit}>edit</Button>
        </header>
      ) : (
        <section className="rounded-lg border p-3 sm:p-4 mb-4 space-y-3 bg-muted/30">
          <Input placeholder="name" value={editName} onChange={(e) => setEditName(e.target.value)} />
          <Textarea placeholder="description" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className="min-h-[60px]" />
          <div>
            <label className="text-xs text-muted-foreground block mb-1">channel (account)</label>
            <select
              value={editAccountId ?? ""}
              onChange={(e) => setEditAccountId(e.target.value || null)}
              className="block w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
            >
              <option value="">— none —</option>
              {(aData?.accounts ?? []).filter((a) => !a.revokedAt).map((a) => (
                <option key={a.id} value={a.id}>
                  {a.platform} · {a.handle}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">
              start at (your tz: <code>{userTz()}</code>; stored as UTC)
            </label>
            <input
              type="datetime-local"
              value={editStart}
              onChange={(e) => setEditStart(e.target.value)}
              className="block w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Moving this date shifts every post in the track.
            </p>
          </div>
          {err && <p className="text-sm text-destructive">{err}</p>}
          <div className="flex gap-2">
            <Button onClick={save} className="flex-1 sm:flex-none">save</Button>
            <Button variant="ghost" onClick={() => setEditing(false)}>cancel</Button>
          </div>
        </section>
      )}

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">posts</h2>
        <Button size="sm" onClick={newDraft}>+ new post</Button>
      </div>

      {drafts.length === 0 && (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground text-sm">
          no posts yet.
        </div>
      )}
      {drafts.length > 0 && (
        <ul className="space-y-2">
          {drafts.map((d) => (
            <li key={d.id}>
              <Link
                to={`/p/${slug}/draft/${d.id}`}
                className="block rounded-lg border p-3 hover:bg-accent transition-colors"
              >
                <div className="flex items-start gap-3">
                  <span className="text-lg leading-none mt-0.5">{STATUS_EMOJI[d.status] ?? "•"}</span>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{d.title || "(untitled)"}</div>
                    <div className="text-xs text-muted-foreground truncate mt-0.5">
                      {d.body.slice(0, 100) || <span className="opacity-60">(no body)</span>}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                      {d.sequenceInTrack != null && <span>#{d.sequenceInTrack}</span>}
                      <span>{formatOffset(d.trackOffsetMinutes)}</span>
                      {d.scheduledFor && <span>→ <DateTime value={d.scheduledFor} tz={track.tz} short /></span>}
                      <span className="uppercase tracking-wide opacity-60">{d.status}</span>
                    </div>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TrackDetail;

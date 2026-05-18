import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router";
import useSWR, { mutate } from "swr";
import type { Account, Draft, DraftSummary, Project, Track } from "@smm/shared";
import { api, ApiCallError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { localInputToUtcIso, utcIsoToLocalInput, userTz } from "@/lib/time";
import { DateTime } from "@/components/DateTime";
import { PageNumber } from "@/components/PageNumber";
import { PullToRefresh } from "@/components/PullToRefresh";
import {
  CircleLegend,
  MediaSpecHint,
  MissingChips,
  PostKindBadge,
  StatusCircle,
  mediaSpecFor,
  missingFor,
  postKindOf,
  usesCircleUi,
} from "@/lib/draftDisplay";

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
  const { data: dData } = useSWR<{ drafts: DraftSummary[] }>(
    project && trackId ? `/api/drafts?projectId=${project.id}&trackId=${trackId}` : null,
  );

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editStart, setEditStart] = useState("");
  const [editAccountId, setEditAccountId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [draftTab, setDraftTab] = useState<"all" | "noToday" | "future" | "past">("all");

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

  const nowDate = new Date();
  const todayStart = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate()).getTime();
  const todayEnd = todayStart + 24 * 60 * 60 * 1000;
  const groupOfDraft = (scheduledFor: string | null): "noToday" | "future" | "past" => {
    if (!scheduledFor) return "noToday";
    const t = new Date(scheduledFor).getTime();
    if (t >= todayStart && t < todayEnd) return "noToday";
    return t < todayStart ? "past" : "future";
  };
  const allDrafts = (dData?.drafts ?? []).slice().sort((a, b) => {
    const aSched = a.scheduledFor ? new Date(a.scheduledFor).getTime() : null;
    const bSched = b.scheduledFor ? new Date(b.scheduledFor).getTime() : null;
    const order = { noToday: 0, past: 1, future: 2 } as const;
    const ga = order[groupOfDraft(a.scheduledFor)];
    const gb = order[groupOfDraft(b.scheduledFor)];
    if (ga !== gb) return ga - gb;
    if (ga === order.past && aSched !== null && bSched !== null) return bSched - aSched;
    if (ga === order.future && aSched !== null && bSched !== null) return aSched - bSched;
    const sa = a.sequenceInTrack ?? Number.POSITIVE_INFINITY;
    const sb = b.sequenceInTrack ?? Number.POSITIVE_INFINITY;
    if (sa !== sb) return sa - sb;
    const oa = a.trackOffsetMinutes ?? Number.POSITIVE_INFINITY;
    const ob = b.trackOffsetMinutes ?? Number.POSITIVE_INFINITY;
    return oa - ob;
  });
  const drafts =
    draftTab === "all" ? allDrafts : allDrafts.filter((d) => groupOfDraft(d.scheduledFor) === draftTab);
  const account = (aData?.accounts ?? []).find((a) => a.id === track.accountId);

  // Compute counts for the masthead meta line.
  const draftCount = allDrafts.length;
  const publishedCount = allDrafts.filter((d) => d.status === "published").length;
  const useCircles = usesCircleUi(account ?? null);

  return (
    <div className="max-w-[1040px] mx-auto px-4 sm:px-8 py-10 sm:py-16 space-y-12 sm:space-y-16">
      <PullToRefresh
        onRefresh={async () => {
          await Promise.all([
            mutate(`/api/tracks/${trackId}`),
            mutate(`/api/drafts?projectId=${project.id}&trackId=${trackId}`),
            mutate(`/api/accounts?projectId=${project.id}`),
          ]);
        }}
      />
      {/* Masthead */}
      <header>
        <Link
          to={`/p/${slug}`}
          className="text-small-caps text-muted-foreground hover:text-foreground transition-colors"
        >
          ← {project.name}
        </Link>

        {!editing ? (
          <>
            <div className="flex items-start justify-between gap-4 mt-4">
              <h1 className="text-display-lg leading-none flex-1 min-w-0 break-words">{track.name}</h1>
              <Button size="sm" variant="outline" onClick={beginEdit} className="shrink-0 mt-2">
                Edit
              </Button>
            </div>
            {track.description && (
              <p className="text-body-lg italic text-muted-foreground mt-4 max-w-[680px]">
                {track.description}
              </p>
            )}
            <div className="text-small-caps text-muted-foreground mt-5 flex flex-wrap gap-x-5 gap-y-1 tabular">
              <span>{draftCount.toString().padStart(2, "0")} posts</span>
              {publishedCount > 0 && <span>{publishedCount.toString().padStart(2, "0")} published</span>}
              {track.startAt && (
                <span>
                  Starts <DateTime value={track.startAt} tz={track.tz} short />
                </span>
              )}
              <span>{account ? `${account.platform} · ${account.handle}` : "no channel"}</span>
            </div>
          </>
        ) : (
          <section className="mt-6 rounded-md border border-border p-5 space-y-3 bg-muted/40">
            <div className="text-small-caps text-muted-foreground">Edit track</div>
            <Input placeholder="name" value={editName} onChange={(e) => setEditName(e.target.value)} />
            <Textarea
              placeholder="description"
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              className="min-h-[60px]"
            />
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-small-caps text-muted-foreground block mb-2">Channel</label>
                <select
                  value={editAccountId ?? ""}
                  onChange={(e) => setEditAccountId(e.target.value || null)}
                  className="block w-full h-9 rounded-md border border-border bg-transparent px-3 text-sm"
                >
                  <option value="">— none —</option>
                  {(aData?.accounts ?? [])
                    .filter((a) => !a.revokedAt)
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.platform} · {a.handle}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="text-small-caps text-muted-foreground block mb-2">
                  Start at <span className="opacity-50 normal-case tracking-normal">({userTz()})</span>
                </label>
                <input
                  type="datetime-local"
                  value={editStart}
                  onChange={(e) => setEditStart(e.target.value)}
                  className="block w-full h-9 rounded-md border border-border bg-transparent px-3 text-sm"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground italic">
              Moving the start date shifts every post in this track.
            </p>
            {err && <p className="text-sm text-destructive">{err}</p>}
            <div className="flex gap-2 pt-1">
              <Button onClick={save}>Save</Button>
              <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
            </div>
          </section>
        )}
      </header>

      {/* Drafts */}
      <section>
        <div className="flex items-center justify-between gap-4 mb-5">
          <div className="divider-cap flex-1">
            <span>Drafts</span>
          </div>
          <Button size="sm" variant="outline" onClick={newDraft} className="shrink-0">
            + New post
          </Button>
        </div>

        {useCircles && (
          <div className="mb-5">
            <CircleLegend />
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-6 mb-6 text-small-caps overflow-x-auto">
          {([
            ["all", "All", allDrafts.length],
            ["noToday", "Unscheduled / today", allDrafts.filter((d) => groupOfDraft(d.scheduledFor) === "noToday").length],
            ["future", "Future", allDrafts.filter((d) => groupOfDraft(d.scheduledFor) === "future").length],
            ["past", "Past", allDrafts.filter((d) => groupOfDraft(d.scheduledFor) === "past").length],
          ] as const).map(([key, label, count]) => (
            <button
              key={key}
              onClick={() => setDraftTab(key)}
              className={`relative pb-1 shrink-0 transition-colors ${
                draftTab === key ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              } ${draftTab === key ? "after:absolute after:left-0 after:right-0 after:bottom-0 after:h-[2px] after:bg-primary" : ""}`}
            >
              {label} <span className="opacity-50 tabular">({count})</span>
            </button>
          ))}
        </div>

        {drafts.length === 0 && (
          <div className="py-16 text-center text-muted-foreground">
            <p className="text-display-sm mb-3">No drafts yet.</p>
            <p className="text-small-caps">Click + New post to begin.</p>
          </div>
        )}

        {drafts.length > 0 && (
          <ul className="divide-y divide-border border-y border-border">
            {drafts.map((d) => {
              const missing = missingFor(d, !!track.accountId, account ?? null);
              const k = postKindOf(d.platformOptions);
              const spec = mediaSpecFor(account?.platform ?? null, k);
              return (
                <li key={d.id}>
                  <Link
                    to={`/p/${slug}/draft/${d.id}`}
                    className="grid grid-cols-[3.5rem_1fr] sm:grid-cols-[4.5rem_1fr_auto] gap-4 sm:gap-6 py-6 row-link"
                  >
                    {/* Left rail — page number */}
                    <div className="flex items-start pt-1">
                      <PageNumber n={d.sequenceInTrack ?? "—"} />
                    </div>

                    {/* Center column — title, kind badge, body excerpt, missing chips */}
                    <div className="min-w-0 space-y-2 sm:col-span-1">
                      <div className="flex items-start gap-2">
                        {useCircles ? (
                          <span className="mt-2 shrink-0">
                            <StatusCircle status={d.status} publishable={missing.length === 0} />
                          </span>
                        ) : (
                          <span className="text-lg leading-none mt-0.5 shrink-0">
                            {STATUS_EMOJI[d.status] ?? "•"}
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="text-title leading-tight line-clamp-2 min-w-0">
                              {d.title || "(untitled)"}
                            </div>
                            {k && <PostKindBadge kind={k} title={spec?.full} />}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1 line-clamp-1">
                            {d.body.slice(0, 140) || <span className="italic opacity-60">(no body)</span>}
                          </div>
                        </div>
                      </div>
                      {useCircles && missing.length > 0 && (
                        <div className="space-y-1.5 pl-5">
                          <MissingChips items={missing} />
                          {missing.includes("media") && (
                            <MediaSpecHint
                              platform={account?.platform ?? null}
                              postKind={k}
                            />
                          )}
                        </div>
                      )}
                    </div>

                    {/* Right rail — date + status (desktop only). PostKindBadge
                        moved inline next to the title so mobile sees it too. */}
                    <div className="hidden sm:flex flex-col items-end text-small-caps text-muted-foreground gap-1 shrink-0 tabular">
                      {d.scheduledFor && (
                        <span><DateTime value={d.scheduledFor} tz={track.tz} short /></span>
                      )}
                      <span className="opacity-60">{d.status}</span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
};

export default TrackDetail;

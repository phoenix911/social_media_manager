import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import useSWR, { mutate } from "swr";
import type { Account, Draft, DraftSummary, Project, Track } from "@smm/shared";
import { api, ApiCallError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Preview } from "@/components/Preview";
import { MediaUploader } from "@/components/MediaUploader";
import { formatOffset, userTz } from "@/lib/time";
import { DateTime } from "@/components/DateTime";
import { useToast } from "@/components/Toast";
import { PullToRefresh } from "@/components/PullToRefresh";
import {
  MediaSpecHint,
  MissingChips,
  PostKindBadge,
  StatusCircle,
  mediaSpecFor,
  missingFor,
  postKindOf,
  usesCircleUi,
} from "@/lib/draftDisplay";

interface Props {
  mode: "new" | "edit";
}

const DraftEditor = ({ mode }: Props) => {
  const { slug, id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const { data: pData } = useSWR<{ project: Project }>(slug ? `/api/projects/${slug}` : null);
  const project = pData?.project;
  const { data: aData } = useSWR<{ accounts: Account[] }>(
    project ? `/api/accounts?projectId=${project.id}` : null,
  );
  const { data: tData } = useSWR<{ tracks: Track[] }>(
    project ? `/api/tracks?projectId=${project.id}` : null,
  );
  const draftKey = mode === "edit" && id ? `/api/drafts/${id}` : null;
  const { data: dData } = useSWR<{ draft: DraftSummary }>(draftKey);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [accountId, setAccountId] = useState<string | null>(null);
  const [trackId, setTrackId] = useState<string | null>(null);
  const [offsetMinutes, setOffsetMinutes] = useState<number | null>(null);
  const [subreddit, setSubreddit] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [err, setErr] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (mode === "edit" && dData?.draft) {
      setTitle(dData.draft.title ?? "");
      setBody(dData.draft.body);
      setAccountId(dData.draft.accountId);
      setTrackId(dData.draft.trackId);
      setOffsetMinutes(dData.draft.trackOffsetMinutes);
      const opts = dData.draft.platformOptions as { subreddit?: string } | null;
      if (opts?.subreddit) setSubreddit(opts.subreddit);
    }
  }, [mode, dData]);

  const account = (aData?.accounts ?? []).find((a) => a.id === accountId);
  const track = (tData?.tracks ?? []).find((t) => t.id === trackId);
  const inferredPlatform = inferPlatformFromOptions(dData?.draft.platformOptions ?? null);
  const platform = account?.platform ?? inferredPlatform;

  const save = async () => {
    if (!project) return;
    setStatus("saving");
    setErr(null);
    const platformOptions = buildPlatformOptions(platform, { subreddit });
    try {
      if (mode === "new") {
        const targetTrack = trackId || (tData?.tracks ?? []).find((t) => t.name === "Adhoc")?.id;
        if (!targetTrack) {
          setStatus("error");
          setErr("no track available — create one on the project page");
          return;
        }
        const { draft } = await api<{ draft: Draft }>("/api/drafts", {
          method: "POST",
          body: JSON.stringify({
            projectId: project.id,
            trackId: targetTrack,
            accountId,
            title: title || null,
            body,
            platformOptions,
            trackOffsetMinutes: offsetMinutes,
          }),
        });
        mutate(`/api/drafts?projectId=${project.id}`);
        navigate(`/p/${slug}/draft/${draft.id}`, { replace: true });
      } else if (id) {
        await api(`/api/drafts/${id}`, {
          method: "PATCH",
          body: JSON.stringify({
            trackId,
            accountId,
            title: title || null,
            body,
            platformOptions,
            trackOffsetMinutes: offsetMinutes,
          }),
        });
        mutate(`/api/drafts/${id}`);
        mutate(`/api/drafts?projectId=${project.id}`);
      }
      setStatus("saved");
    } catch (e) {
      setStatus("error");
      setErr(e instanceof ApiCallError ? e.message : "save failed");
    }
  };

  const performPublish = async () => {
    if (!id || !dData?.draft || !track) return;
    setConfirmOpen(false);
    setPublishing(true);
    toast.show("Publishing…", { durationMs: 4000 });
    try {
      await api(`/api/schedule/${id}/publish-now`, { method: "POST" });
      // Status flips to 'publishing' immediately; the queue consumer will move it
      // to 'published' (or 'failed'). Refresh on a timer so the UI catches up.
      mutate(`/api/drafts/${id}`);
      setTimeout(async () => {
        const r = await mutate(`/api/drafts/${id}`);
        const s = (r as { draft?: DraftSummary } | undefined)?.draft?.status;
        if (s === "published") {
          const handle = account?.handle?.replace(/^@/, "");
          toast.show("Published to Instagram", {
            href: handle ? `https://www.instagram.com/${handle}/` : undefined,
            durationMs: 9000,
          });
        }
      }, 5000);
      setTimeout(() => mutate(`/api/drafts/${id}`), 15000);
    } catch (e) {
      toast.show(
        `Publish failed — ${e instanceof ApiCallError ? e.message : (e as Error).message}`,
        { tone: "warning", durationMs: 8000 },
      );
    } finally {
      setPublishing(false);
    }
  };

  // Keyboard shortcuts. ⌘/Ctrl+S saves; ⌘/Ctrl+Shift+Enter publishes when ready.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void save();
      } else if (meta && e.shiftKey && e.key === "Enter") {
        e.preventDefault();
        setConfirmOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, body, accountId, trackId, offsetMinutes, subreddit]);

  const missing =
    dData?.draft && usesCircleUi(account ?? null)
      ? missingFor(dData.draft, !!track?.accountId, account ?? null)
      : [];
  const canPublish =
    mode === "edit" &&
    !!dData?.draft &&
    account?.platform === "instagram" &&
    dData!.draft.status !== "publishing" &&
    dData!.draft.status !== "published" &&
    missing.length === 0 &&
    !publishing;
  const publishLabel =
    publishing
      ? "Publishing…"
      : dData?.draft.status === "publishing"
        ? "Publishing…"
        : dData?.draft.status === "published"
          ? "Published ✓"
          : "Publish to Instagram";
  const publishTitle =
    missing.length > 0 ? `Cannot publish — missing: ${missing.join(", ")}` : "⌘⇧↵";

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-8 py-8 sm:py-12">
      <PullToRefresh
        enabled={!confirmOpen}
        onRefresh={async () => {
          if (id) await mutate(`/api/drafts/${id}`);
          if (id) await mutate(`/api/media/draft/${id}`);
          if (project) {
            await mutate(`/api/accounts?projectId=${project.id}`);
            await mutate(`/api/tracks?projectId=${project.id}`);
          }
        }}
      />
      {/* breadcrumb */}
      <div className="flex items-center gap-2 text-small-caps text-muted-foreground mb-6">
        {slug && (
          <Link to={`/p/${slug}`} className="hover:text-foreground transition-colors">
            {project?.name ?? "project"}
          </Link>
        )}
        {track && (
          <>
            <span className="opacity-40">/</span>
            <Link to={`/p/${slug}/t/${track.id}`} className="hover:text-foreground transition-colors truncate">
              {track.name}
            </Link>
          </>
        )}
      </div>

      {/* Header */}
      <header className="mb-8 sm:mb-12">
        <div className="flex items-start justify-between gap-6 mb-3 flex-wrap">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              {dData?.draft && usesCircleUi(account ?? null) && (
                <StatusCircle status={dData.draft.status} publishable={missing.length === 0} />
              )}
              {dData?.draft && (() => {
                const k = postKindOf(dData.draft.platformOptions);
                const spec = mediaSpecFor(platform, k);
                return k ? <PostKindBadge kind={k} title={spec?.full} /> : null;
              })()}
              {dData?.draft.status && (
                <span className="text-small-caps text-muted-foreground">
                  {dData.draft.status}
                </span>
              )}
            </div>
            <h1 className="text-display-md leading-[1.1] break-words">
              {mode === "new" ? "New post" : title || dData?.draft.title || "(untitled)"}
            </h1>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <SaveState status={status} err={err} />
            <Button onClick={save} disabled={!project || status === "saving"} variant="outline" size="sm" title="⌘S">
              Save
            </Button>
            {mode === "edit" && account?.platform === "instagram" && (
              <Button
                onClick={() => setConfirmOpen(true)}
                disabled={!canPublish}
                title={publishTitle}
                size="sm"
              >
                {publishLabel}
              </Button>
            )}
          </div>
        </div>

        {dData?.draft && usesCircleUi(account ?? null) && (
          <div className="space-y-2">
            <MissingChips items={missing} />
            <MediaSpecHint platform={platform} postKind={postKindOf(dData.draft.platformOptions)} />
          </div>
        )}
      </header>

      {/* Editor + sticky rail */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10 lg:gap-14">
        {/* Editor column */}
        <section className="space-y-6 min-w-0">
          {/* Title field — inline edit, serif */}
          <div>
            <label className="text-small-caps text-muted-foreground block mb-2">Title</label>
            <Input
              placeholder="title (optional for some platforms)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border-0 border-b border-border rounded-none px-0 text-title font-serif h-auto py-2 focus-visible:border-foreground"
            />
          </div>

          {/* Body */}
          <div>
            <label className="text-small-caps text-muted-foreground block mb-2">Caption</label>
            <Textarea
              placeholder="post body (markdown)"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="min-h-[320px] sm:min-h-[480px] editorial-body border-0 border-l-2 border-border rounded-none pl-5 pr-0 py-2 focus-visible:border-foreground bg-transparent"
            />
            <div className="text-small-caps text-muted-foreground mt-2 tabular">
              {body.length} chars
            </div>
          </div>

          {/* Reddit subreddit field */}
          {platform === "reddit" && (
            <div>
              <label className="text-small-caps text-muted-foreground block mb-2">Subreddit</label>
              <Input placeholder="sideproject" value={subreddit} onChange={(e) => setSubreddit(e.target.value)} />
            </div>
          )}

          {/* Media uploader */}
          {mode === "edit" && id && project && (
            <div>
              <div className="divider-cap mb-4">
                <span>Media</span>
              </div>
              <MediaUploader
                draftId={id}
                projectId={project.id}
                platform={platform}
                postKind={postKindOf(dData?.draft.platformOptions ?? null)}
              />
            </div>
          )}
          {mode === "new" && (
            <p className="text-sm text-muted-foreground italic">
              Save the draft first, then attach images / videos.
            </p>
          )}

          {/* Keyboard hint */}
          <div className="text-small-caps text-muted-foreground pt-4 hidden sm:block">
            <span className="opacity-60">⌘S</span> save · <span className="opacity-60">⌘⇧↵</span> publish
          </div>
        </section>

        {/* Sticky right rail */}
        <aside className="space-y-8 lg:sticky lg:top-20 lg:self-start">
          {/* Track + channel selectors */}
          <div className="space-y-4">
            <div className="divider-cap"><span>Routing</span></div>
            <div>
              <label className="text-small-caps text-muted-foreground block mb-2">Track</label>
              <select
                value={trackId ?? ""}
                onChange={(e) => setTrackId(e.target.value || null)}
                className="block w-full h-9 rounded-md border border-border bg-transparent px-3 text-sm"
              >
                <option value="">— pick track —</option>
                {(tData?.tracks ?? []).filter((t) => !t.archivedAt).map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-small-caps text-muted-foreground block mb-2">Channel</label>
              <select
                value={accountId ?? ""}
                onChange={(e) => setAccountId(e.target.value || null)}
                className="block w-full h-9 rounded-md border border-border bg-transparent px-3 text-sm"
              >
                <option value="">— pick channel —</option>
                {(aData?.accounts ?? []).filter((a) => !a.revokedAt).map((a) => (
                  <option key={a.id} value={a.id}>{a.platform} · {a.handle}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Scheduling */}
          <div className="space-y-3">
            <div className="divider-cap"><span>Schedule</span></div>
            {track?.startAt ? (
              <div className="text-sm text-muted-foreground">
                Track starts <DateTime value={track.startAt} tz={track.tz} short />
                <span className="text-small-caps block mt-0.5 opacity-60">your tz: {userTz()}</span>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground italic">
                This track has no start date yet — set one on the track page so offsets resolve.
              </div>
            )}
            <OffsetInput value={offsetMinutes} onChange={setOffsetMinutes} />
            {dData?.draft?.scheduledFor && (
              <div className="text-sm text-muted-foreground">
                Resolves to <DateTime value={dData.draft.scheduledFor} tz={dData.draft.scheduledTz ?? track?.tz} short />
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="space-y-3">
            <div className="divider-cap">
              <span>Preview {platform ? `· ${platform}` : ""}</span>
            </div>
            <div className="rounded-md border border-border p-4 bg-muted/40 min-h-[200px] text-sm">
              <Preview platform={platform} title={title} body={body} subreddit={subreddit} />
            </div>
          </div>
        </aside>
      </div>

      {/* Publish confirm modal */}
      {confirmOpen && dData?.draft && account && (
        <ConfirmPublish
          title={dData.draft.title || "(untitled)"}
          handle={account.handle}
          onConfirm={performPublish}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
    </div>
  );
};

const SaveState = ({
  status,
  err,
}: {
  status: "idle" | "saving" | "saved" | "error";
  err: string | null;
}) => {
  if (status === "saving") return <span className="text-small-caps text-muted-foreground">saving…</span>;
  if (status === "saved") return <span className="text-small-caps text-[#6B8E63]">saved</span>;
  if (status === "error") return <span className="text-small-caps text-destructive truncate max-w-[140px]">{err}</span>;
  return null;
};

const ConfirmPublish = ({
  title,
  handle,
  onConfirm,
  onCancel,
}: {
  title: string;
  handle: string;
  onConfirm: () => void;
  onCancel: () => void;
}) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
      if (e.key === "Enter") onConfirm();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel, onConfirm]);
  return (
    <div
      className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        className="bg-background border border-border rounded-md max-w-[440px] w-full p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-small-caps text-muted-foreground">Publish to Instagram</div>
        <h3 className="text-display-sm leading-tight">
          “{title}”
        </h3>
        <p className="text-sm text-muted-foreground">
          This will post immediately to <span className="text-foreground">{handle}</span>. The draft can't be unpublished from here.
        </p>
        <div className="flex gap-2 justify-end pt-2">
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button onClick={onConfirm}>Publish now</Button>
        </div>
      </div>
    </div>
  );
};

const OffsetInput = ({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
}) => {
  // Decompose minutes → days/hours/minutes for friendlier editing.
  const sign = value == null ? 1 : value < 0 ? -1 : 1;
  const abs = Math.abs(value ?? 0);
  const [days, setDays] = useState(Math.floor(abs / (60 * 24)));
  const [hours, setHours] = useState(Math.floor((abs % (60 * 24)) / 60));
  const [mins, setMins] = useState(abs % 60);
  const [signState, setSign] = useState<-1 | 1>(sign as -1 | 1);

  useEffect(() => {
    const total = (days * 24 * 60 + hours * 60 + mins) * signState;
    onChange(value == null && days === 0 && hours === 0 && mins === 0 ? null : total);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days, hours, mins, signState]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm">
        <select
          value={signState}
          onChange={(e) => setSign(Number(e.target.value) as -1 | 1)}
          className="h-9 rounded-md border border-border bg-transparent px-2 text-sm"
        >
          <option value={1}>T+</option>
          <option value={-1}>T−</option>
        </select>
        <input type="number" min={0} value={days}
          onChange={(e) => setDays(Math.max(0, Number(e.target.value) || 0))}
          className="h-9 w-14 rounded-md border border-border bg-transparent px-2 text-sm tabular" aria-label="days" />
        <span className="text-small-caps text-muted-foreground">d</span>
        <input type="number" min={0} max={23} value={hours}
          onChange={(e) => setHours(Math.max(0, Math.min(23, Number(e.target.value) || 0)))}
          className="h-9 w-14 rounded-md border border-border bg-transparent px-2 text-sm tabular" aria-label="hours" />
        <span className="text-small-caps text-muted-foreground">h</span>
        <input type="number" min={0} max={59} value={mins}
          onChange={(e) => setMins(Math.max(0, Math.min(59, Number(e.target.value) || 0)))}
          className="h-9 w-14 rounded-md border border-border bg-transparent px-2 text-sm tabular" aria-label="minutes" />
        <span className="text-small-caps text-muted-foreground">m</span>
      </div>
      <div className="text-small-caps text-muted-foreground">
        Offset · <code className="font-mono normal-case tracking-normal">{formatOffset(value)}</code>
      </div>
    </div>
  );
};

const inferPlatformFromOptions = (opts: Record<string, unknown> | null): import("@smm/shared").Platform | null => {
  if (!opts) return null;
  if (typeof opts.subreddit === "string") return "reddit";
  if (typeof opts.authorUrn === "string") return "linkedin";
  if (typeof opts.igUserId === "string") return "instagram";
  if ("threadSegments" in opts || opts.postKind === "tweet" || opts.postKind === "thread") return "twitter";
  if (opts.postKind === "first_comment" || opts.postKind === "maker_response" || opts.postKind === "launch_copy") {
    return "producthunt";
  }
  return null;
};

const buildPlatformOptions = (
  platform: string | null,
  vals: { subreddit?: string },
): Record<string, unknown> | null => {
  if (!platform) return null;
  switch (platform) {
    case "reddit":
      return { subreddit: vals.subreddit, postKind: "self" };
    case "linkedin":
      return { authorType: "person", visibility: "PUBLIC" };
    case "twitter":
      return { postKind: "tweet" };
    case "instagram":
      return { postKind: "image" };
    case "producthunt":
      return { postKind: "first_comment" };
    default:
      return null;
  }
};

export default DraftEditor;

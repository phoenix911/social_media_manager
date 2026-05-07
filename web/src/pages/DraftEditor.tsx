import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import useSWR, { mutate } from "swr";
import type { Account, Draft, Project, Track } from "@smm/shared";
import { api, ApiCallError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Preview } from "@/components/Preview";
import { MediaUploader } from "@/components/MediaUploader";
import { formatOffset, userTz } from "@/lib/time";
import { DateTime } from "@/components/DateTime";

interface Props {
  mode: "new" | "edit";
}

const DraftEditor = ({ mode }: Props) => {
  const { slug, id } = useParams();
  const navigate = useNavigate();

  const { data: pData } = useSWR<{ project: Project }>(slug ? `/api/projects/${slug}` : null);
  const project = pData?.project;
  const { data: aData } = useSWR<{ accounts: Account[] }>(
    project ? `/api/accounts?projectId=${project.id}` : null,
  );
  const { data: tData } = useSWR<{ tracks: Track[] }>(
    project ? `/api/tracks?projectId=${project.id}` : null,
  );
  const draftKey = mode === "edit" && id ? `/api/drafts/${id}` : null;
  const { data: dData } = useSWR<{ draft: Draft }>(draftKey);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [accountId, setAccountId] = useState<string | null>(null);
  const [trackId, setTrackId] = useState<string | null>(null);
  const [offsetMinutes, setOffsetMinutes] = useState<number | null>(null);
  const [subreddit, setSubreddit] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [err, setErr] = useState<string | null>(null);

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

  // Preview is now a React tree (markdown rendered, per-platform shell);
  // no need to memoize a string.

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
      {/* breadcrumb / back */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
        {slug && <Link to={`/p/${slug}`} className="hover:text-foreground">← {project?.name ?? "project"}</Link>}
        {track && (
          <>
            <span>/</span>
            <Link to={`/p/${slug}/t/${track.id}`} className="hover:text-foreground truncate">{track.name}</Link>
          </>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 mb-4">
        <h1 className="text-lg sm:text-xl font-semibold">
          {mode === "new" ? "new post" : "edit post"}
        </h1>
        <div className="flex items-center gap-2 text-xs sm:text-sm">
          {dData?.draft.status && (
            <span className="hidden sm:inline uppercase tracking-wide text-muted-foreground">
              {dData.draft.status}
            </span>
          )}
          {status === "saving" && <span className="text-muted-foreground">saving…</span>}
          {status === "saved" && <span className="text-green-600">saved</span>}
          {status === "error" && <span className="text-destructive truncate max-w-[140px]">{err}</span>}
          <Button onClick={save} disabled={!project || status === "saving"}>save</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* edit pane */}
        <section className="space-y-3">
          {/* track + account selectors — stack on mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">track</label>
              <select
                value={trackId ?? ""}
                onChange={(e) => setTrackId(e.target.value || null)}
                className="block w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
              >
                <option value="">— pick track —</option>
                {(tData?.tracks ?? []).filter((t) => !t.archivedAt).map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">account</label>
              <select
                value={accountId ?? ""}
                onChange={(e) => setAccountId(e.target.value || null)}
                className="block w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
              >
                <option value="">— pick account —</option>
                {(aData?.accounts ?? []).filter((a) => !a.revokedAt).map((a) => (
                  <option key={a.id} value={a.id}>{a.platform} · {a.handle}</option>
                ))}
              </select>
            </div>
          </div>

          {platform === "reddit" && (
            <div>
              <label className="text-xs text-muted-foreground block mb-1">subreddit (without r/)</label>
              <Input placeholder="sideproject" value={subreddit} onChange={(e) => setSubreddit(e.target.value)} />
            </div>
          )}

          <Input placeholder="title (optional for some platforms)" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Textarea
            placeholder="post body (markdown)"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="min-h-[260px] sm:min-h-[400px] font-mono text-sm"
          />

          {/* media — only when draft exists (needs a draftId for the junction) */}
          {mode === "edit" && id && project && (
            <MediaUploader draftId={id} projectId={project.id} />
          )}
          {mode === "new" && (
            <p className="text-xs text-muted-foreground">
              save the draft first, then attach images / videos.
            </p>
          )}

          {/* offset (only meaningful when track has start_at) */}
          <div className="rounded-lg border p-3 space-y-2">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">scheduling</div>
            {track?.startAt ? (
              <div className="text-xs text-muted-foreground">
                track starts <DateTime value={track.startAt} tz={track.tz} />{" "}
                · your tz: <code>{userTz()}</code>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">
                this track has no start date yet — set one on the track page so offsets resolve.
              </div>
            )}

            <OffsetInput value={offsetMinutes} onChange={setOffsetMinutes} />

            {dData?.draft?.scheduledFor && (
              <div className="text-xs text-muted-foreground">
                resolves to: <DateTime value={dData.draft.scheduledFor} tz={dData.draft.scheduledTz ?? track?.tz} />
              </div>
            )}
          </div>
        </section>

        {/* preview pane */}
        <section className="space-y-2">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            preview {platform ? `· ${platform}` : ""}
          </div>
          <div className="rounded-lg border p-3 sm:p-4 bg-muted/40 min-h-[200px] sm:min-h-[400px] text-sm">
            <Preview platform={platform} title={title} body={body} subreddit={subreddit} />
          </div>
        </section>
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
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 text-sm">
        <select
          value={signState}
          onChange={(e) => setSign(Number(e.target.value) as -1 | 1)}
          className="h-9 rounded-md border border-input bg-transparent px-2 text-sm"
        >
          <option value={1}>after start (T+)</option>
          <option value={-1}>before start (T−)</option>
        </select>
        <input
          type="number"
          min={0}
          value={days}
          onChange={(e) => setDays(Math.max(0, Number(e.target.value) || 0))}
          className="h-9 w-16 rounded-md border border-input bg-transparent px-2 text-sm"
          aria-label="days"
        />
        <span className="text-muted-foreground text-xs">d</span>
        <input
          type="number"
          min={0}
          max={23}
          value={hours}
          onChange={(e) => setHours(Math.max(0, Math.min(23, Number(e.target.value) || 0)))}
          className="h-9 w-16 rounded-md border border-input bg-transparent px-2 text-sm"
          aria-label="hours"
        />
        <span className="text-muted-foreground text-xs">h</span>
        <input
          type="number"
          min={0}
          max={59}
          value={mins}
          onChange={(e) => setMins(Math.max(0, Math.min(59, Number(e.target.value) || 0)))}
          className="h-9 w-16 rounded-md border border-input bg-transparent px-2 text-sm"
          aria-label="minutes"
        />
        <span className="text-muted-foreground text-xs">m</span>
      </div>
      <div className="text-xs text-muted-foreground">
        offset: <code>{formatOffset(value)}</code>
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

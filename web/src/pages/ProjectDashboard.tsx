import { useState } from "react";
import { Link, useParams } from "react-router";
import useSWR, { mutate } from "swr";
import type { Project, Track, TrackSummary } from "@smm/shared";
import { api, ApiCallError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DateTime } from "@/components/DateTime";
import { PageNumber } from "@/components/PageNumber";
import { PullToRefresh } from "@/components/PullToRefresh";

const ProjectDashboard = () => {
  const { slug } = useParams();
  const { data: pData } = useSWR<{ project: Project }>(slug ? `/api/projects/${slug}` : null);
  const project = pData?.project;
  const { data: tData, isLoading } = useSWR<{ tracks: TrackSummary[] }>(
    project ? `/api/tracks?projectId=${project.id}` : null,
  );

  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [tab, setTab] = useState<"all" | "noToday" | "future" | "past">("all");

  const create = async () => {
    if (!project) return;
    setErr(null);
    try {
      await api<{ track: Track }>("/api/tracks", {
        method: "POST",
        body: JSON.stringify({
          projectId: project.id,
          name,
          description: desc || null,
          tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });
      mutate(`/api/tracks?projectId=${project.id}`);
      setName("");
      setDesc("");
      setCreating(false);
    } catch (e) {
      setErr(e instanceof ApiCallError ? e.message : "failed");
    }
  };

  if (!project) return <div className="p-6 text-muted-foreground">loading…</div>;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const todayEnd = todayStart + 24 * 60 * 60 * 1000;
  const groupOf = (startAt: string | null): "noToday" | "future" | "past" => {
    if (!startAt) return "noToday";
    const t = new Date(startAt).getTime();
    if (t >= todayStart && t < todayEnd) return "noToday";
    return t < todayStart ? "past" : "future";
  };
  const allTracks = (tData?.tracks ?? [])
    .filter((t) => !t.archivedAt)
    .slice()
    .sort((a, b) => {
      const aStart = a.startAt ? new Date(a.startAt).getTime() : null;
      const bStart = b.startAt ? new Date(b.startAt).getTime() : null;
      const order = { noToday: 0, past: 1, future: 2 } as const;
      const ga = order[groupOf(a.startAt)];
      const gb = order[groupOf(b.startAt)];
      if (ga !== gb) return ga - gb;
      if (aStart === null || bStart === null) return 0;
      if (ga === order.past) return bStart - aStart;
      return aStart - bStart;
    });
  const tracks = tab === "all" ? allTracks : allTracks.filter((t) => groupOf(t.startAt) === tab);

  return (
    <div className="max-w-[1040px] mx-auto px-4 sm:px-8 py-10 sm:py-16 space-y-12 sm:space-y-16">
      <PullToRefresh
        onRefresh={async () => {
          await Promise.all([
            mutate(`/api/projects/${slug}`),
            mutate(`/api/tracks?projectId=${project.id}`),
          ]);
        }}
      />
      {/* Masthead */}
      <header>
        <Link to="/" className="text-small-caps text-muted-foreground hover:text-foreground transition-colors">
          ← All projects
        </Link>
        <h1 className="text-display-lg mt-4 leading-none">{project.name}</h1>
        <div className="text-small-caps text-muted-foreground mt-3 flex flex-wrap gap-x-4 gap-y-1 tabular">
          <span>/{project.slug}</span>
          {project.description && <span className="italic normal-case tracking-normal text-body-lg text-muted-foreground">— {project.description}</span>}
        </div>
      </header>

      {/* Tracks */}
      <section>
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="divider-cap flex-1">
            <span>Tracks · {allTracks.length.toString().padStart(2, "0")}</span>
          </div>
          {!creating && (
            <Button size="sm" variant="outline" onClick={() => setCreating(true)}>
              + New track
            </Button>
          )}
        </div>

        {creating && (
          <div className="rounded-md border border-border p-5 mb-6 space-y-3 bg-muted/40">
            <div className="text-small-caps text-muted-foreground">New track</div>
            <Input placeholder="name (e.g. Q4 launch)" value={name} onChange={(e) => setName(e.target.value)} />
            <Textarea placeholder="description (optional)" value={desc} onChange={(e) => setDesc(e.target.value)} className="min-h-[60px]" />
            {err && <p className="text-sm text-destructive">{err}</p>}
            <div className="flex gap-2">
              <Button onClick={create} disabled={!name}>Create</Button>
              <Button variant="ghost" onClick={() => { setCreating(false); setErr(null); }}>Cancel</Button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-6 mb-6 text-small-caps">
          {([
            ["all", "All", allTracks.length],
            ["noToday", "Today / unset", allTracks.filter((t) => groupOf(t.startAt) === "noToday").length],
            ["future", "Future", allTracks.filter((t) => groupOf(t.startAt) === "future").length],
            ["past", "Past", allTracks.filter((t) => groupOf(t.startAt) === "past").length],
          ] as const).map(([key, label, count]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`relative pb-1 transition-colors ${
                tab === key ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              } ${tab === key ? "after:absolute after:left-0 after:right-0 after:bottom-0 after:h-[2px] after:bg-primary" : ""}`}
            >
              {label} <span className="opacity-50 tabular">({count})</span>
            </button>
          ))}
        </div>

        {isLoading && <p className="text-muted-foreground">loading…</p>}
        {!isLoading && tracks.length === 0 && (
          <div className="py-16 text-center text-muted-foreground">
            <p className="text-display-sm mb-3">No tracks yet.</p>
            <p className="text-small-caps">Create one above.</p>
          </div>
        )}

        {tracks.length > 0 && (
          <ul className="divide-y divide-border border-y border-border">
            {tracks.map((t, i) => (
              <li key={t.id}>
                <Link
                  to={`/p/${slug}/t/${t.id}`}
                  className="grid grid-cols-[3.5rem_1fr_auto] sm:grid-cols-[4.5rem_1fr_auto] items-center gap-4 sm:gap-6 py-6 row-link"
                >
                  <PageNumber n={i + 1} />
                  <div className="min-w-0">
                    <div className="text-title truncate">{t.name}</div>
                    {t.description && (
                      <div className="text-body-lg italic text-muted-foreground line-clamp-1 mt-0.5">{t.description}</div>
                    )}
                  </div>
                  <div className="hidden sm:flex flex-col items-end text-small-caps text-muted-foreground gap-1 tabular">
                    <span>{t.draftCount.toString().padStart(2, "0")} drafts</span>
                    {t.startAt && (
                      <span><DateTime value={t.startAt} tz={t.tz} short /></span>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default ProjectDashboard;

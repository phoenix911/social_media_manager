import { useState } from "react";
import { Link, useParams } from "react-router";
import useSWR, { mutate } from "swr";
import type { Project, Track } from "@smm/shared";
import { api, ApiCallError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DateTime } from "@/components/DateTime";

const ProjectDashboard = () => {
  const { slug } = useParams();
  const { data: pData } = useSWR<{ project: Project }>(slug ? `/api/projects/${slug}` : null);
  const project = pData?.project;
  const { data: tData, isLoading } = useSWR<{ tracks: Track[] }>(
    project ? `/api/tracks?projectId=${project.id}` : null,
  );
  const { data: dData } = useSWR<{ drafts: Array<{ trackId: string }> }>(
    project ? `/api/drafts?projectId=${project.id}` : null,
  );

  const draftCounts = (dData?.drafts ?? []).reduce<Record<string, number>>((m, d) => {
    m[d.trackId] = (m[d.trackId] ?? 0) + 1;
    return m;
  }, {});

  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [err, setErr] = useState<string | null>(null);

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

  const tracks = (tData?.tracks ?? []).filter((t) => !t.archivedAt);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
      <header className="mb-5">
        <h1 className="text-xl sm:text-2xl font-semibold leading-tight">{project.name}</h1>
        <p className="text-sm text-muted-foreground">{project.slug}</p>
      </header>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">tracks</h2>
        {!creating && (
          <Button size="sm" onClick={() => setCreating(true)}>
            + new track
          </Button>
        )}
      </div>

      {creating && (
        <div className="rounded-lg border p-3 sm:p-4 mb-4 space-y-3 bg-muted/30">
          <Input placeholder="name (e.g. Q4 launch)" value={name} onChange={(e) => setName(e.target.value)} />
          <Textarea placeholder="description (optional)" value={desc} onChange={(e) => setDesc(e.target.value)} className="min-h-[60px]" />
          {err && <p className="text-sm text-destructive">{err}</p>}
          <div className="flex gap-2">
            <Button onClick={create} disabled={!name} className="flex-1 sm:flex-none">create</Button>
            <Button variant="ghost" onClick={() => { setCreating(false); setErr(null); }}>cancel</Button>
          </div>
        </div>
      )}

      {isLoading && <p className="text-muted-foreground">loading…</p>}
      {!isLoading && tracks.length === 0 && (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          no tracks yet — create one above.
        </div>
      )}
      {tracks.length > 0 && (
        <ul className="space-y-2">
          {tracks.map((t) => (
            <li key={t.id}>
              <Link
                to={`/p/${slug}/t/${t.id}`}
                className="block rounded-lg border p-3 sm:p-4 hover:bg-accent transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{t.name}</div>
                    {t.description && (
                      <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{t.description}</div>
                    )}
                    <div className="text-xs text-muted-foreground mt-1">
                      {draftCounts[t.id] ?? 0} drafts
                      {t.startAt && (
                        <>
                          {" · "}
                          starts <DateTime value={t.startAt} tz={t.tz} />
                        </>
                      )}
                    </div>
                  </div>
                  <span className="text-muted-foreground text-lg shrink-0">›</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ProjectDashboard;

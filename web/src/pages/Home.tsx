import { useState } from "react";
import { Link, useNavigate } from "react-router";
import useSWR, { mutate } from "swr";
import type { Account, Project, Track } from "@smm/shared";
import { api, ApiCallError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProjectStore } from "@/store/projectStore";
import { VersionTag } from "@/components/VersionTag";
import ApiKeysCard from "@/components/ApiKeysCard";

const ProjectTile = ({ project, onPick }: { project: Project; onPick: () => void }) => {
  const { data: aData } = useSWR<{ accounts: Account[] }>(`/api/accounts?projectId=${project.id}`);
  const { data: tData } = useSWR<{ tracks: Track[] }>(`/api/tracks?projectId=${project.id}`);
  const channels = (aData?.accounts ?? []).filter((a) => !a.revokedAt);
  const tracks = (tData?.tracks ?? []).filter((t) => !t.archivedAt);
  const platforms = Array.from(new Set(channels.map((c) => c.platform))).sort();

  return (
    <li>
      <Link
        to={`/p/${project.slug}`}
        onClick={onPick}
        className="flex items-start gap-3 rounded-lg border p-3 sm:p-4 hover:bg-accent transition-colors"
      >
        <ProjectIcon slug={project.slug} name={project.name} />
        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <div className="font-medium truncate">{project.name}</div>
            <div className="text-xs text-muted-foreground truncate">{project.slug}</div>
          </div>
          <div className="flex flex-wrap gap-1.5 text-[11px]">
            <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
              {tracks.length} track{tracks.length === 1 ? "" : "s"}
            </span>
            {platforms.length > 0 ? (
              platforms.map((p) => (
                <span key={p} className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground capitalize">
                  {p}
                </span>
              ))
            ) : (
              <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground italic">
                no channels
              </span>
            )}
          </div>
        </div>
      </Link>
    </li>
  );
};

// Slug-based icon: looks up `/projects/<slug>.svg`. If 404, falls back
// to a deterministic letter avatar.
const ProjectIcon = ({ slug, name }: { slug: string; name: string }) => {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span
        className="w-10 h-10 rounded-md grid place-items-center text-base font-semibold shrink-0 bg-muted text-foreground"
        aria-hidden
      >
        {name[0]?.toUpperCase() ?? "?"}
      </span>
    );
  }
  return (
    <img
      src={`/projects/${slug}.svg`}
      alt=""
      className="w-10 h-10 rounded-md object-contain shrink-0 bg-muted p-1"
      onError={() => setFailed(true)}
      loading="lazy"
    />
  );
};

const HomePage = () => {
  const { data, isLoading } = useSWR<{ projects: Project[] }>("/api/projects");
  const { data: chData } = useSWR<{ accounts: Account[] }>("/api/accounts");
  const navigate = useNavigate();
  const setCurrent = useProjectStore((s) => s.setCurrent);

  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const create = async () => {
    setErr(null);
    try {
      const { project } = await api<{ project: Project }>("/api/projects", {
        method: "POST",
        body: JSON.stringify({ slug, name, description: null }),
      });
      mutate("/api/projects");
      setCurrent(project.slug);
      navigate(`/p/${project.slug}`);
    } catch (e) {
      setErr(e instanceof ApiCallError ? e.message : "failed to create");
    }
  };

  // Index project lookup so the channels section can show project name.
  const projectById = new Map((data?.projects ?? []).map((p) => [p.id, p]));
  const channels = (chData?.accounts ?? []).filter((a) => !a.revokedAt);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
      <div className="flex items-center justify-between gap-3">
        <VersionTag />
        <Link
          to="/reminders"
          className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
        >
          ⏰ reminders
        </Link>
      </div>
      <section>
        <div className="flex items-center justify-between mb-3 gap-3">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">your projects</h1>
          {!creating && (
            <Button size="sm" onClick={() => setCreating(true)}>+ new project</Button>
          )}
        </div>
        {creating && (
          <div className="rounded-lg border p-3 sm:p-4 mb-4 space-y-3 bg-muted/30">
            <Input placeholder="display name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input
              placeholder="slug (a-z, 0-9, hyphens)"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase())}
            />
            {err && <p className="text-sm text-destructive">{err}</p>}
            <div className="flex gap-2">
              <Button onClick={create} disabled={!name || !slug} className="flex-1 sm:flex-none">create</Button>
              <Button variant="ghost" onClick={() => setCreating(false)}>cancel</Button>
            </div>
          </div>
        )}
        {isLoading && <p className="text-muted-foreground">loading…</p>}
        {data && data.projects.length === 0 && !creating && (
          <p className="text-muted-foreground">no projects yet — click <strong>+ new project</strong> to start.</p>
        )}
        {data && data.projects.length > 0 && (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.projects.map((p) => (
              <ProjectTile key={p.id} project={p} onPick={() => setCurrent(p.slug)} />
            ))}
          </ul>
        )}
      </section>

      <ApiKeysCard />

      <section>
        <div className="flex items-center justify-between mb-3 gap-3">
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">your channels</h2>
          <Button asChild size="sm">
            <Link to="/channels">+ add channel</Link>
          </Button>
        </div>
        {channels.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            no channels yet — click <strong>+ add channel</strong> to add one.
          </p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {channels.map((ch) => {
              const proj = ch.projectId ? projectById.get(ch.projectId) : null;
              return (
                <li key={ch.id}>
                  <Link
                    to="/channels"
                    className="block rounded-lg border p-3 sm:p-4 hover:bg-accent transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{ch.handle}</div>
                        <div className="text-xs text-muted-foreground capitalize">{ch.platform}</div>
                      </div>
                      {proj && (
                        <span className="text-[11px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
                          {proj.name}
                        </span>
                      )}
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

export default HomePage;

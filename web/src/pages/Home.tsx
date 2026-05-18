import { useState } from "react";
import { Link, useNavigate } from "react-router";
import useSWR, { mutate } from "swr";
import type { Account, Project, ProjectSummary } from "@smm/shared";
import { api, ApiCallError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProjectStore } from "@/store/projectStore";
import { VersionTag } from "@/components/VersionTag";
import ApiKeysCard from "@/components/ApiKeysCard";
import { PageNumber } from "@/components/PageNumber";
import { PullToRefresh } from "@/components/PullToRefresh";

const HomePage = () => {
  const { data, isLoading } = useSWR<{ projects: ProjectSummary[] }>("/api/projects");
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

  const projectById = new Map((data?.projects ?? []).map((p) => [p.id, p]));
  const channels = (chData?.accounts ?? []).filter((a) => !a.revokedAt);
  const projectCount = data?.projects.length ?? 0;
  const today = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <div className="max-w-[1040px] mx-auto px-4 sm:px-8 py-10 sm:py-16 space-y-16 sm:space-y-24">
      <PullToRefresh
        onRefresh={async () => {
          await Promise.all([
            mutate("/api/projects"),
            mutate("/api/accounts"),
          ]);
        }}
      />
      {/* Masthead */}
      <header className="flex flex-wrap items-end justify-between gap-y-4">
        <div>
          <div className="text-small-caps text-muted-foreground mb-3 tabular">{today}</div>
          <h1 className="text-display-lg leading-none">
            Manager<span className="text-primary">.</span>
          </h1>
        </div>
        <div className="flex items-center gap-5">
          <Link to="/reminders" className="text-small-caps text-muted-foreground hover:text-foreground transition-colors">
            Reminders
          </Link>
          <Link to="/channels" className="text-small-caps text-muted-foreground hover:text-foreground transition-colors">
            Channels
          </Link>
          <VersionTag />
        </div>
      </header>

      {/* Projects */}
      <section>
        <div className="divider-cap mb-6">
          <span>Projects · {projectCount.toString().padStart(2, "0")}</span>
        </div>

        {!creating && data && data.projects.length > 0 && (
          <ul className="divide-y divide-border border-y border-border">
            {data.projects.map((p, i) => (
              <ProjectRow key={p.id} project={p} index={i + 1} onPick={() => setCurrent(p.slug)} />
            ))}
          </ul>
        )}

        {creating && (
          <div className="my-6 rounded-md border border-border p-5 space-y-3 bg-muted/40">
            <div className="text-small-caps text-muted-foreground">New project</div>
            <Input placeholder="display name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input
              placeholder="slug (a-z, 0-9, hyphens)"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase())}
            />
            {err && <p className="text-sm text-destructive">{err}</p>}
            <div className="flex gap-2">
              <Button onClick={create} disabled={!name || !slug}>Create</Button>
              <Button variant="ghost" onClick={() => setCreating(false)}>Cancel</Button>
            </div>
          </div>
        )}

        {isLoading && <p className="text-muted-foreground py-6">loading…</p>}
        {data && data.projects.length === 0 && !creating && (
          <p className="text-muted-foreground py-10 text-center">
            <span className="text-display-sm block mb-4">No projects yet.</span>
            <span className="text-small-caps">Click <em>New project</em> to start your first.</span>
          </p>
        )}

        {!creating && (
          <div className="mt-6 flex justify-end">
            <Button variant="outline" size="sm" onClick={() => setCreating(true)}>
              + New project
            </Button>
          </div>
        )}
      </section>

      {/* Channels */}
      <section>
        <div className="divider-cap mb-6">
          <span>Channels · {channels.length.toString().padStart(2, "0")}</span>
        </div>

        {channels.length === 0 ? (
          <p className="text-muted-foreground py-6">
            <span className="text-small-caps">No channels yet.</span> Add one from{" "}
            <Link to="/channels" className="underline underline-offset-4 hover:opacity-70">/channels</Link>.
          </p>
        ) : (
          <ul className="divide-y divide-border border-y border-border">
            {channels.map((ch, i) => {
              const proj = ch.projectId ? projectById.get(ch.projectId) : null;
              return (
                <li key={ch.id}>
                  <Link
                    to="/channels"
                    className="grid grid-cols-[3.5rem_1fr_auto] sm:grid-cols-[4.5rem_1fr_auto] items-center gap-4 py-5 row-link"
                  >
                    <PageNumber n={i + 1} />
                    <div className="min-w-0">
                      <div className="text-title truncate">{ch.handle}</div>
                      <div className="text-small-caps text-muted-foreground mt-0.5">
                        {ch.platform}
                        {proj && <span className="ml-3 opacity-60">· {proj.name}</span>}
                      </div>
                    </div>
                    <span className="text-small-caps text-muted-foreground hidden sm:inline">View</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-6 flex justify-end">
          <Button asChild variant="outline" size="sm">
            <Link to="/channels">+ Add channel</Link>
          </Button>
        </div>
      </section>

      {/* Programmatic access */}
      <section>
        <div className="divider-cap mb-6">
          <span>Programmatic access</span>
        </div>
        <ApiKeysCard />
      </section>
    </div>
  );
};

const ProjectRow = ({
  project,
  index,
  onPick,
}: {
  project: ProjectSummary;
  index: number;
  onPick: () => void;
}) => {
  const { trackCount, platforms } = project;
  return (
    <li>
      <Link
        to={`/p/${project.slug}`}
        onClick={onPick}
        className="grid grid-cols-[3.5rem_1fr_auto] sm:grid-cols-[4.5rem_1fr_auto] items-center gap-4 sm:gap-6 py-6 row-link"
      >
        <PageNumber n={index} />
        <div className="min-w-0">
          <div className="text-display-sm truncate">{project.name}</div>
          {project.description ? (
            <div className="text-body-lg italic text-muted-foreground truncate mt-1">{project.description}</div>
          ) : (
            <div className="text-small-caps text-muted-foreground mt-1 tabular">/{project.slug}</div>
          )}
        </div>
        <div className="hidden sm:flex flex-col items-end gap-1 text-small-caps text-muted-foreground tabular">
          <span>{trackCount.toString().padStart(2, "0")} {trackCount === 1 ? "track" : "tracks"}</span>
          {platforms.length > 0 ? (
            <span>{platforms.join(" · ")}</span>
          ) : (
            <span className="italic opacity-60">no channels</span>
          )}
        </div>
      </Link>
    </li>
  );
};

export default HomePage;

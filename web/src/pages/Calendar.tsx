import { Link, useParams } from "react-router";
import useSWR from "swr";
import type { Draft, Project } from "@smm/shared";
import { DateTime } from "@/components/DateTime";

const Calendar = () => {
  const { slug } = useParams();
  const { data: pData } = useSWR<{ project: Project }>(slug ? `/api/projects/${slug}` : null);
  const project = pData?.project;
  const { data: dData } = useSWR<{ drafts: Draft[] }>(
    project ? `/api/drafts?projectId=${project.id}&status=scheduled` : null,
  );

  if (!project) return <div className="p-6 text-muted-foreground">loading…</div>;

  const sorted = (dData?.drafts ?? []).slice().sort((a, b) => (a.scheduledFor ?? "").localeCompare(b.scheduledFor ?? ""));
  const byDay = sorted.reduce<Record<string, Draft[]>>((m, d) => {
    const day = (d.scheduledFor ?? "").slice(0, 10);
    (m[day] ||= []).push(d);
    return m;
  }, {});

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <h1 className="text-xl font-semibold mb-4">scheduled posts — {project.name}</h1>
      {Object.keys(byDay).length === 0 && (
        <p className="text-muted-foreground">no scheduled posts.</p>
      )}
      {Object.entries(byDay).map(([day, drafts]) => (
        <section key={day} className="mb-6">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground mb-2">{day}</h2>
          <ul className="divide-y border rounded-lg">
            {drafts.map((d) => (
              <li key={d.id}>
                <Link to={`/p/${slug}/draft/${d.id}`} className="block p-3 hover:bg-accent transition-colors">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{d.title || "(untitled)"}</div>
                      <div className="text-xs text-muted-foreground truncate">{d.body.slice(0, 120)}</div>
                    </div>
                    <span className="text-xs shrink-0">
                      <DateTime value={d.scheduledFor} tz={d.scheduledTz} timeOnly />
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
};

export default Calendar;

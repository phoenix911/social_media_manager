import { useState } from "react";
import { Outlet, Link, NavLink, useParams } from "react-router";
import useSWR from "swr";
import type { Project, User } from "@smm/shared";
import { Menu, X, ChevronDown } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { InstallButton } from "@/components/InstallButton";

const App = () => {
  const { data } = useSWR<{ user: User }>("/api/me");
  const { data: projectsData } = useSWR<{ projects: Project[] }>("/api/projects");
  const { slug } = useParams();
  const [navOpen, setNavOpen] = useState(false);

  const currentProject = projectsData?.projects?.find((p) => p.slug === slug);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground safe-bottom">
      <header className="safe-top sticky top-0 z-30 bg-background/92 backdrop-blur-md border-b border-border">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between gap-3 px-4 sm:px-8 h-14">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            {/* Wordmark — stacked: serif M on top, "manager" small-caps under */}
            <Link
              to="/"
              className="inline-flex flex-col items-start leading-none row-link"
              aria-label="Manager · home"
            >
              <span className="font-serif text-[1.55rem] font-medium tracking-tight leading-none">M</span>
              <span className="text-[0.55rem] uppercase tracking-[0.28em] text-muted-foreground mt-0.5 leading-none">
                manager
              </span>
            </Link>

            {/* Project switcher — replaces the raw breadcrumb */}
            {slug && (
              <ProjectSwitcher current={currentProject ?? null} projects={projectsData?.projects ?? []} />
            )}
          </div>

          {/* desktop nav */}
          {slug && (
            <nav className="hidden sm:flex items-center gap-6 text-small-caps">
              <NavLink to={`/p/${slug}`} end className={({ isActive }) => navClass(isActive)}>
                Tracks
              </NavLink>
              <NavLink to={`/p/${slug}/calendar`} className={({ isActive }) => navClass(isActive)}>
                Calendar
              </NavLink>
              <NavLink to={`/p/${slug}/channels`} className={({ isActive }) => navClass(isActive)}>
                Channels
              </NavLink>
              <NavLink to={`/p/${slug}/owners`} className={({ isActive }) => navClass(isActive)}>
                Owners
              </NavLink>
            </nav>
          )}

          <div className="flex items-center gap-2 sm:gap-3 text-xs text-muted-foreground">
            <InstallButton />
            <span className="hidden md:inline truncate max-w-[200px] font-mono text-[11px]">
              {data?.user?.email ?? "…"}
            </span>
            <ThemeToggle />
            {slug && (
              <button
                className="sm:hidden p-2 rounded-full hover:bg-muted transition-colors"
                onClick={() => setNavOpen((o) => !o)}
                aria-label="menu"
              >
                {navOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* mobile drop-down nav */}
      {slug && navOpen && (
        <nav className="sm:hidden border-b border-border bg-background px-4 py-3 flex flex-col gap-1 text-sm">
          <NavLink to={`/p/${slug}`} end className={({ isActive }) => navClass(isActive, true)} onClick={() => setNavOpen(false)}>Tracks</NavLink>
          <NavLink to={`/p/${slug}/calendar`} className={({ isActive }) => navClass(isActive, true)} onClick={() => setNavOpen(false)}>Calendar</NavLink>
          <NavLink to={`/p/${slug}/channels`} className={({ isActive }) => navClass(isActive, true)} onClick={() => setNavOpen(false)}>Channels</NavLink>
          <NavLink to={`/p/${slug}/owners`} className={({ isActive }) => navClass(isActive, true)} onClick={() => setNavOpen(false)}>Owners</NavLink>
          <span className="text-xs text-muted-foreground pt-2 truncate font-mono">{data?.user?.email}</span>
        </nav>
      )}

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};

const navClass = (isActive: boolean, block = false) =>
  `${block ? "block" : ""} relative pb-0.5 transition-colors ${
    isActive
      ? "text-foreground after:absolute after:left-0 after:right-0 after:-bottom-[18px] after:h-[2px] after:bg-primary sm:after:block after:hidden"
      : "text-muted-foreground hover:text-foreground"
  }`;

const ProjectSwitcher = ({
  current,
  projects,
}: {
  current: Project | null;
  projects: Project[];
}) => {
  const [open, setOpen] = useState(false);
  if (projects.length === 0) return null;
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        className="inline-flex items-center gap-1.5 text-sm row-link"
      >
        <span className="opacity-50">/</span>
        <span className="font-medium">{current?.name ?? current?.slug ?? "…"}</span>
        <ChevronDown size={12} className="opacity-50" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute left-0 top-full mt-2 min-w-[220px] rounded-md border border-border bg-background shadow-none py-1.5 z-20"
        >
          {projects.map((p) => (
            <Link
              key={p.id}
              to={`/p/${p.slug}`}
              className={`block px-3 py-1.5 text-sm transition-colors hover:bg-muted ${
                p.slug === current?.slug ? "text-foreground" : "text-muted-foreground"
              }`}
              onClick={() => setOpen(false)}
            >
              {p.name}
              <span className="ml-2 font-mono text-[10px] opacity-50">{p.slug}</span>
            </Link>
          ))}
          <div className="hr-hairline my-1" />
          <Link
            to="/"
            className="block px-3 py-1.5 text-small-caps text-muted-foreground hover:text-foreground"
            onClick={() => setOpen(false)}
          >
            All projects
          </Link>
        </div>
      )}
    </div>
  );
};

export default App;

import { useState } from "react";
import { Outlet, Link, NavLink, useParams } from "react-router";
import useSWR from "swr";
import type { User } from "@smm/shared";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { InstallButton } from "@/components/InstallButton";

const App = () => {
  const { data } = useSWR<{ user: User }>("/api/me");
  const { slug } = useParams();
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground safe-bottom">
      <header className="safe-top sticky top-0 z-30 bg-background/95 backdrop-blur flex items-center justify-between gap-2 px-3 sm:px-6 py-2 sm:py-3 border-b">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Link to="/" className="font-semibold tracking-tight whitespace-nowrap">
            <span className="hidden sm:inline">Social Media Manager</span>
            <span className="sm:hidden">SMM</span>
          </Link>
          {slug && <span className="text-xs text-muted-foreground truncate">/ {slug}</span>}
        </div>

        {/* desktop nav */}
        {slug && (
          <nav className="hidden sm:flex items-center gap-1 text-sm">
            <NavLink to={`/p/${slug}`} end className={({ isActive }) => navClass(isActive)}>tracks</NavLink>
            <NavLink to={`/p/${slug}/calendar`} className={({ isActive }) => navClass(isActive)}>calendar</NavLink>
            <NavLink to={`/p/${slug}/channels`} className={({ isActive }) => navClass(isActive)}>channels</NavLink>
            <NavLink to={`/p/${slug}/owners`} className={({ isActive }) => navClass(isActive)}>owners</NavLink>
          </nav>
        )}

        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
          <InstallButton />
          <span className="hidden md:inline truncate max-w-[200px]">{data?.user?.email ?? "…"}</span>
          <ThemeToggle />
          {slug && (
            <button
              className="sm:hidden p-2 rounded-md hover:bg-accent"
              onClick={() => setNavOpen((o) => !o)}
              aria-label="menu"
            >
              {navOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          )}
        </div>
      </header>

      {/* mobile drop-down nav */}
      {slug && navOpen && (
        <nav className="sm:hidden border-b px-3 py-2 flex flex-col gap-0.5 text-sm">
          <NavLink to={`/p/${slug}`} end className={({ isActive }) => navClass(isActive, true)} onClick={() => setNavOpen(false)}>tracks</NavLink>
          <NavLink to={`/p/${slug}/calendar`} className={({ isActive }) => navClass(isActive, true)} onClick={() => setNavOpen(false)}>calendar</NavLink>
          <NavLink to={`/p/${slug}/channels`} className={({ isActive }) => navClass(isActive, true)} onClick={() => setNavOpen(false)}>channels</NavLink>
          <NavLink to={`/p/${slug}/owners`} className={({ isActive }) => navClass(isActive, true)} onClick={() => setNavOpen(false)}>owners</NavLink>
          <span className="text-xs text-muted-foreground px-3 pt-2 truncate">{data?.user?.email}</span>
        </nav>
      )}

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};

const navClass = (isActive: boolean, block = false) =>
  `${block ? "block" : ""} px-3 py-1 rounded-md transition-colors ${
    isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
  }`;

export default App;

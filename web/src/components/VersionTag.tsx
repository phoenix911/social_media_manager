// Build-time version tag. Tap 5× to hard-refresh:
//   1. unregister all service workers
//   2. clear all caches
//   3. window.location.reload()
//
// Click counter resets after 1.5s of inactivity, so accidental
// double-taps don't accumulate.

import { useEffect, useRef, useState } from "react";

export const VersionTag = () => {
  const [count, setCount] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const onClick = async () => {
    if (timer.current) clearTimeout(timer.current);
    const next = count + 1;
    if (next >= 5) {
      setCount(0);
      await hardRefresh();
      return;
    }
    setCount(next);
    timer.current = setTimeout(() => setCount(0), 1500);
  };

  const label = count > 0 ? `${__APP_VERSION__} · ${count}/5` : __APP_VERSION__;

  return (
    <button
      onClick={onClick}
      className="text-[11px] text-muted-foreground hover:text-foreground font-mono tabular-nums select-none"
      title="tap 5× to hard-refresh"
      aria-label="version (tap 5× to hard-refresh)"
    >
      {label}
    </button>
  );
};

const hardRefresh = async (): Promise<void> => {
  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } finally {
    // Bypass HTTP cache on reload by appending a cachebuster.
    const u = new URL(window.location.href);
    u.searchParams.set("_r", String(Date.now()));
    window.location.replace(u.toString());
  }
};

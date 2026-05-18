// Pull-to-refresh for mobile (and trackpad, by accident).
//
// Listens to touchstart/touchmove on the document. Only arms when
// scrollY is 0 (page is already at the top). Drags a small indicator
// down from the safe-area top. On release past the threshold, runs the
// onRefresh callback and waits for it.
//
// Disabled on non-touch pointer types — desktop users have refresh and
// SWR revalidation already.

import { useCallback, useEffect, useRef, useState } from "react";

const THRESHOLD = 70;        // px before refresh fires
const MAX_PULL  = 120;       // px the indicator can travel
const DAMPING   = 0.55;      // resistance so the pull feels weighted

interface Props {
  onRefresh: () => Promise<unknown> | unknown;
  /** If false, gesture is ignored entirely (e.g. an open modal). */
  enabled?: boolean;
}

export const PullToRefresh = ({ onRefresh, enabled = true }: Props) => {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const armed = useRef(false);

  const finish = useCallback(async () => {
    if (pull >= THRESHOLD) {
      setRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPull(0);
      }
    } else {
      setPull(0);
    }
    startY.current = null;
    armed.current = false;
  }, [pull, onRefresh]);

  useEffect(() => {
    if (!enabled) return;

    const onTouchStart = (e: TouchEvent) => {
      if (window.scrollY > 4) return;          // only at the top
      if (refreshing) return;
      const touch = e.touches[0];
      if (!touch) return;
      startY.current = touch.clientY;
      armed.current = true;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!armed.current || startY.current == null) return;
      const touch = e.touches[0];
      if (!touch) return;
      const delta = touch.clientY - startY.current;
      if (delta <= 0) {
        // user reversed direction — disarm
        setPull(0);
        return;
      }
      // Don't fight the browser if the page is mid-scroll.
      if (window.scrollY > 4) {
        armed.current = false;
        setPull(0);
        return;
      }
      const damped = Math.min(delta * DAMPING, MAX_PULL);
      setPull(damped);
      // Block the native rubber-band only once we've taken control.
      if (damped > 4 && e.cancelable) e.preventDefault();
    };

    const onTouchEnd = () => {
      if (!armed.current) return;
      void finish();
    };

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", onTouchEnd, { passive: true });
    document.addEventListener("touchcancel", onTouchEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
      document.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [enabled, refreshing, finish]);

  const visible = pull > 0 || refreshing;
  // The indicator sits in a fixed slot above the header. Translation
  // mirrors the pull distance (or pins at threshold while refreshing).
  const y = refreshing ? THRESHOLD : pull;
  const progress = Math.min(pull / THRESHOLD, 1);
  const ready = pull >= THRESHOLD;

  return (
    <div
      aria-hidden={!visible}
      className="fixed left-0 right-0 top-0 z-40 flex justify-center pointer-events-none safe-fixed-top"
      style={{
        transform: `translateY(${Math.max(y - 32, -32)}px)`,
        transition: refreshing || pull === 0 ? "transform 220ms ease-out" : "none",
        opacity: visible ? 1 : 0,
      }}
    >
      <div className="rounded-full border border-border bg-background/95 backdrop-blur-md px-4 py-2 flex items-center gap-2 text-small-caps text-muted-foreground">
        <Spinner spinning={refreshing} progress={progress} />
        <span>{refreshing ? "Refreshing…" : ready ? "Release" : "Pull"}</span>
      </div>
    </div>
  );
};

const Spinner = ({ spinning, progress }: { spinning: boolean; progress: number }) => {
  // Rotates while refreshing; fills progressively while pulling.
  const dash = 2 * Math.PI * 7;                  // r=7
  const offset = dash * (1 - (spinning ? 1 : progress));
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      className={spinning ? "animate-spin" : ""}
    >
      <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeOpacity="0.18" strokeWidth="1.5" />
      <circle
        cx="8"
        cy="8"
        r="7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray={dash}
        strokeDashoffset={offset}
        transform="rotate(-90 8 8)"
      />
    </svg>
  );
};

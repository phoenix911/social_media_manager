// Tiny zero-dep toast — hairline strip top-right.
//
// Usage:
//   const { show } = useToast();
//   show("Published — view on Instagram", { href: "https://…", durationMs: 8000 });
//
// API surface intentionally minimal — one helper, one renderer. No
// global provider tree, no portal. The renderer mounts itself once.

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { X, ArrowUpRight } from "lucide-react";

interface ToastInput {
  href?: string;
  durationMs?: number;
  tone?: "default" | "warning";
}
interface ToastItem extends ToastInput {
  id: number;
  message: string;
}

interface ToastContextValue {
  show: (message: string, opts?: ToastInput) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be inside <ToastProvider>");
  return ctx;
};

let toastIdSeq = 1;

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setItems((xs) => xs.filter((x) => x.id !== id));
  }, []);

  const show = useCallback<ToastContextValue["show"]>((message, opts) => {
    const item: ToastItem = { id: toastIdSeq++, message, ...opts };
    setItems((xs) => [...xs, item]);
    const ttl = opts?.durationMs ?? 6000;
    if (ttl > 0) setTimeout(() => dismiss(item.id), ttl);
  }, [dismiss]);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="fixed top-4 right-4 z-[60] flex flex-col items-end gap-2 pointer-events-none safe-fixed-top"
      >
        {items.map((t) => (
          <ToastView key={t.id} item={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const ToastView = ({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) => {
  // Subtle entrance — fade + small upward slide. CSS-only.
  const [enter, setEnter] = useState(false);
  useEffect(() => {
    const r = requestAnimationFrame(() => setEnter(true));
    return () => cancelAnimationFrame(r);
  }, []);
  const tone =
    item.tone === "warning"
      ? "border-[#B5483B]/40 text-[#B5483B]"
      : "border-border text-foreground";
  return (
    <div
      className={`pointer-events-auto rounded-full border ${tone} bg-background/95 backdrop-blur-sm px-4 py-2 max-w-[360px] transition-all duration-300 ease-out ${
        enter ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"
      }`}
    >
      <div className="flex items-center gap-3 text-sm">
        <span className="truncate">{item.message}</span>
        {item.href && (
          <a
            href={item.href}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1 underline underline-offset-4 hover:opacity-70 shrink-0"
          >
            view <ArrowUpRight size={12} />
          </a>
        )}
        <button
          onClick={onDismiss}
          aria-label="dismiss"
          className="ml-1 opacity-50 hover:opacity-100 shrink-0"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

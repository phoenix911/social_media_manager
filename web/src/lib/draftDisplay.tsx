// Shared display helpers for drafts — used by track detail list AND the
// single-draft editor header. Keeps the visual language identical across
// surfaces.
import type { Account, DraftSummary, Platform } from "@smm/shared";

// Which (platform, postKind?) combos use the simplified 3-state circle
// indicator (missing / ready / posted) + missing-chip UI. Today only
// Instagram opts in; other platforms keep the full emoji ladder until
// they have a similarly-shaped publishability story.
export const usesCircleUi = (account: Account | null | undefined): boolean =>
  account?.platform === "instagram";

type CircleState = "missing" | "ready" | "posted" | "failed";

/** Circle state combines the raw draft.status with the publishability
 *  check: a draft sitting in `status='draft'` but with all required
 *  inputs ready (media + caption + channel + token + schedule) is
 *  "ready" in the UI even though the status field hasn't flipped yet. */
const circleStateFor = (
  status: string,
  publishable: boolean,
): CircleState => {
  if (status === "published") return "posted";
  if (status === "failed") return "failed";
  if (status === "ready" || status === "scheduled" || status === "publishing") return "ready";
  if (publishable) return "ready";
  return "missing";
};

// Refined for the editorial redesign: smaller dots with a subtle ring,
// muted palette (warm tones echo the cream background).
const CIRCLE_META: Record<CircleState, { color: string; label: string }> = {
  missing: { color: "bg-[#B5483B]", label: "missing" },
  ready:   { color: "bg-[#6B8E63]", label: "ready to be posted" },
  posted:  { color: "bg-[#4A6B8A]", label: "posted" },
  failed:  { color: "bg-[#C28330]", label: "failed" },
};

export const StatusCircle = ({
  status,
  publishable = false,
  size = "md",
}: {
  status: string;
  publishable?: boolean;
  size?: "sm" | "md";
}) => {
  const s = circleStateFor(status, publishable);
  const meta = CIRCLE_META[s];
  const dim = size === "sm" ? "w-2 h-2" : "w-2.5 h-2.5";
  return (
    <span
      title={meta.label}
      aria-label={meta.label}
      className={`inline-block rounded-full ${meta.color} ${dim} shrink-0 ring-2 ring-background`}
    />
  );
};

export const CircleLegend = () => (
  <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-small-caps text-muted-foreground">
    <span className="inline-flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#B5483B]" />Missing</span>
    <span className="inline-flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#6B8E63]" />Ready</span>
    <span className="inline-flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#4A6B8A]" />Posted</span>
    <span className="inline-flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#C28330]" />Failed</span>
  </div>
);

/** What's missing on a draft before it can be published?
 *  Order = most-blocking first. */
export const missingFor = (
  d: DraftSummary,
  trackHasAccount: boolean,
  account?: Account | null,
): string[] => {
  if (d.status === "published") return [];
  const out: string[] = [];
  if (d.mediaCount === 0) out.push("media");
  if (!d.body || d.body.trim().length === 0) out.push("caption");
  if (!trackHasAccount && !d.accountId) out.push("channel");
  if (!d.scheduledFor) out.push("schedule");
  // Account is bound, but its OAuth token hasn't been seeded yet (the
  // dummy-account placeholder pattern). The publisher will fail to
  // decrypt and use the placeholder string, so block here.
  // "channel-token" specifically — not the user's session auth, which
  // is a different concept and is already satisfied if they can see
  // this draft at all.
  if (account?.meta && (account.meta as Record<string, unknown>).placeholder === true) {
    out.push("channel-token");
  }
  return out;
};

// Quieter chips — hairline outlines + terracotta ink (no fill).
// Editorial restraint over status-flag-saturation.
export const MissingChips = ({ items }: { items: string[] }) => {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((m) => (
        <span
          key={m}
          className="inline-flex items-center rounded-full border border-[#B5483B]/30 text-[#B5483B] px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.1em]"
        >
          {m}
        </span>
      ))}
    </div>
  );
};

// Post-kind (media type) badge — hairline outline, small-caps label.
// No emoji clutter; the format word does the work.
const POST_KIND_META: Record<string, { label: string }> = {
  reel:     { label: "reel" },
  carousel: { label: "carousel" },
  image:    { label: "photo" },
  video:    { label: "video" },
  story:    { label: "story" },
  thread:   { label: "thread" },
  tweet:    { label: "tweet" },
  self:     { label: "post" },
};

export const postKindOf = (opts: Record<string, unknown> | null): string | null => {
  if (!opts) return null;
  return typeof opts.postKind === "string" ? (opts.postKind as string) : null;
};

export const PostKindBadge = ({ kind, title }: { kind: string; title?: string }) => {
  const meta = POST_KIND_META[kind] ?? { label: kind };
  return (
    <span
      title={title}
      className="inline-flex items-center rounded-full border border-border text-muted-foreground px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em]"
    >
      {meta.label}
    </span>
  );
};

// Per-(platform, postKind) media spec strings. Mirrors the limits in
// mediaValidate.ts but in human-readable form for inline UI hints.
const MEDIA_SPECS: Record<string, Record<string, { short: string; full: string }>> = {
  instagram: {
    reel: {
      short: "MP4/MOV · 9:16 · ≤100 MB · 3–90s",
      full: "Reel — MP4 or MOV, vertical 9:16, 1080×1920 recommended (min 540×960), ≤100 MB, duration 3–90s.",
    },
    carousel: {
      short: "JPG/PNG (≤8 MB) or MP4 (≤100 MB) · 4:5 to 1.91:1 · 2–10 slides",
      full: "Carousel — 2–10 slides; images JPG/PNG ≤8 MB each, videos MP4/MOV ≤100 MB and ≤60s; aspect 4:5 to 1.91:1; keep every slide the same aspect.",
    },
    image: {
      short: "JPG/PNG · 4:5 to 1.91:1 · ≤8 MB",
      full: "Photo (feed) — JPG/PNG, aspect 4:5 to 1.91:1 (1080×1080 square or 1080×1350 portrait), min 320px wide, ≤8 MB.",
    },
    story: {
      short: "9:16 · JPG/PNG (≤8 MB) or MP4 (≤100 MB, ≤60s)",
      full: "Story — vertical 9:16; JPG/PNG ≤8 MB or MP4/MOV ≤100 MB and ≤60s.",
    },
  },
};

export const mediaSpecFor = (
  platform: Platform | null,
  postKind: string | null,
): { short: string; full: string } | null => {
  if (!platform || !postKind) return null;
  return MEDIA_SPECS[platform]?.[postKind] ?? null;
};

/** Inline line that explains what media this post needs. Renders nothing
 *  if we don't have a spec for the (platform, postKind) pair. */
export const MediaSpecHint = ({
  platform,
  postKind,
  className,
}: {
  platform: Platform | null;
  postKind: string | null;
  className?: string;
}) => {
  const spec = mediaSpecFor(platform, postKind);
  if (!spec) return (className ? <span className={className} /> : null);
  return (
    <span
      title={spec.full}
      className={`inline-flex items-center text-muted-foreground ${className ?? ""}`}
    >
      <span className="text-small-caps mr-2 opacity-60">spec</span>
      <code className="font-mono text-[11px]">{spec.short}</code>
    </span>
  );
};

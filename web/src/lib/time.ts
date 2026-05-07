// Helpers to convert between UTC (storage) and the user's local TZ
// (display). The browser's local tz is the default; per-track tz can
// override per draft.

const localTz = (): string => Intl.DateTimeFormat().resolvedOptions().timeZone;

export const userTz = localTz;

const fmt = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "short",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  timeZoneName: "short",
});

const fmtShort = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

/** ISO UTC → "Apr 17, 09:30 PM IST" */
export const formatLocal = (iso: string | null | undefined, tz?: string | null): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const f = tz
    ? new Intl.DateTimeFormat(undefined, {
        timeZone: tz,
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "short",
      })
    : fmt;
  return f.format(d);
};

/** Compact "Apr 17 21:30" */
export const formatLocalShort = (iso: string | null | undefined, tz?: string | null): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const f = tz
    ? new Intl.DateTimeFormat(undefined, {
        timeZone: tz,
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : fmtShort;
  return f.format(d);
};

/** Convert <input type="datetime-local"> value (assumed in user's local tz)
 * → UTC ISO string. The input has no tz info; we treat it as local. */
export const localInputToUtcIso = (localValue: string): string | null => {
  if (!localValue) return null;
  // Date constructor parses "2026-05-08T19:30" as local time.
  const d = new Date(localValue);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
};

/** UTC ISO → "YYYY-MM-DDTHH:MM" suitable for <input type="datetime-local">
 * in the user's local tz. */
export const utcIsoToLocalInput = (iso: string | null | undefined): string => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  // toISOString gives UTC; we want local components.
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** Render an offset (signed minutes) in human form: "T-2d 09:00", "T+30m". */
export const formatOffset = (mins: number | null | undefined): string => {
  if (mins == null) return "—";
  const sign = mins < 0 ? "−" : mins > 0 ? "+" : "";
  const m = Math.abs(mins);
  const days = Math.floor(m / (60 * 24));
  const hrs = Math.floor((m % (60 * 24)) / 60);
  const min = m % 60;
  if (days > 0) {
    const hh = String(hrs).padStart(2, "0");
    const mm = String(min).padStart(2, "0");
    return `T${sign}${days}d ${hh}:${mm}`;
  }
  if (hrs > 0) return `T${sign}${hrs}h${min ? ` ${min}m` : ""}`;
  return `T${sign}${min}m`;
};

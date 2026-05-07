// Render a UTC timestamp in the user's tz with a red-marker
// highlight. Drop-in replacement anywhere we previously rendered
// `formatLocal(iso, tz)` or `formatLocalShort(...)`.

import { formatLocal, formatLocalShort } from "@/lib/time";

const fmtTimeOnly = (iso: string, tz?: string | null): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(undefined, {
    ...(tz ? { timeZone: tz } : {}),
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
};

export const DateTime = ({
  value,
  tz,
  short = false,
  timeOnly = false,
  className = "",
}: {
  value: string | null | undefined;
  tz?: string | null;
  short?: boolean;
  timeOnly?: boolean;
  className?: string;
}) => {
  if (!value) return <span className="text-muted-foreground">—</span>;
  const text = timeOnly
    ? fmtTimeOnly(value, tz)
    : short
      ? formatLocalShort(value, tz)
      : formatLocal(value, tz);
  return <span className={`dt ${className}`}>{text}</span>;
};

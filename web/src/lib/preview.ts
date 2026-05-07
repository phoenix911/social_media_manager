// Minimal per-platform preview rendering. Approximate, not pixel-perfect.

export const renderPreview = (
  platform: string | null,
  vals: { title?: string; body: string; subreddit?: string },
): string => {
  if (!platform) return "";
  switch (platform) {
    case "reddit":
      return [
        vals.subreddit ? `r/${vals.subreddit}` : "(no subreddit)",
        "",
        vals.title ? `▸ ${vals.title}` : "(no title)",
        "",
        vals.body,
      ].join("\n");
    case "linkedin":
      // LinkedIn doesn't render markdown. Strip + show as plain text.
      return vals.body.replace(/[*_`#>]/g, "").slice(0, 3000);
    case "twitter": {
      const segments = vals.body.split(/\n\n+/).map((s) => s.trim()).filter(Boolean);
      return segments
        .map((s, i) => `${i + 1}/  ${s}${s.length > 280 ? `  [⚠ ${s.length}/280]` : ""}`)
        .join("\n\n");
    }
    case "instagram":
      return [vals.body, "", "(media will appear above)"].join("\n");
    case "producthunt":
      return [
        "(Product Hunt — paste into the maker's first-comment box on launch day)",
        "",
        vals.body,
      ].join("\n");
    default:
      return vals.body;
  }
};

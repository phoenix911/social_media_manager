// Per-platform draft preview. Renders markdown to HTML for platforms
// that support it (Reddit), strips/transforms for those that don't
// (LinkedIn = plain text, Twitter = thread split, Instagram = caption).

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Platform } from "@smm/shared";

interface Props {
  platform: Platform | null;
  title: string;
  body: string;
  subreddit?: string;
}

export const Preview = ({ platform, title, body, subreddit }: Props) => {
  if (!platform) {
    return (
      <span className="text-muted-foreground">
        pick a platform / write something to preview
      </span>
    );
  }

  switch (platform) {
    case "reddit":
      return (
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">
            {subreddit ? <>r/{subreddit}</> : "(no subreddit set)"}
          </div>
          {title && <div className="text-base font-semibold">{title}</div>}
          <Md body={body} />
        </div>
      );
    case "linkedin":
      // LinkedIn doesn't render markdown — show plain text with markers
      // stripped, hashtags + URLs visually highlighted as a hint.
      return <PlainTextLike body={body} />;
    case "twitter": {
      const segments = body.split(/\n\n+/).map((s) => s.trim()).filter(Boolean);
      return (
        <div className="space-y-3">
          {segments.map((s, i) => {
            const over = s.length > 280;
            return (
              <div key={i} className="rounded-md border p-2 bg-background/60">
                <div className="text-[11px] text-muted-foreground mb-1">
                  {i + 1}/{segments.length} · {s.length}/280 {over && "⚠"}
                </div>
                <div className={over ? "text-destructive" : ""}>{s}</div>
              </div>
            );
          })}
        </div>
      );
    }
    case "instagram":
      return (
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground italic">
            (media will appear above the caption)
          </div>
          <PlainTextLike body={body} />
        </div>
      );
    case "producthunt":
      return (
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground italic">
            paste into the maker's first-comment box on launch day
          </div>
          <Md body={body} />
        </div>
      );
    default:
      return <Md body={body} />;
  }
};

// Minimal markdown styling — we don't pull in @tailwindcss/typography.
const Md = ({ body }: { body: string }) => (
  <div className="md text-sm leading-relaxed">
    <ReactMarkdown remarkPlugins={[remarkGfm]}>{body || "*nothing yet*"}</ReactMarkdown>
  </div>
);

const PlainTextLike = ({ body }: { body: string }) => {
  const stripped = body.replace(/[*_`#>]/g, "");
  return (
    <div className="whitespace-pre-wrap text-sm leading-relaxed">
      {stripped.split(/(\#\w+|https?:\/\/\S+)/g).map((part, i) =>
        /^#\w+$/.test(part) ? (
          <span key={i} className="text-blue-600 dark:text-blue-400">{part}</span>
        ) : /^https?:\/\//.test(part) ? (
          <span key={i} className="text-blue-600 dark:text-blue-400 underline">{part}</span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </div>
  );
};

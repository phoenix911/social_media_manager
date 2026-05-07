// Render mcp.md inside the app — same content as the file in the
// repo, served at /mcp so users can read/copy without leaving the app
// and without a session (the static asset doesn't go through
// requireUser).

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy, Check } from "lucide-react";

const Mcp = () => {
  const [md, setMd] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/mcp.md", { cache: "no-cache" })
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(`failed: ${r.status}`))))
      .then(setMd)
      .catch((e) => setErr(e.message));
  }, []);

  const copy = async () => {
    if (!md) return;
    try {
      await navigator.clipboard.writeText(md);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // fallback: select the rendered article so the user can ⌘C
      const range = document.createRange();
      const article = document.getElementById("mcp-article");
      if (article) {
        range.selectNodeContents(article);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b safe-top">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <a href="/" className="font-semibold tracking-tight">← back</a>
          <button
            onClick={copy}
            disabled={!md}
            className="inline-flex items-center gap-1.5 text-sm rounded-md border px-2.5 py-1 hover:bg-accent disabled:opacity-50"
            title="copy the whole document (paste into your LLM as context)"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "copied" : "copy all"}
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        {err && <p className="text-destructive">{err}</p>}
        {!md && !err && <p className="text-muted-foreground">loading…</p>}
        {md && (
          <article id="mcp-article" className="md">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{md}</ReactMarkdown>
          </article>
        )}
      </main>
    </div>
  );
};

export default Mcp;

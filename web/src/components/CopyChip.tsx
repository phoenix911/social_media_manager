// Click-to-copy chip — shows a value verbatim (truncated on small
// screens) with a copy icon that flashes a checkmark on success.

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export const CopyChip = ({ value }: { value: string }) => {
  const [copied, setCopied] = useState(false);

  const onClick = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Fallback: select the inline text so the user can ⌘C manually.
      const sel = window.getSelection();
      const range = document.createRange();
      const span = document.getElementById(`copy-${btoa(value).slice(0, 8)}`);
      if (sel && span) {
        range.selectNodeContents(span);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
  };

  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 max-w-full mt-1 px-2 py-1 rounded-md border bg-background hover:bg-accent text-xs font-mono"
      title={copied ? "copied!" : "click to copy"}
    >
      <span
        id={`copy-${btoa(value).slice(0, 8)}`}
        className="truncate"
      >
        {value}
      </span>
      {copied ? <Check size={12} className="text-green-600 shrink-0" /> : <Copy size={12} className="text-muted-foreground shrink-0" />}
    </button>
  );
};

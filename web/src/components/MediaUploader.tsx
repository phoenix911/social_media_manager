// Media upload + attached-media list for a draft.
//
// Flow:
//   1. user picks files (or drops)
//   2. for each file: POST /api/media/upload-url → { mediaId, uploadUrl }
//   3. PUT the binary to uploadUrl
//   4. POST /api/media/draft/<draftId>/<mediaId>  to attach
//   5. SWR refetches the attached list
//
// Inline thumbnails are <img> for image/* and <video> for video/*.
// Tap × to detach (and the underlying media row is soft-deleted to
// free R2).

import { useRef, useState } from "react";
import useSWR, { mutate } from "swr";
import type { Media } from "@smm/shared";
import { api, ApiCallError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";

interface AttachedItem {
  media: Media;
  position: number;
  caption: string | null;
}

export const MediaUploader = ({ draftId, projectId }: { draftId: string; projectId: string }) => {
  const key = `/api/media/draft/${draftId}`;
  const { data } = useSWR<{ items: AttachedItem[] }>(key);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const upload = async (files: FileList | File[]) => {
    setErr(null);
    setBusy(true);
    try {
      const arr = Array.from(files);
      for (const file of arr) {
        const { mediaId, uploadUrl } = await api<{ mediaId: string; uploadUrl: string }>(
          "/api/media/upload-url",
          {
            method: "POST",
            body: JSON.stringify({
              projectId,
              filename: file.name,
              mime: file.type || "application/octet-stream",
              bytes: file.size,
            }),
          },
        );
        // Stream the binary. Send as ArrayBuffer (not Blob) to dodge
        // browser/SW quirks that surface as "load failed" on PUT.
        const buf = await file.arrayBuffer();
        let put: Response;
        try {
          put = await fetch(uploadUrl, {
            method: "PUT",
            credentials: "include",
            headers: {
              "Content-Type": file.type || "application/octet-stream",
              ...(import.meta.env.DEV
                ? {
                    "Cf-Access-Jwt-Assertion": "dev",
                    "X-Dev-Email": localStorage.getItem("smm.devEmail") || "dev@local",
                  }
                : {}),
            },
            body: buf,
          });
        } catch (e) {
          throw new Error(`upload network error: ${(e as Error).message}`);
        }
        if (!put.ok) {
          const txt = await put.text().catch(() => "");
          throw new Error(`upload failed (${put.status}): ${txt.slice(0, 200)}`);
        }

        const nextPos = (data?.items?.length ?? 0);
        await api(`/api/media/draft/${draftId}/${mediaId}`, {
          method: "POST",
          body: JSON.stringify({ position: nextPos }),
        });
      }
      mutate(key);
    } catch (e) {
      setErr(e instanceof ApiCallError ? e.message : (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const detach = async (mediaId: string) => {
    if (!confirm("Remove this media from the draft?")) return;
    await api(`/api/media/draft/${draftId}/${mediaId}`, { method: "DELETE" });
    // Soft-delete the underlying media too — we don't share media across drafts yet.
    await api(`/api/media/${mediaId}`, { method: "DELETE" });
    mutate(key);
  };

  return (
    <div className="rounded-lg border p-3 space-y-2">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">media</div>

      {/* attached items */}
      {data?.items && data.items.length > 0 && (
        <ul className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {data.items.map((item) => (
            <li key={item.media.id} className="relative group">
              <MediaThumb media={item.media} />
              <button
                onClick={() => detach(item.media.id)}
                className="absolute top-1 right-1 bg-background/90 border rounded-full p-0.5 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                aria-label="remove"
              >
                <X size={12} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* drop / pick */}
      <div
        onDragEnter={(e) => { e.preventDefault(); setDrag(true); }}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          if (e.dataTransfer.files?.length) upload(e.dataTransfer.files);
        }}
        className={`rounded-md border-2 border-dashed p-4 text-center text-xs transition-colors ${
          drag ? "border-primary bg-accent/40" : "border-border"
        }`}
      >
        <Upload size={16} className="inline mr-1 align-text-bottom" />
        drag &amp; drop, or{" "}
        <button
          onClick={() => fileInput.current?.click()}
          className="text-primary underline"
          type="button"
        >
          pick files
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) upload(e.target.files);
            e.target.value = "";
          }}
        />
        <div className="text-[11px] text-muted-foreground mt-1">images + videos · up to 200 MB each</div>
      </div>

      {busy && <p className="text-xs text-muted-foreground">uploading…</p>}
      {err && <p className="text-xs text-destructive">{err}</p>}
    </div>
  );
};

const MediaThumb = ({ media }: { media: Media }) => {
  const src = `/api/media/${media.id}/blob`;
  const isVideo = media.mime?.startsWith("video/");
  return (
    <div className="aspect-square rounded-md overflow-hidden bg-muted">
      {isVideo ? (
        <video
          src={src}
          className="w-full h-full object-cover"
          muted
          playsInline
          preload="metadata"
        />
      ) : (
        <img src={src} alt={media.filename} className="w-full h-full object-cover" loading="lazy" />
      )}
    </div>
  );
};

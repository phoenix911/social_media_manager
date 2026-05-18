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

import { useEffect, useRef, useState } from "react";
import useSWR, { mutate } from "swr";
import type { Media, Platform } from "@smm/shared";
import { api, ApiCallError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Upload, X, AlertTriangle } from "lucide-react";
import { validateMedia } from "@/lib/mediaValidate";

interface AttachedItem {
  media: Media;
  position: number;
  caption: string | null;
}

interface RejectedFile {
  name: string;
  errors: string[];
  warnings: string[];
}

interface Props {
  draftId: string;
  projectId: string;
  platform?: Platform | null;
  postKind?: string | null;
}

export const MediaUploader = ({ draftId, projectId, platform = null, postKind = null }: Props) => {
  const key = `/api/media/draft/${draftId}`;
  const { data } = useSWR<{ items: AttachedItem[] }>(key);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const [rejected, setRejected] = useState<RejectedFile[]>([]);
  const [preview, setPreview] = useState<Media | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const upload = async (files: FileList | File[]) => {
    setErr(null);
    setRejected([]);
    const arr = Array.from(files);

    // Pre-flight: validate every file in parallel; only the OK ones move on.
    const validations = await Promise.all(
      arr.map(async (f) => ({ file: f, v: await validateMedia(f, { platform, postKind }) })),
    );
    const accepted = validations.filter((x) => x.v.ok).map((x) => x.file);
    const newlyRejected: RejectedFile[] = validations
      .filter((x) => !x.v.ok)
      .map((x) => ({ name: x.file.name, errors: x.v.errors, warnings: x.v.warnings }));
    if (newlyRejected.length > 0) setRejected(newlyRejected);
    if (accepted.length === 0) return;

    setBusy(true);
    try {
      for (const file of accepted) {
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
        // Stream the file directly. Sending the File (a Blob subclass)
        // lets the browser stream from disk; materialising via
        // file.arrayBuffer() first triggers iOS WebKit's RAM cap on
        // PWA fetch bodies and the request silently never goes out.
        // Cache-bust to rule out any stale SW route still alive in an
        // installed PWA shell.
        const bustedUrl = `${uploadUrl}${uploadUrl.includes("?") ? "&" : "?"}_=${Date.now()}`;
        let put: Response;
        try {
          put = await fetch(bustedUrl, {
            method: "PUT",
            credentials: "include",
            cache: "no-store",
            headers: {
              "Content-Type": file.type || "application/octet-stream",
              ...(import.meta.env.DEV
                ? {
                    "Cf-Access-Jwt-Assertion": "dev",
                    "X-Dev-Email": localStorage.getItem("smm.devEmail") || "dev@local",
                  }
                : {}),
            },
            body: file,
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
              <button
                type="button"
                onClick={() => setPreview(item.media)}
                className="block w-full focus:outline-none focus:ring-2 focus:ring-ring rounded-md"
                aria-label="preview"
              >
                <MediaThumb media={item.media} />
              </button>
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

      {preview && <MediaPreviewModal media={preview} onClose={() => setPreview(null)} />}

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
        <div className="text-[11px] text-muted-foreground mt-1">
          {platform === "instagram"
            ? postKind === "reel"
              ? "MP4/MOV · 9:16 · 1080×1920 · 3–90s · ≤100 MB"
              : postKind === "carousel"
                ? "2–10 slides · JPG/PNG (≤8 MB) or MP4 (≤100 MB) · 4:5 to 1.91:1"
                : postKind === "story"
                  ? "9:16 · JPG/PNG (≤8 MB) or MP4 (≤100 MB, ≤60s)"
                  : "JPG/PNG · 4:5 to 1.91:1 · 1080×1080 or 1080×1350 · ≤8 MB"
            : "images + videos · up to 200 MB each"}
        </div>
      </div>

      {busy && <p className="text-xs text-muted-foreground">uploading…</p>}
      {err && <p className="text-xs text-destructive">{err}</p>}

      {rejected.length > 0 && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-2 space-y-2">
          <div className="text-xs font-medium text-destructive inline-flex items-center gap-1">
            <AlertTriangle size={12} /> {rejected.length} file(s) didn't pass validation
          </div>
          <ul className="space-y-1.5">
            {rejected.map((r) => (
              <li key={r.name} className="text-xs">
                <div className="font-medium truncate">{r.name}</div>
                <ul className="list-disc list-inside text-destructive/90">
                  {r.errors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
                {r.warnings.length > 0 && (
                  <ul className="list-disc list-inside text-muted-foreground">
                    {r.warnings.map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                )}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => setRejected([])}
            className="text-[11px] text-muted-foreground underline"
          >
            dismiss
          </button>
        </div>
      )}
    </div>
  );
};

const MediaThumb = ({ media }: { media: Media }) => {
  const src = `/api/media/${media.id}/blob`;
  const isVideo = media.mime?.startsWith("video/");
  return (
    <div className="aspect-square rounded-md overflow-hidden bg-muted cursor-zoom-in">
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

// Full-size modal preview. ESC + click-outside both dismiss.
const MediaPreviewModal = ({ media, onClose }: { media: Media; onClose: () => void }) => {
  const src = `/api/media/${media.id}/blob`;
  const isVideo = media.mime?.startsWith("video/");
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative max-w-full max-h-full"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 bg-background border rounded-full p-1.5 shadow-md"
          aria-label="close"
        >
          <X size={16} />
        </button>
        {isVideo ? (
          <video
            src={src}
            controls
            autoPlay
            playsInline
            className="max-w-[90vw] max-h-[85vh] rounded-md bg-black"
          />
        ) : (
          <img
            src={src}
            alt={media.filename}
            className="max-w-[90vw] max-h-[85vh] rounded-md object-contain bg-black/40"
          />
        )}
        <div className="mt-2 text-xs text-white/80 text-center font-mono truncate max-w-[90vw]">
          {media.filename}
          {media.width && media.height ? ` · ${media.width}×${media.height}` : ""}
          {media.bytes ? ` · ${Math.round(media.bytes / 1024)} KB` : ""}
        </div>
      </div>
    </div>
  );
};

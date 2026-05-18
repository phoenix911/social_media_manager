// Client-side media validation before R2 upload.
//
// Cheap pre-flight that catches the obvious failures (wrong MIME,
// oversize, wrong aspect, sub-min-resolution, video too long) without
// burning a round-trip. Returns *every* error per file so the user can
// fix it in one pass — not "fix this, retry, get the next one".
//
// Limits track Meta's Instagram Graph API publishing constraints
// (cross-checked against developers.facebook.com docs, March 2026
// snapshot). When a constraint differs by postKind we branch.

import type { Platform } from "@smm/shared";

export interface ValidateContext {
  platform: Platform | null;
  postKind: string | null; // "reel" | "carousel" | "image" | …
}

export interface ValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
  /** Probed media facts (only populated when probing succeeded). */
  probed?: {
    width?: number;
    height?: number;
    durationSeconds?: number;
    aspect?: number;
  };
}

const MB = 1024 * 1024;

const IMAGE_MIMES = new Set(["image/jpeg", "image/jpg", "image/png"]);
const VIDEO_MIMES = new Set(["video/mp4", "video/quicktime"]);

// Per-postKind limits for Instagram. Source: Meta Graph API docs.
const IG_LIMITS = {
  image: {
    mimes: IMAGE_MIMES,
    maxBytes: 8 * MB,
    minWidth: 320,
    aspectMin: 0.8,   // 4:5
    aspectMax: 1.91,  // 1.91:1
    recommend: "1080×1080 or 1080×1350 (4:5)",
  },
  carousel: {
    // Carousel children can be image OR video. Validate per file; the
    // child set's 2–10 cap is enforced by the API server-side.
    mimesAny: new Set<string>([...IMAGE_MIMES, ...VIDEO_MIMES]),
    maxImageBytes: 8 * MB,
    maxVideoBytes: 100 * MB,
    minWidth: 320,
    aspectMin: 0.8,
    aspectMax: 1.91,
    videoDurationMaxS: 60,
    recommend: "all slides same aspect; 1080×1080 or 1080×1350",
  },
  reel: {
    mimes: VIDEO_MIMES,
    maxBytes: 100 * MB,
    minWidth: 540,
    minHeight: 960,
    aspectMin: 0.5,   // 9:16-ish floor
    aspectMax: 0.6,
    durationMinS: 3,
    durationMaxS: 90,
    recommend: "1080×1920 (9:16), 7–60s",
  },
  story: {
    mimesAny: new Set<string>([...IMAGE_MIMES, ...VIDEO_MIMES]),
    maxImageBytes: 8 * MB,
    maxVideoBytes: 100 * MB,
    aspectMin: 0.5,
    aspectMax: 0.6,
    videoDurationMaxS: 60,
    recommend: "1080×1920 (9:16)",
  },
} as const;

const probeImage = (file: File): Promise<{ width: number; height: number }> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const out = { width: img.naturalWidth, height: img.naturalHeight };
      URL.revokeObjectURL(url);
      resolve(out);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("could not decode image"));
    };
    img.src = url;
  });

const probeVideo = (
  file: File,
): Promise<{ width: number; height: number; durationSeconds: number }> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement("video");
    v.preload = "metadata";
    v.onloadedmetadata = () => {
      const out = {
        width: v.videoWidth,
        height: v.videoHeight,
        durationSeconds: Number.isFinite(v.duration) ? v.duration : 0,
      };
      URL.revokeObjectURL(url);
      resolve(out);
    };
    v.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("could not decode video"));
    };
    v.src = url;
  });

const humanBytes = (n: number) =>
  n >= MB ? `${(n / MB).toFixed(1)} MB` : `${(n / 1024).toFixed(0)} KB`;

export const validateMedia = async (
  file: File,
  ctx: ValidateContext,
): Promise<ValidationResult> => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const result: ValidationResult = { ok: false, errors, warnings };

  // Universal: at least *something* must be readable.
  if (file.size === 0) {
    errors.push("file is empty (0 bytes)");
    return result;
  }
  const mime = file.type || "";
  const isImage = mime.startsWith("image/");
  const isVideo = mime.startsWith("video/");
  if (!isImage && !isVideo) {
    errors.push(`unsupported file type "${mime || "unknown"}" — images and videos only`);
    return result;
  }

  // If we don't know the platform yet, fall back to broad limits.
  if (ctx.platform !== "instagram") {
    if (file.size > 200 * MB) errors.push(`file is ${humanBytes(file.size)}; max 200 MB`);
    if (isImage && !IMAGE_MIMES.has(mime)) warnings.push(`image type "${mime}" — JPG/PNG preferred`);
    if (isVideo && !VIDEO_MIMES.has(mime)) warnings.push(`video type "${mime}" — MP4 preferred`);
    result.ok = errors.length === 0;
    return result;
  }

  // ---- Instagram: branch by postKind ---------------------------------------
  const kind = (ctx.postKind ?? "image") as keyof typeof IG_LIMITS;
  const limits = IG_LIMITS[kind] ?? IG_LIMITS.image;

  // MIME / format
  if ("mimes" in limits && !limits.mimes.has(mime)) {
    errors.push(
      `${kind}: type "${mime}" not allowed — need ${Array.from(limits.mimes).join(" / ")}`,
    );
  }
  if ("mimesAny" in limits && !limits.mimesAny.has(mime)) {
    errors.push(`${kind}: type "${mime}" not allowed — need JPG/PNG/MP4/MOV`);
  }

  // Size
  if ("maxBytes" in limits && file.size > limits.maxBytes) {
    errors.push(`${kind}: ${humanBytes(file.size)} exceeds the ${humanBytes(limits.maxBytes)} cap`);
  }
  if ("maxImageBytes" in limits && isImage && file.size > limits.maxImageBytes) {
    errors.push(`${kind} image: ${humanBytes(file.size)} exceeds ${humanBytes(limits.maxImageBytes)}`);
  }
  if ("maxVideoBytes" in limits && isVideo && file.size > limits.maxVideoBytes) {
    errors.push(`${kind} video: ${humanBytes(file.size)} exceeds ${humanBytes(limits.maxVideoBytes)}`);
  }

  // Probe dimensions / duration. Best-effort — if the probe fails we skip
  // the dimensional checks but keep the size/mime errors we already
  // collected.
  try {
    if (isImage) {
      const { width, height } = await probeImage(file);
      const aspect = width / height;
      result.probed = { width, height, aspect };
      if ("minWidth" in limits && width < limits.minWidth) {
        errors.push(`${kind}: ${width}px wide — minimum ${limits.minWidth}px`);
      }
      if ("aspectMin" in limits && aspect < limits.aspectMin) {
        errors.push(`${kind}: aspect ${aspect.toFixed(2)} too tall — min ${limits.aspectMin} (4:5)`);
      }
      if ("aspectMax" in limits && aspect > limits.aspectMax) {
        errors.push(`${kind}: aspect ${aspect.toFixed(2)} too wide — max ${limits.aspectMax} (1.91:1)`);
      }
    } else if (isVideo) {
      const { width, height, durationSeconds } = await probeVideo(file);
      const aspect = height === 0 ? 0 : width / height;
      result.probed = { width, height, durationSeconds, aspect };
      if ("minWidth" in limits && width < limits.minWidth) {
        errors.push(`${kind}: video ${width}px wide — minimum ${limits.minWidth}px`);
      }
      if ("minHeight" in limits && height < limits.minHeight) {
        errors.push(`${kind}: video ${height}px tall — minimum ${limits.minHeight}px`);
      }
      if ("aspectMin" in limits && aspect < limits.aspectMin) {
        errors.push(
          `${kind}: aspect ${aspect.toFixed(2)} too tall — min ${limits.aspectMin} (9:16 expected)`,
        );
      }
      if ("aspectMax" in limits && aspect > limits.aspectMax) {
        errors.push(
          `${kind}: aspect ${aspect.toFixed(2)} too wide — max ${limits.aspectMax} (9:16 expected)`,
        );
      }
      if ("durationMinS" in limits && durationSeconds < limits.durationMinS) {
        errors.push(`${kind}: ${durationSeconds.toFixed(1)}s — minimum ${limits.durationMinS}s`);
      }
      if ("durationMaxS" in limits && durationSeconds > limits.durationMaxS) {
        errors.push(`${kind}: ${durationSeconds.toFixed(1)}s — maximum ${limits.durationMaxS}s`);
      }
      if ("videoDurationMaxS" in limits && durationSeconds > limits.videoDurationMaxS) {
        errors.push(`${kind}: ${durationSeconds.toFixed(1)}s — maximum ${limits.videoDurationMaxS}s`);
      }
    }
  } catch (e) {
    warnings.push(`could not probe ${isImage ? "image" : "video"}: ${(e as Error).message}`);
  }

  // Recommendation if anything failed
  if (errors.length > 0 && "recommend" in limits) {
    warnings.push(`recommended for ${kind}: ${limits.recommend}`);
  }

  result.ok = errors.length === 0;
  return result;
};

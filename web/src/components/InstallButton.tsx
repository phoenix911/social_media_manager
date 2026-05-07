import { Download, Check } from "lucide-react";
import { useInstallStore, triggerInstall } from "@/store/installStore";

export const InstallButton = () => {
  const { deferred, installed } = useInstallStore();

  // Already installed — show a static badge so users know they're using the app.
  if (installed) {
    return (
      <span
        className="hidden sm:inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
        title="running as installed app"
      >
        <Check size={11} /> installed
      </span>
    );
  }

  // No prompt available (Safari, Firefox, etc.) — hide button on desktop, show iOS hint on mobile.
  if (!deferred) {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (!isIOS) return null;
    return (
      <button
        onClick={() =>
          alert("To install: tap Share, then 'Add to Home Screen'.")
        }
        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs hover:bg-accent text-muted-foreground hover:text-foreground"
        aria-label="install app"
      >
        <Download size={14} /> install
      </button>
    );
  }

  return (
    <button
      onClick={() => triggerInstall()}
      className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs hover:bg-accent text-muted-foreground hover:text-foreground"
      aria-label="install app"
    >
      <Download size={14} /> install
    </button>
  );
};

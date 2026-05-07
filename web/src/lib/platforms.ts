// Per-platform UI metadata: human label, brand color hint, and
// step-by-step setup help shown inline when adding a channel.

import type { Platform } from "@smm/shared";

export interface SetupStep {
  text: string;
  link?: { url: string; label?: string };
  /** Surfaces a click-to-copy button. Use for redirect URIs and other
   * constants the user must paste verbatim into the third-party portal. */
  copy?: string;
}

export interface PlatformMeta {
  id: Platform;
  name: string;
  description: string;
  color: string;
  setup: SetupStep[];
  fullDocUrl?: string;
  oauth: "recommended" | "manual_only";
}

const REDIRECT = (platform: Platform) => `https://smm.example.com/api/oauth/${platform}/callback`;

export const PLATFORMS_META: PlatformMeta[] = [
  {
    id: "reddit",
    name: "Reddit",
    description: "post / comment via OAuth (web app)",
    color: "#FF4500",
    oauth: "recommended",
    setup: [
      { text: "Read Reddit's Responsible Builder Policy.", link: { url: "https://support.reddithelp.com/hc/en-us/articles/42728983564564-Responsible-Builder-Policy" } },
      { text: "Open the Reddit apps page.", link: { url: "https://www.reddit.com/prefs/apps" } },
      { text: "Click 'create another app' and pick type 'web app'." },
      { text: "Set the redirect URI to:", copy: REDIRECT("reddit") },
      { text: "Copy client_id and secret into Worker secrets (REDDIT_CLIENT_ID/SECRET) + REDDIT_USERNAME_FOR_UA." },
      { text: "Click 'Connect via OAuth' below." },
    ],
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    description: "personal posting + native drafts",
    color: "#0A66C2",
    oauth: "recommended",
    setup: [
      { text: "Open the LinkedIn developer portal.", link: { url: "https://www.linkedin.com/developers/apps" } },
      { text: "Click 'Create app' (associate with a Company Page — required even for personal use)." },
      { text: "Auth tab → add redirect URL:", copy: REDIRECT("linkedin") },
      { text: "Products tab → request 'Sign In with LinkedIn (OIDC)' + 'Share on LinkedIn' (instant approval)." },
      { text: "Copy client_id and secret into Worker secrets (LINKEDIN_CLIENT_ID/SECRET)." },
      { text: "Click 'Connect via OAuth' below." },
    ],
  },
  {
    id: "twitter",
    name: "Twitter / X",
    description: "tweets + threads (OAuth 2.0 PKCE)",
    color: "#000000",
    oauth: "recommended",
    setup: [
      { text: "Open the X developer portal.", link: { url: "https://developer.twitter.com/en/portal/dashboard" } },
      { text: "Create Project + App → user authentication: Read and Write, Web App." },
      { text: "Callback URI:", copy: REDIRECT("twitter") },
      { text: "Copy OAuth 2.0 Client ID + Secret to Worker secrets (TWITTER_OAUTH2_CLIENT_ID/SECRET)." },
      { text: "(For media later) also copy OAuth 1.0a Consumer Key / Secret." },
      { text: "Click 'Connect via OAuth' below." },
    ],
  },
  {
    id: "instagram",
    name: "Instagram",
    description: "Business / Creator accounts only",
    color: "#E4405F",
    oauth: "recommended",
    setup: [
      { text: "Open the Meta developer apps page.", link: { url: "https://developers.facebook.com/apps" } },
      { text: "Create app → 'Other' → 'Business'. Add product: 'Instagram API with Instagram Login'." },
      { text: "App settings → Basic: fill app domain, privacy URL, ToS URL." },
      { text: "Add OAuth redirect:", copy: REDIRECT("instagram") },
      { text: "Copy App ID + Secret to Worker secrets (META_APP_ID/SECRET)." },
      { text: "Submit app review for instagram_business_basic + instagram_business_content_publish (1–4 weeks)." },
      { text: "Connect via OAuth — IG account must be Business or Creator." },
    ],
  },
  {
    id: "producthunt",
    name: "Product Hunt",
    description: "OAuth + comments; launches stay manual",
    color: "#DA552F",
    oauth: "recommended",
    setup: [
      { text: "Open Product Hunt OAuth applications page.", link: { url: "https://www.producthunt.com/v2/oauth/applications" } },
      { text: "Click 'Add an application'." },
      { text: "Redirect URI:", copy: REDIRECT("producthunt") },
      { text: "Copy API Key + Secret to Worker secrets (PRODUCTHUNT_CLIENT_ID/SECRET)." },
      { text: "Click 'Connect via OAuth' — viewer query confirms your handle." },
    ],
  },
];

export const platformMeta = (id: Platform): PlatformMeta | undefined =>
  PLATFORMS_META.find((p) => p.id === id);

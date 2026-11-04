// Site-wide settings. Edit these, not the components.

export const SITE_URL = (process.env.SITE_URL || "https://altusmountainguides.com").replace(/\/$/, "");

// Show "Draft · verify" notes and the Chief line-tracing tool (turn on for preview deployments only).
export const BUILD_NOTES = process.env.NEXT_PUBLIC_BUILD_NOTES === "1";

// Keep the whole site out of Google until launch day. Set SITE_NOINDEX=0 in Vercel to go live.
export const SITE_NOINDEX = process.env.SITE_NOINDEX !== "0";

// Only routes with these statuses are indexed by Google. Others still build (for review) but get noindex.
export const INDEXABLE_STATUSES = ["LIVE"];

// Main-site links in the header and footer. Confirm these match altusmountainguides.com.
export const MAIN = "https://altusmountainguides.com";
export const NAV = [
  { label: "Ski", href: `${MAIN}/ski-courses-trips` },
  { label: "Climb", href: `${MAIN}/climbing` },
  { label: "Mountain", href: `${MAIN}/mountaineering` },
  { label: "Routes", href: "/routes", on: true },
];
export const BOOK_URL = `${MAIN}/book-now`;

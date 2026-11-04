// Server-only data loading. Everything comes from /data (written by `npm run sync` from the Google Sheet).
import fs from "node:fs";
import path from "node:path";
import ZONES_RAW from "../data/zones.json";
import ROUTES_RAW from "../data/routes.json";
import REPORTS from "../data/reports.json";
import TRACKS from "../data/tracks.json";
import CRAG from "../data/crag-chief.json";

const PHOTO_DIR = path.join(process.cwd(), "public", "photos");
const SHOTS = ["hero", "start", "crux", "payoff", "detail"];

// Photos: drop files named {slug}-hero.jpg, {slug}-crux.jpg ... into public/photos and they appear automatically.
function photosFor(slug) {
  const out = {};
  for (const s of SHOTS) {
    for (const ext of ["jpg", "jpeg", "webp", "png"]) {
      if (fs.existsSync(path.join(PHOTO_DIR, `${slug}-${s}.${ext}`))) { out[s] = `/photos/${slug}-${s}.${ext}`; break; }
    }
  }
  return out;
}

export const ZONES = [...ZONES_RAW].sort((a, b) => a.order - b.order);
export const zoneBy = Object.fromEntries(ZONES.map((z) => [z.slug, z]));

export const ROUTES = ROUTES_RAW.filter((r) => r.slug && zoneBy[r.zone]).map((r) => ({
  ...r,
  lat: Number(r.lat),
  lng: Number(r.lng),
  products: Array.isArray(r.products) ? r.products : [],
  photos: photosFor(r.slug),
  tracks: TRACKS[r.slug]?.lines || null,
  reportCount: REPORTS.filter((x) => x.route === r.slug).length,
}));
export const routeBy = Object.fromEntries(ROUTES.map((r) => [r.slug, r]));

export const reportsFor = (slug) =>
  REPORTS.filter((x) => x.route === slug).sort((a, b) => b.date.localeCompare(a.date));

export { CRAG };
export const routeForCragLine = (slug) => CRAG.lines.find((l) => l.route === slug);

// Light route objects for client components (keeps page payload small).
export const lite = (r) => ({
  slug: r.slug, name: r.name, zone: r.zone, discipline: r.discipline, level: r.level, grade: r.grade,
  gain_m: r.gain_m, terrain: r.terrain, aspect: r.aspect, summary: r.summary, lat: r.lat, lng: r.lng,
  hero: r.photos.hero || null, reportCount: r.reportCount,
});
export const liteZone = (z) => ({ slug: z.slug, name: z.name, blurb: z.blurb, polygon: z.polygon });

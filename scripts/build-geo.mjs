// Turns the route map files in data/geo/ into data/geometry.json for the site.
//
// Drop files in data/geo/ named by the route's slug (the slug column in the Sheet):
//   squamish-buttress.gpx            a climb or run: its track becomes a line
//   spearhead-traverse.kmz           KMZ/KML from Gaia: tracks become lines, areas (polygons) become zones
//   tantalus-ski-mountaineering.kmz  a ski area: draw the polygon, and add the named ski lines inside it if you like
//   anything.geojson                 GeoJSON also works
// Extra files for the same route: add a suffix after two dashes, e.g. wedge-mountain-nw-couloir--area.kml
// A whole ski zone's lines (not tied to one route page): zone--whistler.kmz, zone--pemberton.kmz (zone slugs from zones.json)
// Not ski? add the discipline: zone--garibaldi--run.gpx
//
// Multi-day routes: name the tracks "Day 1 - ...", "Day 2 - ..." and they're listed in day order with their distance.
// Lines with no name, a Gaia default name ("... Track 12", "Untitled Path", a date) or a name with "TBD" or "?" stay off the public map
// until they're given a proper name. Named points (huts, camps) show as hut markers; Gaia's (Start)/(End) points are ignored.
import fs from "node:fs";
import path from "node:path";
import JSZip from "jszip";
import { DOMParser } from "@xmldom/xmldom";
import { kml, gpx } from "@tmcw/togeojson";

const DIR = "data/geo";
const routes = JSON.parse(fs.readFileSync("data/routes.json", "utf8"));
const slugs = new Set(routes.map((r) => r.slug));
const discOf = Object.fromEntries(routes.map((r) => [r.slug, r.discipline]));
const zoneOf = Object.fromEntries(routes.map((r) => [r.slug, r.zone]));
const zoneSlugs = new Set(JSON.parse(fs.readFileSync("data/zones.json", "utf8")).map((z) => z.slug));
const isDraft = (n) => !n || /track \d+|untitled|\btbd\b|\?|\d{1,2}\/\d{1,2}\/\d{2}|^track \(/i.test(n);
// Waypoints that aren't places: Gaia's (Start)/(End), photo pins and bare numbers.
const skipPoint = (n) => !n || /^\((start|end)\)$/i.test(n) || /^my photo/i.test(n) || /^\d+$/.test(n);
// Line length in km (for stage lists like "Day 3 · 13.6 km").
function km(c) {
  let d = 0;
  for (let i = 1; i < c.length; i++) {
    const [x1, y1] = c[i - 1], [x2, y2] = c[i], r = Math.PI / 180;
    const a = Math.sin(((y2 - y1) * r) / 2) ** 2 + Math.cos(y1 * r) * Math.cos(y2 * r) * Math.sin(((x2 - x1) * r) / 2) ** 2;
    d += 12742 * Math.asin(Math.sqrt(a));
  }
  return +d.toFixed(1);
}
// "Day 2 - ..." before "Day 10 - ...", everything else keeps file order.
const dayNum = (n) => { const m = /^day\s*(\d+)/i.exec(n || ""); return m ? +m[1] : null; };
const drafts = {};
const out = [];
// Thin out GPS points (about 8 m tolerance) so pages stay light.
function simplify(pts, tol = 0.00008) {
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop(); let idx = -1, max = 0;
    const [ax, ay] = pts[a], [bx, by] = pts[b], dx = bx - ax, dy = (by - ay), len = dx * dx + dy * dy || 1e-12;
    for (let i = a + 1; i < b; i++) {
      const t = Math.max(0, Math.min(1, ((pts[i][0] - ax) * dx + (pts[i][1] - ay) * dy) / len));
      const ex = ax + t * dx - pts[i][0], ey = ay + t * dy - pts[i][1], d = ex * ex + ey * ey;
      if (d > max) { max = d; idx = i; }
    }
    if (idx > 0 && max > tol * tol) { keep[idx] = 1; stack.push([a, idx], [idx, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}
const round = (c) => (typeof c[0] === "number" ? [+c[0].toFixed(5), +c[1].toFixed(5)] : c.map(round));

async function read(file) {
  const ext = path.extname(file).toLowerCase();
  const buf = fs.readFileSync(path.join(DIR, file));
  if (ext === ".geojson" || ext === ".json") return JSON.parse(buf.toString("utf8"));
  let text = buf.toString("utf8");
  if (ext === ".kmz") { const zip = await JSZip.loadAsync(buf); const k = Object.keys(zip.files).find((n) => n.toLowerCase().endsWith(".kml")); text = await zip.files[k].async("string"); }
  const doc = new DOMParser().parseFromString(text, "text/xml");
  return ext === ".gpx" ? gpx(doc) : kml(doc);
}

function flatten(f) {
  const g = f.geometry; if (!g) return [];
  if (g.type === "GeometryCollection") return g.geometries.flatMap((x) => flatten({ ...f, geometry: x }));
  if (g.type === "MultiLineString") return g.coordinates.map((c) => ({ ...f, geometry: { type: "LineString", coordinates: c } }));
  if (g.type === "MultiPolygon") return g.coordinates.map((c) => ({ ...f, geometry: { type: "Polygon", coordinates: c } }));
  return [f];
}

const files = fs.existsSync(DIR) ? fs.readdirSync(DIR).filter((f) => /\.(kmz|kml|gpx|geojson|json)$/i.test(f)) : [];
for (const file of files) {
  const parts = path.basename(file).replace(/\.[^.]+$/, "").split("--");
  const zoneFile = parts[0] === "zone";
  const slug = zoneFile ? null : parts[0];
  const zone = zoneFile ? parts[1] : zoneOf[slug];
  if (zoneFile ? !zoneSlugs.has(zone) : !slugs.has(slug)) { console.warn(`build-geo: ${file} skipped, no ${zoneFile ? "zone" : "route"} called "${zoneFile ? zone : slug}"`); continue; }
  const discipline = slug ? discOf[slug] : (["ski", "rock", "alpine", "run"].includes(parts[2]) ? parts[2] : "ski");
  try {
    const fc = await read(file);
    let n = 0;
    const feats = (fc.features || []).flatMap(flatten);
    if (feats.some((f) => dayNum(f.properties?.name) != null)) feats.sort((a, b) => (dayNum(a.properties?.name) ?? 999) - (dayNum(b.properties?.name) ?? 999));
    for (const f of feats) {
      const t = f.geometry.type;
      const nm = (f.properties?.name || "").trim();
      if (t === "Point") {
        if (skipPoint(nm)) continue;
        out.push({ type: "Feature", properties: { slug, zone, discipline, kind: "hut", name: nm, n: 0 }, geometry: { type: "Point", coordinates: round(f.geometry.coordinates.slice(0, 2)) } });
        continue;
      }
      if (t !== "LineString" && t !== "Polygon") continue;
      if (t === "LineString" && isDraft(nm)) { (drafts[file] = drafts[file] || []).push(nm || "(no name)"); continue; }
      // Gaia draws areas as closed tracks sometimes; a closed line tagged "area" in its name becomes a zone.
      const name = (f.properties?.name || "").trim();
      const len = t === "LineString" ? km(f.geometry.coordinates) : 0;
      let geometry = { type: t, coordinates: round(f.geometry.coordinates.map ? f.geometry.coordinates : []) };
      if (t === "LineString") geometry.coordinates = simplify(geometry.coordinates.map((c) => c.slice(0, 2)));
      if (t === "Polygon") geometry.coordinates = geometry.coordinates.map((r) => r.map((c) => c.slice(0, 2)));
      out.push({ type: "Feature", properties: { slug, zone, discipline, kind: t === "Polygon" ? "area" : "line", name, n: t === "LineString" ? ++n : 0, ...(len ? { km: len } : {}) }, geometry });
    }
  } catch (e) { console.warn(`build-geo: could not read ${file}: ${e.message}`); }
}
fs.writeFileSync("data/geometry.json", JSON.stringify({ type: "FeatureCollection", features: out }));
const by = {}; out.forEach((f) => { const k = f.properties.slug || "zone:" + f.properties.zone; by[k] = by[k] || { line: 0, area: 0, hut: 0 }; by[k][f.properties.kind]++; });
for (const [file, list] of Object.entries(drafts)) console.log(`build-geo: ${file}: ${list.length} unnamed/draft lines kept off the map (${[...new Set(list)].slice(0, 6).join(", ")}${list.length > 6 ? ", ..." : ""})`);
console.log(`build-geo: ${out.length} shapes for ${Object.keys(by).length} routes`, JSON.stringify(by));

// Turns the route map files in data/geo/ into data/geometry.json for the site.
//
// Drop files in data/geo/ named by the route's slug (the slug column in the Sheet):
//   squamish-buttress.gpx            a climb or run: its track becomes a line
//   spearhead-traverse.kmz           KMZ/KML from Gaia: tracks become lines, areas (polygons) become zones
//   tantalus-ski-mountaineering.kmz  a ski area: draw the polygon, and add the named ski lines inside it if you like
//   anything.geojson                 GeoJSON also works
// Extra files for the same route: add a suffix after two dashes, e.g. wedge-mountain-nw-couloir--area.kml
import fs from "node:fs";
import path from "node:path";
import JSZip from "jszip";
import { DOMParser } from "@xmldom/xmldom";
import { kml, gpx } from "@tmcw/togeojson";

const DIR = "data/geo";
const slugs = new Set(JSON.parse(fs.readFileSync("data/routes.json", "utf8")).map((r) => r.slug));
const out = [];
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
  const slug = path.basename(file).replace(/\.[^.]+$/, "").split("--")[0];
  if (!slugs.has(slug)) { console.warn(`build-geo: ${file} skipped, no route with slug "${slug}"`); continue; }
  try {
    const fc = await read(file);
    let n = 0;
    for (const f of (fc.features || []).flatMap(flatten)) {
      const t = f.geometry.type;
      if (t !== "LineString" && t !== "Polygon") continue;
      // Gaia draws areas as closed tracks sometimes; a closed line tagged "area" in its name becomes a zone.
      const name = (f.properties?.name || "").trim();
      let geometry = { type: t, coordinates: round(f.geometry.coordinates.map ? f.geometry.coordinates : []) };
      if (t === "LineString") geometry.coordinates = geometry.coordinates.map((c) => c.slice(0, 2));
      if (t === "Polygon") geometry.coordinates = geometry.coordinates.map((r) => r.map((c) => c.slice(0, 2)));
      out.push({ type: "Feature", properties: { slug, kind: t === "Polygon" ? "area" : "line", name, n: t === "LineString" ? ++n : 0 }, geometry });
    }
  } catch (e) { console.warn(`build-geo: could not read ${file}: ${e.message}`); }
}
fs.writeFileSync("data/geometry.json", JSON.stringify({ type: "FeatureCollection", features: out }));
const by = {}; out.forEach((f) => { by[f.properties.slug] = by[f.properties.slug] || { line: 0, area: 0 }; by[f.properties.slug][f.properties.kind]++; });
console.log(`build-geo: ${out.length} shapes for ${Object.keys(by).length} routes`, JSON.stringify(by));

// Schematic Sea to Sky map, built as an SVG string (works on the server and in the browser).
import { DISC } from "./shared";

const B = { n: 50.52, s: 49.28, w: -123.48, e: -122.22 };
const K = Math.cos((49.9 * Math.PI) / 180);
const W = 500;
const H = Math.round(W * ((B.n - B.s) / ((B.e - B.w) * K)));
const px = (lat, lng) => [((lng - B.w) / (B.e - B.w)) * W, ((B.n - lat) / (B.n - B.s)) * H];
const pts = (a) => a.map(([la, ln]) => px(la, ln).map((v) => v.toFixed(1)).join(",")).join(" ");
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const WATER = [[49.28,-123.48],[49.28,-123.30],[49.36,-123.28],[49.45,-123.25],[49.56,-123.245],[49.64,-123.21],[49.695,-123.165],[49.67,-123.23],[49.60,-123.30],[49.52,-123.36],[49.45,-123.42],[49.40,-123.48]];
const BURRARD = [[49.28,-123.30],[49.30,-123.15],[49.295,-123.0],[49.28,-122.95]];
const HWY = [[49.31,-123.14],[49.35,-123.20],[49.375,-123.27],[49.47,-123.255],[49.56,-123.237],[49.62,-123.205],[49.70,-123.155],[49.78,-123.14],[49.90,-123.15],[49.95,-123.13],[50.06,-123.03],[50.116,-122.955],[50.20,-122.90],[50.32,-122.80],[50.31,-122.71],[50.36,-122.55],[50.40,-122.42],[50.45,-122.28]];
const TOWNS = [["Vancouver",49.30,-123.12],["Squamish",49.70,-123.155],["Whistler",50.116,-122.955],["Pemberton",50.32,-122.80],["Duffey Lake",50.385,-122.37]];
const LAKES = [[49.93,-123.035,0.018,0.03]];

/**
 * zones, routes: arrays. activeZone: slug or null. visible: Set of slugs that match filters (null = all).
 * focus: a single route (mini map). tracks: line array to draw (run map).
 */
export function mapSVG({ zones, routes = [], activeZone = null, visible = null, focus = null, mini = false, tracks = null, className }) {
  let vb = [0, 0, W, H];
  const z = activeZone ? zones.find((x) => x.slug === activeZone) : null;
  if (z || focus) {
    const ps = z ? z.polygon.map((p) => px(...p)) : tracks ? tracks.flatMap((l) => l.coords.map((p) => px(...p))) : [px(focus.lat, focus.lng)];
    let x0 = Math.min(...ps.map((p) => p[0])), x1 = Math.max(...ps.map((p) => p[0]));
    let y0 = Math.min(...ps.map((p) => p[1])), y1 = Math.max(...ps.map((p) => p[1]));
    const pad = z ? 30 : tracks ? 4 : 70;
    x0 -= pad; x1 += pad; y0 -= pad; y1 += pad;
    const ar = tracks ? 4 / 3 : W / H, w = x1 - x0, h = y1 - y0;
    if (w / h > ar) { const nh = w / ar; y0 -= (nh - h) / 2; vb = [x0, y0, w, nh]; }
    else { const nw = h * ar; x0 -= (nw - w) / 2; vb = [x0, y0, nw, h]; }
  }
  const s = tracks ? (vb[2] / W) * 1.25 : vb[2] / W;

  const zoneEls = zones.map((zz) => {
    const c = zz.polygon.map((p) => px(...p));
    const cx = c.reduce((a, p) => a + p[0], 0) / c.length, cy = c.reduce((a, p) => a + p[1], 0) / c.length;
    const cls = "zone" + (activeZone === zz.slug ? " on" : "") + (activeZone && activeZone !== zz.slug ? " dim" : "");
    return `<polygon class="${cls}" data-zone="${zz.slug}" points="${pts(zz.polygon)}"><title>${esc(zz.name)}</title></polygon>` +
      (mini ? "" : `<text class="zlabel" x="${cx.toFixed(1)}" y="${cy.toFixed(1)}" font-size="${(11 * s).toFixed(1)}" text-anchor="middle">${esc(zz.name.split(" &")[0])}</text>`);
  }).join("");
  const lakes = LAKES.map(([la, ln, a, b]) => { const [x, y] = px(la, ln); return `<ellipse class="water" cx="${x}" cy="${y}" rx="${((b / (B.e - B.w)) * W).toFixed(1)}" ry="${((a / (B.n - B.s)) * H).toFixed(1)}"/>`; }).join("");
  const towns = TOWNS.map(([n, la, ln]) => { const [x, y] = px(la, ln); return `<rect class="town" x="${x - 3 * s}" y="${y - 3 * s}" width="${6 * s}" height="${6 * s}"/><text class="tlabel" x="${x + 7 * s}" y="${y + 4 * s}" font-size="${(10 * s).toFixed(1)}">${n}</text>`; }).join("");

  const list = tracks ? [] : focus ? [focus] : [...routes].sort((a, b) => (visible ? (visible.has(a.slug) ? 1 : 0) - (visible.has(b.slug) ? 1 : 0) : 0));
  const tr = tracks ? tracks.map((l, i) => {
    const p = l.coords.map((c) => px(...c)); const [sx, sy] = p[0]; const col = `var(${DISC[focus.discipline].c})`;
    return `<g class="line" data-line="${i}"><polyline points="${p.map((q) => q.map((v) => v.toFixed(2)).join(",")).join(" ")}" style="fill:none;stroke:${col};stroke-width:${(2.2 * s).toFixed(3)};stroke-linecap:round;stroke-linejoin:round"/><circle cx="${sx.toFixed(2)}" cy="${sy.toFixed(2)}" r="${(5 * s).toFixed(3)}" fill="var(--surface)" stroke="${col}" stroke-width="${(1.2 * s).toFixed(3)}"/><text x="${sx.toFixed(2)}" y="${(sy + 2.4 * s).toFixed(2)}" font-size="${(6.5 * s).toFixed(3)}" text-anchor="middle" class="lnum">${i + 1}</text><title>${esc(l.name)}</title></g>`;
  }).join("") : "";
  const pins = list.map((r) => {
    const [x, y] = px(r.lat, r.lng); const on = focus || !visible || visible.has(r.slug);
    return `<circle class="pin${on ? "" : " dim"}" data-route="${r.slug}" data-zone-of="${r.zone}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${((focus ? 16 : 5.5) * s).toFixed(2)}" fill="var(${DISC[r.discipline].c})" stroke-width="${(1.5 * s).toFixed(2)}"><title>${esc(r.name)}</title></circle>`;
  }).join("");

  return `<svg class="${className || (mini ? "minimap" : "map")}" viewBox="${vb.map((v) => v.toFixed(1)).join(" ")}" role="img" aria-label="Schematic map of the Sea to Sky corridor with route zones and pins" preserveAspectRatio="xMidYMid meet">
    <rect x="${-W}" y="${-H}" width="${W * 3}" height="${H * 3}" fill="var(--land)"/>
    <polygon class="water" points="${pts(WATER)}"/><polyline class="water" points="${pts(BURRARD)}" style="fill:none;stroke:var(--water);stroke-width:${6 * s}"/>${lakes}
    ${tracks ? "" : zoneEls}
    ${tracks ? "" : `<polyline class="hwy" points="${pts(HWY)}" style="stroke-width:${(2 * s).toFixed(2)}"/>${towns}`}
    ${tr}${pins}
  </svg>`;
}

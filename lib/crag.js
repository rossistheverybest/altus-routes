// Crag view: the photo with climbing lines drawn on top. Points are stored 0–1 across and down the photo.
import { LINE_COLOURS } from "./shared";

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

export function cragSVG(crag, { focus = null, edit = false } = {}) {
  const VW = 1000, VH = Math.round(1000 / (crag.w / crag.h));
  const lines = crag.lines.map((l) => {
    const p = l.pts.map(([x, y]) => [x * VW, y * VH]); if (!p.length) return "";
    const c = LINE_COLOURS[(l.n - 1) % LINE_COLOURS.length]; const dim = focus && l.route !== focus ? " dim" : "";
    const end = p[p.length - 1]; const ptsStr = p.map((q) => q.map((v) => v.toFixed(1)).join(",")).join(" ");
    return `<g class="cline${dim}" data-cline="${l.n}" data-route="${l.route || ""}"><polyline points="${ptsStr}" class="casing"/><polyline points="${ptsStr}" style="stroke:${c}"/>
      <circle cx="${end[0].toFixed(1)}" cy="${end[1].toFixed(1)}" r="13" style="fill:${c}"/><text x="${end[0].toFixed(1)}" y="${(end[1] + 5).toFixed(1)}" text-anchor="middle">${l.n}</text>
      ${edit ? p.map((q) => `<circle class="vtx" cx="${q[0].toFixed(1)}" cy="${q[1].toFixed(1)}" r="4" style="fill:${c}"/>`).join("") : ""}<title>${esc(l.label)}</title></g>`;
  }).join("");
  return { VW, VH, svg: `<svg viewBox="0 0 ${VW} ${VH}">${lines}</svg>` };
}

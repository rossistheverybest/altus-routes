// Client-safe constants and helpers (no Node imports here).

export const DISC = {
  ski: { label: "Ski", c: "--ski", kind: "Ski touring" },
  rock: { label: "Rock", c: "--rock", kind: "Climbing" },
  alpine: { label: "Alpine", c: "--alpine", kind: "Alpine" },
  run: { label: "Run", c: "--run", kind: "Trail run" },
};
export const LEVELS = ["Intro", "Intermediate", "Advanced", "Expert"];

export const routeHref = (r) => `/routes/${r.zone}/${r.slug}`;
export const zoneHref = (z) => `/routes/${typeof z === "string" ? z : z.slug}`;

const NUMERIC = /^[~≈\d,.–\s-]+$/;
export const unit = (v, u) => (!v ? "" : NUMERIC.test(String(v)) ? `${v} ${u}` : String(v));

export function cardStats(r) {
  const first =
    r.discipline === "ski"
      ? NUMERIC.test(r.gain_m || "x") ? `${r.gain_m} m` : (r.terrain || "").split(",")[0]
      : r.grade;
  return [first, r.aspect, r.level].filter(Boolean).join(" · ");
}

export const cut = (s, n) =>
  s && s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, "") + "…" : s || "";

export const LINE_COLOURS = ["#F4C430", "#3FB6E8", "#F2694B", "#8BD36A", "#C58BF0", "#FF9F1C", "#5EE0C1", "#FF6FA8"];

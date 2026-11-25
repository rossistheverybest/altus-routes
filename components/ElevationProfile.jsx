// Elevation profile drawn from the route's GPS track (data/geometry.json "prof": [km, elevation] pairs).
export default function ElevationProfile({ prof, label = "Elevation profile" }) {
  if (!prof || prof.length < 2) return null;
  const W = 640, H = 180, P = { l: 44, r: 10, t: 12, b: 26 };
  const km = prof[prof.length - 1][0] || 1;
  const eles = prof.map((p) => p[1]); const lo = Math.min(...eles), hi = Math.max(...eles);
  const span = Math.max(50, hi - lo), floor = lo - span * 0.08, top = hi + span * 0.08;
  const x = (k) => P.l + (k / km) * (W - P.l - P.r), y = (e) => P.t + (1 - (e - floor) / (top - floor)) * (H - P.t - P.b);
  const line = prof.map(([k, e]) => `${x(k).toFixed(1)},${y(e).toFixed(1)}`).join(" ");
  const ticks = [lo, Math.round((lo + hi) / 2), hi];
  return (
    <figure className="eprof">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${label}: ${km.toFixed(1)} km, from ${lo} m to ${hi} m`}>
        {ticks.map((t) => <g key={t}><line x1={P.l} x2={W - P.r} y1={y(t)} y2={y(t)} className="egrid" /><text x={P.l - 6} y={y(t) + 4} textAnchor="end" className="elab">{t} m</text></g>)}
        <polygon points={`${x(0)},${H - P.b} ${line} ${x(km)},${H - P.b}`} className="earea" />
        <polyline points={line} className="eline" />
        <text x={P.l} y={H - 6} className="elab">0 km</text>
        <text x={W - P.r} y={H - 6} textAnchor="end" className="elab">{km.toFixed(1)} km</text>
      </svg>
      <figcaption><span>{label}</span><span>{km.toFixed(1)} km · low {lo} m · high {hi} m</span></figcaption>
    </figure>
  );
}

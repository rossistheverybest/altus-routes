// Route profile radar (Length, Fitness, Technical, Commitment), each scored 1–5 in the Sheet.
// Columns: profile_length, profile_fitness, profile_technical, profile_commitment. Hidden until all four are filled.
export const PROFILE_AXES = [
  ["profile_length", "Length"],
  ["profile_technical", "Technical"],
  ["profile_commitment", "Commitment"],
  ["profile_fitness", "Fitness"],
];

export function hasProfile(r) { return PROFILE_AXES.every(([k]) => Number(r[k]) >= 1); }

export default function Profile({ r }) {
  const S = 300, c = S / 2, R = 108;
  const pt = (i, v) => { const a = -Math.PI / 2 + (i * 2 * Math.PI) / PROFILE_AXES.length; return [c + Math.cos(a) * R * v, c + Math.sin(a) * R * v]; };
  const ring = (v) => PROFILE_AXES.map((_, i) => pt(i, v).join(",")).join(" ");
  const vals = PROFILE_AXES.map(([k]) => Math.min(5, Math.max(1, Number(r[k]))) / 5);
  const labelPos = [[c, 18, "middle"], [S - 4, c + 5, "end"], [c, S - 8, "middle"], [4, c + 5, "start"]];
  return (
    <figure className="profile">
      <svg viewBox={`0 0 ${S} ${S}`} role="img" aria-label={PROFILE_AXES.map(([k, l]) => `${l} ${r[k]} of 5`).join(", ")}>
        {[0.2, 0.4, 0.6, 0.8, 1].map((v) => <polygon key={v} points={ring(v)} className="pring" />)}
        {PROFILE_AXES.map((_, i) => <line key={i} x1={c} y1={c} x2={pt(i, 1)[0]} y2={pt(i, 1)[1]} className="pring" />)}
        <polygon points={vals.map((v, i) => pt(i, v).join(",")).join(" ")} className="parea" />
        {PROFILE_AXES.map(([, l], i) => <text key={l} x={labelPos[i][0]} y={labelPos[i][1]} textAnchor={labelPos[i][2]} className="plabel">{l.toUpperCase()}</text>)}
      </svg>
    </figure>
  );
}

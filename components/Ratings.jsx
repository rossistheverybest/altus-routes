// Altus difficulty ratings: three separate 1–5 scales, so a technically easy route can still read as long or committing.
// Sheet columns: rating_technical, rating_physical, rating_commitment. Each row only shows when it's filled in.
export const RATING_SCALES = [
  ["rating_technical", "Technical", "How hard the terrain is to move through: 1 trail or easy slopes, 3 scrambling, easy roped climbing or skiing to about 35°, 5 sustained hard climbing or skiing at the top of the discipline."],
  ["rating_physical", "Physical", "How big the day is: 1 a few hours and under 500 m of climbing, 3 a full day with about 1,000 m, 5 very long days with 2,000 m or more."],
  ["rating_commitment", "Commitment", "How hard it is to turn around or get help: 1 close to the road with easy retreat, 3 a full day from help, 5 remote, few exits and slow rescue."],
];
export const hasRatings = (r) => RATING_SCALES.some(([k]) => Number(r[k]) >= 1);

export default function Ratings({ r }) {
  const rows = RATING_SCALES.filter(([k]) => Number(r[k]) >= 1);
  return (
    <div className="ratings">
      {rows.map(([k, label, help]) => {
        const v = Math.min(5, Math.max(1, Math.round(Number(r[k]))));
        return (
          <div key={k} className="rating">
            <span className="rl">{label}<button type="button" className="rinfo" aria-label={`What ${label} means`} title={help}>?</button></span>
            <span className="rbar" role="img" aria-label={`${label} ${v} of 5`}>{[1, 2, 3, 4, 5].map((i) => <i key={i} className={i <= v ? "on" : ""} />)}</span>
            <span className="rv">{v}/5</span>
            <span className="rhelp">{help}</span>
          </div>
        );
      })}
      <p className="rnote">Altus ratings are a general guide for planning, not a professional assessment of you or the route on the day.</p>
    </div>
  );
}

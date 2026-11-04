// All routes as cards, grouped by area. Sits under the hub map (and is what search engines read).
import Link from "next/link";
import Card from "./Card";
import { zoneHref } from "../lib/shared";

export default function RouteList({ zones, routes, crag, only = null }) {
  return (
    <div className="gut"><div className="wrap routelist">
      {zones.filter((z) => !only || z.slug === only).map((z) => {
        const rs = routes.filter((r) => r.zone === z.slug); if (!rs.length) return null;
        return (
          <section key={z.slug} className="rl-zone">
            <div className="zonehead">
              <p className="eyebrow">{rs.length} route{rs.length === 1 ? "" : "s"}</p>
              <h2>{only ? `All ${z.name} routes` : <Link href={zoneHref(z)}>{z.name}</Link>}</h2>
              {!only && <p>{z.blurb}</p>}
            </div>
            {crag && z.slug === crag.zone && (
              <Link className="cragcard" href={`/routes/${crag.zone}/stawamus-chief`}>
                <img src={crag.photo} alt="The Stawamus Chief with climbing routes marked" />
                <span><span className="czone">Crag view</span><span className="cname">{crag.name}</span><span className="cstats">{crag.count} climbs drawn on the face · open →</span></span>
              </Link>
            )}
            <div className="cards">{rs.map((r) => <Card key={r.slug} r={r} zoneName={z.name} />)}</div>
          </section>
        );
      })}
    </div></div>
  );
}

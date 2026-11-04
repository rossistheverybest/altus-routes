import Link from "next/link";
import { CRAG, ROUTES, routeBy, zoneBy } from "../lib/data";
import { LINE_COLOURS, routeHref, zoneHref } from "../lib/shared";
import { SITE_URL, BUILD_NOTES } from "../lib/site";
import { cragSVG } from "../lib/crag";
import { PageHead, JsonLd } from "./Chrome";
import Hoverable from "./Hoverable";
import CragTracer from "./CragTracer";

export default function CragPage() {
  const z = zoneBy[CRAG.zone];
  const fig = cragSVG(CRAG);
  const hrefs = Object.fromEntries(CRAG.lines.filter((l) => routeBy[l.route]).map((l) => [l.route, routeHref(routeBy[l.route])]));
  const rock = ROUTES.filter((r) => r.zone === CRAG.zone && r.discipline === "rock").map((r) => ({ slug: r.slug, name: r.name }));
  return (
    <>
      <PageHead crumbs={[["Routes", "/routes"], [z.name, zoneHref(z)], [CRAG.name, null]]} title={CRAG.name}
        lede="The classic climbs on the Chief, drawn on the face. Tap a line or a name for the route page." />
      <div className="gut"><main className="wrap">
        <article className="route"><div className="cragwrap">
          {BUILD_NOTES && <div className="flag"><b>Draft · verify</b>Calculus Crack and Freeway have no route pages yet. For launch, use a clean full-resolution photo without the yellow marks, and confirm the photographer&apos;s credit and permission.</div>}
          <Hoverable hrefs={hrefs}>
            <div className="crag" style={{ aspectRatio: `${fig.VW}/${fig.VH}` }}>
              <img src={CRAG.photo} alt="The Stawamus Chief from across the estuary, with climbing routes marked" />
              <div className="svgwrap" dangerouslySetInnerHTML={{ __html: fig.svg }} />
            </div>
            <p className="caption">Lines are approximate. Your guide chooses the route on the day. {CRAG.credit}</p>
            <ol className="clegend">
              {CRAG.lines.map((l) => {
                const r = routeBy[l.route];
                return (
                  <li key={l.n} data-cline={l.n}>
                    <span className="cnum" style={{ background: LINE_COLOURS[(l.n - 1) % LINE_COLOURS.length] }}>{l.n}</span>
                    <span className="ctext"><b>{l.label}</b><span>{r ? `${r.grade} · ${r.level}` : "Route page coming"}</span></span>
                    {r && <Link className="linkbtn" href={routeHref(r)}>Route page →</Link>}
                  </li>
                );
              })}
            </ol>
          </Hoverable>
          {BUILD_NOTES && <CragTracer crag={CRAG} rockRoutes={rock} />}
        </div></article>
      </main></div>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "ImageObject", contentUrl: `${SITE_URL}${CRAG.photo}`, name: `${CRAG.name} climbing routes`,
        description: CRAG.lines.map((l) => l.label).join(", ") }} />
    </>
  );
}

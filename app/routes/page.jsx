import { ZONES, ROUTES, CRAG, GEOMETRY, COLLECTIONS, lite, liteZone } from "../../lib/data";
import CollTile from "../../components/CollTile";
import Link from "next/link";
import { SITE_URL } from "../../lib/site";
import { JsonLd } from "../../components/Chrome";
import HubMap from "../../components/HubMap";
import RouteList from "../../components/RouteList";

const TITLE = "Altus Mountain Tick List: Ski Tours, Climbs and Runs | Altus Mountain Guides";
const DESC = "Route guides from Altus's IFMGA guides: ski tours, rock climbs, alpine routes and mountain runs in the Sea to Sky and beyond, with trip reports and the guided option for each.";

export const metadata = { title: TITLE, description: DESC, alternates: { canonical: "/routes" }, openGraph: { title: TITLE, description: DESC, url: "/routes" } };

export default function Hub() {
  const zones = ZONES.map(liteZone), routes = ROUTES.map(lite);
  const crag = { zone: CRAG.zone, name: CRAG.name, photo: CRAG.photo, count: CRAG.lines.length };
  return (
    <>
      <HubMap zones={zones} routes={routes} geometry={GEOMETRY}>
        {COLLECTIONS.length > 0 && (
          <section className="hub-colls gut" aria-labelledby="hubcoll"><div className="wrap" style={{ paddingBottom: 0 }}>
            <div className="areas-head"><div><p className="eyebrow">Curated by our guides</p><h2 id="hubcoll" className="sechead">Collections</h2></div><Link className="linkbtn" href="/collections">All collections →</Link></div>
            <div className="coll-grid">{COLLECTIONS.map((c) => <CollTile key={c.slug} c={c} />)}</div>
          </div></section>
        )}
        <RouteList zones={zones} routes={routes} crag={crag} />
      </HubMap>
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "CollectionPage", name: "Altus Mountain Tick List", description: DESC, url: `${SITE_URL}/routes`,
        publisher: { "@type": "Organization", name: "Altus Mountain Guides", url: "https://altusmountainguides.com" },
        mainEntity: { "@type": "ItemList", itemListElement: ROUTES.map((r, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE_URL}/routes/${r.zone}/${r.slug}`, name: r.name })) },
      }} />
    </>
  );
}

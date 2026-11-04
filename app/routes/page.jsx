import { ZONES, ROUTES, CRAG, GEOMETRY, lite, liteZone } from "../../lib/data";
import { SITE_URL } from "../../lib/site";
import { JsonLd } from "../../components/Chrome";
import HubMap from "../../components/HubMap";
import RouteList from "../../components/RouteList";

const TITLE = "Sea to Sky Routes: Ski, Climb and Run from Vancouver to the Duffey | Altus";
const DESC = "Route guides from Altus's IFMGA guides: ski tours, rock climbs, alpine summits and runs between Vancouver, Squamish, Whistler and the Duffey, with trip reports.";

export const metadata = { title: TITLE, description: DESC, alternates: { canonical: "/routes" }, openGraph: { title: TITLE, description: DESC, url: "/routes" } };

export default function Hub() {
  const zones = ZONES.map(liteZone), routes = ROUTES.map(lite);
  const crag = { zone: CRAG.zone, name: CRAG.name, photo: CRAG.photo, count: CRAG.lines.length };
  return (
    <>
      <HubMap zones={zones} routes={routes} geometry={GEOMETRY}>
        <RouteList zones={zones} routes={routes} crag={crag} />
      </HubMap>
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "CollectionPage", name: "Sea to Sky Routes", description: DESC, url: `${SITE_URL}/routes`,
        publisher: { "@type": "Organization", name: "Altus Mountain Guides", url: "https://altusmountainguides.com" },
        mainEntity: { "@type": "ItemList", itemListElement: ROUTES.map((r, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE_URL}/routes/${r.zone}/${r.slug}`, name: r.name })) },
      }} />
    </>
  );
}

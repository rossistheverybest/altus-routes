import Link from "next/link";
import { ZONES, ROUTES, CRAG, lite, liteZone } from "../../lib/data";
import { DISC, zoneHref } from "../../lib/shared";
import { SITE_URL } from "../../lib/site";
import { PageHead, JsonLd } from "../../components/Chrome";
import HubClient from "../../components/HubClient";

const TITLE = "Sea to Sky Routes: Ski, Climb and Run from Vancouver to the Duffey | Altus";
const DESC = "Route guides from Altus's IFMGA guides: ski tours, rock climbs, alpine summits and runs between Vancouver, Squamish, Whistler and the Duffey, with trip reports.";

export const metadata = { title: TITLE, description: DESC, alternates: { canonical: "/routes" }, openGraph: { title: TITLE, description: DESC, url: "/routes" } };

export default function Hub() {
  return (
    <>
      <PageHead crumbs={[["Routes", null]]} title="Sea to Sky Routes"
        lede="Ski tours, rock climbs, alpine summits and mountain runs between Vancouver and the Duffey Lake Road, written by our guides, with our own trip reports and the guided option for each." />
      <div className="gut"><main className="wrap">
        <section className="zones-sec">
          <h2 className="sechead">Seven zones</h2>
          <div className="zgrid">
            {ZONES.map((z) => {
              const rs = ROUTES.filter((r) => r.zone === z.slug);
              const by = Object.keys(DISC).map((k) => [k, rs.filter((r) => r.discipline === k).length]).filter((x) => x[1]);
              return (
                <Link key={z.slug} className="zcard" href={zoneHref(z)}>
                  <span className="zn">{z.name}</span>
                  <span className="zc">{rs.length} route{rs.length === 1 ? "" : "s"} · {by.map(([k, n]) => `${n} ${DISC[k].label.toLowerCase()}`).join(", ")}</span>
                  <span className="zbar">{by.map(([k, n]) => <i key={k} style={{ flex: n, background: `var(${DISC[k].c})` }} />)}</span>
                </Link>
              );
            })}
          </div>
        </section>
        <HubClient zones={ZONES.map(liteZone)} routes={ROUTES.map(lite)} crag={{ zone: CRAG.zone, name: CRAG.name, photo: CRAG.photo, count: CRAG.lines.length }} />
      </main></div>
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "CollectionPage", name: "Sea to Sky Routes", description: DESC, url: `${SITE_URL}/routes`,
        publisher: { "@type": "Organization", name: "Altus Mountain Guides", url: "https://altusmountainguides.com" },
        mainEntity: { "@type": "ItemList", itemListElement: ROUTES.map((r, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE_URL}/routes/${r.zone}/${r.slug}`, name: r.name })) },
      }} />
    </>
  );
}

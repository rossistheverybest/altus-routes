import { notFound } from "next/navigation";
import { ZONES, ROUTES, CRAG, GEOMETRY, zoneBy, lite, liteZone } from "../../../lib/data";
import { SITE_URL } from "../../../lib/site";
import { JsonLd } from "../../../components/Chrome";
import HubMap from "../../../components/HubMap";
import RouteList from "../../../components/RouteList";

export const dynamicParams = false;
export function generateStaticParams() { return ZONES.map((z) => ({ zone: z.slug })); }

export async function generateMetadata({ params }) {
  const { zone } = await params; const z = zoneBy[zone]; if (!z) return {};
  const title = `${z.name} Routes: Ski Tours, Climbs and Runs | Altus Mountain Guides`;
  return { title, description: z.blurb, alternates: { canonical: `/routes/${z.slug}` }, openGraph: { title, description: z.blurb, url: `/routes/${z.slug}` } };
}

export default async function ZonePage({ params }) {
  const { zone } = await params; const z = zoneBy[zone]; if (!z) notFound();
  const zones = ZONES.map(liteZone), routes = ROUTES.map(lite);
  const rs = ROUTES.filter((r) => r.zone === z.slug);
  const crag = { zone: CRAG.zone, name: CRAG.name, photo: CRAG.photo, count: CRAG.lines.length };
  return (
    <>
      <HubMap zones={zones} routes={routes} geometry={GEOMETRY} initialZone={z.slug}>
        <RouteList zones={zones} routes={routes} crag={crag} only={z.slug} />
      </HubMap>
      <JsonLd data={[
        { "@context": "https://schema.org", "@type": "CollectionPage", name: `${z.name} routes`, description: z.blurb, url: `${SITE_URL}/routes/${z.slug}`,
          mainEntity: { "@type": "ItemList", itemListElement: rs.map((r, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE_URL}/routes/${r.zone}/${r.slug}`, name: r.name })) } },
        { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
          { "@type": "ListItem", position: 1, name: "Routes", item: `${SITE_URL}/routes` },
          { "@type": "ListItem", position: 2, name: z.name, item: `${SITE_URL}/routes/${z.slug}` } ] },
      ]} />
    </>
  );
}

import { COLLECTIONS } from "../../lib/data";
import { SITE_URL } from "../../lib/site";
import { PageHead, JsonLd } from "../../components/Chrome";
import CollTile from "../../components/CollTile";

const TITLE = "Route Collections: Classic Lists from Our Guides | Altus Mountain Guides";
const DESC = "Curated lists of ski tours, climbs, alpine routes and runs chosen by Altus guides: Sea to Sky classics, first alpine summits, lift-accessed touring and multi-day traverses.";
export const metadata = { title: TITLE, description: DESC, alternates: { canonical: "/collections" }, openGraph: { title: TITLE, description: DESC, url: "/collections" } };

export default function Collections() {
  return (
    <>
      <PageHead crumbs={[["Routes", "/routes"], ["Collections", null]]} title="Collections" lede="Lists our guides put together: where to start, what to work toward, and the classics worth the trip." />
      <div className="gut"><main className="wrap"><div className="coll-grid">{COLLECTIONS.map((c) => <CollTile key={c.slug} c={c} />)}</div></main></div>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "CollectionPage", name: "Route collections", description: DESC, url: `${SITE_URL}/collections`,
        mainEntity: { "@type": "ItemList", itemListElement: COLLECTIONS.map((c, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE_URL}/collections/${c.slug}`, name: c.title })) } }} />
    </>
  );
}

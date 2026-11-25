import Link from "next/link";
import { notFound } from "next/navigation";
import { COLLECTIONS, collectionBy, routeBy, zoneBy, lite } from "../../../lib/data";
import { SITE_URL, INDEXABLE_STATUSES } from "../../../lib/site";
import { routeHref } from "../../../lib/shared";
import { PageHead, JsonLd } from "../../../components/Chrome";
import Card from "../../../components/Card";
import TopoTiles from "../../../components/TopoTiles";
import CollTile from "../../../components/CollTile";

export const dynamicParams = false;
export function generateStaticParams() { return COLLECTIONS.map((c) => ({ slug: c.slug })); }

export async function generateMetadata({ params }) {
  const { slug } = await params; const c = collectionBy[slug]; if (!c) return {};
  const title = `${c.title}: ${c.routes.length} routes | Altus Mountain Guides`;
  const description = c.intro.slice(0, 155);
  return { title, description, alternates: { canonical: `/collections/${c.slug}` }, openGraph: { title, description, url: `/collections/${c.slug}`, images: c.hero ? [c.hero] : undefined },
    robots: INDEXABLE_STATUSES.includes(c.status) ? undefined : { index: false, follow: true } };
}

export default async function CollectionPage({ params }) {
  const { slug } = await params; const c = collectionBy[slug]; if (!c) notFound();
  const routes = c.routes.map((s) => routeBy[s]).filter(Boolean);
  const first = routes[0];
  const others = COLLECTIONS.filter((x) => x.slug !== c.slug);
  return (
    <>
      <PageHead crumbs={[["Routes", "/routes"], ["Collections", "/collections"], [c.title, null]]} />
      <div className="gut"><main className="wrap">
        <header className={`hero coll-hero${c.hero ? " hasphoto" : ""}`}>
          {c.hero ? <img className="heroimg" src={c.hero} alt={c.title} /> : first && <TopoTiles lat={first.lat} lng={first.lng} z={10} cols={7} rows={3} className="dim" eager />}
          <div className="in">
            <p className="eyebrow">Collection · {routes.length} routes</p>
            <h1 className="routetitle">{c.title}</h1>
            <p className="sum">{c.intro}</p>
          </div>
        </header>

        <section aria-labelledby="inthis">
          <h2 id="inthis" className="sectitle">The Routes</h2>
          <div className="cards">{routes.map((r) => <Card key={r.slug} r={lite(r)} zoneName={zoneBy[r.zone]?.name} />)}</div>
        </section>

        {c.products.length > 0 && (
          <section className="coll-guided" aria-labelledby="guided">
            <p className="eyebrow">Go with a guide</p>
            <h2 id="guided" className="sectitle">Trips and courses for this list</h2>
            <div className="coll-btns">{c.products.map((p) => <a key={p.url} className="btn" href={p.url}>{p.name}</a>)}</div>
          </section>
        )}

        {others.length > 0 && (
          <section aria-labelledby="morecoll">
            <h2 id="morecoll" className="sectitle">More Collections</h2>
            <div className="coll-grid">{others.map((x) => <CollTile key={x.slug} c={x} />)}</div>
          </section>
        )}
        <p className="disclaimer">Collections are a starting point for planning, not a recommendation for any party or conditions. Your guide chooses the objective and the line on the day.</p>
      </main></div>
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "CollectionPage", name: c.title, description: c.intro, url: `${SITE_URL}/collections/${c.slug}`,
        publisher: { "@type": "Organization", name: "Altus Mountain Guides", url: "https://altusmountainguides.com" },
        mainEntity: { "@type": "ItemList", itemListElement: routes.map((r, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE_URL}${routeHref(r)}`, name: r.name })) },
      }} />
    </>
  );
}


import Link from "next/link";
import { notFound } from "next/navigation";
import { ZONES, ROUTES, CRAG, zoneBy, routeBy, reportsFor, routeForCragLine, lite, liteZone } from "../../../../lib/data";
import { DISC, unit, routeHref, zoneHref } from "../../../../lib/shared";
import { SITE_URL, BUILD_NOTES, INDEXABLE_STATUSES } from "../../../../lib/site";
import { mapSVG } from "../../../../lib/map";
import { cragSVG } from "../../../../lib/crag";
import { PageHead, JsonLd } from "../../../../components/Chrome";
import Card from "../../../../components/Card";
import Hoverable from "../../../../components/Hoverable";
import CragPage from "../../../../components/CragPage";

const CRAG_SLUG = "stawamus-chief";
export const dynamicParams = false;

export function generateStaticParams() {
  return [...ROUTES.map((r) => ({ zone: r.zone, slug: r.slug })), { zone: CRAG.zone, slug: CRAG_SLUG }];
}

const fmtDate = (d) => { try { return new Date(d + "T12:00:00").toLocaleDateString("en-CA", { day: "numeric", month: "short", year: "numeric" }); } catch { return d; } };

export async function generateMetadata({ params }) {
  const { zone, slug } = await params;
  if (slug === CRAG_SLUG && zone === CRAG.zone) {
    const title = "Climbing the Stawamus Chief: Routes on the Face | Altus Mountain Guides";
    const description = "Angel's Crest, Calculus Crack, Squamish Buttress, the Grand Wall and Freeway drawn on the Chief, with grades and guided options from Altus.";
    return { title, description, alternates: { canonical: `/routes/${zone}/${slug}` }, openGraph: { title, description, images: [CRAG.photo] } };
  }
  const r = routeBy[slug]; if (!r || r.zone !== zone) return {};
  const title = `${r.name}: ${DISC[r.discipline].kind} route guide | Altus`;
  return {
    title, description: r.summary,
    alternates: { canonical: routeHref(r) },
    robots: INDEXABLE_STATUSES.includes(r.status) ? undefined : { index: false, follow: true },
    openGraph: { title, description: r.summary, type: "article", url: routeHref(r), images: r.photos.hero ? [r.photos.hero] : undefined },
  };
}

function Stat({ label, value }) { return value ? <div className="stat"><dt>{label}</dt><dd>{value}</dd></div> : null; }

export default async function RoutePage({ params }) {
  const { zone, slug } = await params;
  if (slug === CRAG_SLUG && zone === CRAG.zone) return <CragPage />;
  const r = routeBy[slug]; if (!r || r.zone !== zone) notFound();
  const z = zoneBy[r.zone];
  const reps = reportsFor(r.slug);
  const more = ROUTES.filter((x) => x.zone === r.zone && x.slug !== r.slug);
  const cragLine = routeForCragLine(r.slug);
  const zonesLite = ZONES.map(liteZone);
  const extraPhotos = ["start", "crux", "payoff", "detail"].filter((k) => r.photos[k]);
  const url = `${SITE_URL}${routeHref(r)}`;

  let line;
  if (cragLine && cragLine.pts.length) {
    const fig = cragSVG(CRAG, { focus: r.slug });
    line = (<>
      <div className="crag" style={{ aspectRatio: `${fig.VW}/${fig.VH}` }}>
        <img src={CRAG.photo} alt={`${r.name} marked on the Stawamus Chief`} />
        <div className="svgwrap" dangerouslySetInnerHTML={{ __html: fig.svg }} />
      </div>
      <p className="caption"><Link className="linkbtn" href={`/routes/${CRAG.zone}/${CRAG_SLUG}`}>See all climbs on the Chief →</Link></p>
    </>);
  } else if (r.tracks) {
    line = (<Hoverable>
      <div dangerouslySetInnerHTML={{ __html: mapSVG({ zones: zonesLite, focus: r, mini: true, tracks: r.tracks, className: "runmap" }) }} />
      <ol className="lines">{r.tracks.map((l, i) => <li key={i} data-line={i}><b>{i + 1}</b>{l.name}</li>)}</ol>
    </Hoverable>);
  } else {
    line = <div className="lineslot">Line diagram coming: a photo of the line, or our own GPS track.</div>;
  }

  return (
    <>
      <PageHead crumbs={[["Routes", "/routes"], [z.name, zoneHref(z)], [r.name, null]]} />
      <div className="gut"><main className="wrap">
        <article className="route">
          <div className={`hero${r.photos.hero ? " hasphoto" : ""}`}>
            {r.photos.hero && <img className="heroimg" src={r.photos.hero} alt={r.name} />}
            <div className="in">
              <div className="tags"><span className="tag">{DISC[r.discipline].label}</span>{r.style && <span className="tag">{r.style}</span>}</div>
              <h1 className="routetitle">{r.name}</h1>
              <p className="sum">{r.summary}</p>
            </div>
          </div>
          <dl className="stats" style={{ margin: 0 }}>
            <Stat label={r.discipline === "ski" ? "Vertical" : "Elevation gain"} value={unit(r.gain_m, "m")} />
            <Stat label="Top" value={unit(r.high_point_m, "m")} />
            <Stat label="Aspect" value={r.aspect} />
            <Stat label="Max pitch" value={r.max_pitch} />
            <Stat label="Terrain" value={r.terrain} />
            <Stat label="Grade" value={r.grade} />
            <Stat label="Distance" value={unit(r.distance_km, "km")} />
            <Stat label="Time" value={r.time} />
          </dl>
          <div className="body">
            <div className="prose">
              {BUILD_NOTES && r.verify && <div className="flag"><b>Draft · verify ({r.status})</b>{r.verify}</div>}
              <section><h2 className="h3">The line</h2>{line}<p className="caption">Lines are approximate. Your guide chooses the line on the day.</p></section>
              <section><h2 className="h3">Overview</h2><p>{r.overview}</p></section>
              {r.guide_quote && <blockquote className="quote">{r.guide_quote}<cite>{r.author}</cite></blockquote>}
              <section><h2 className="h3">The route</h2><p>{r.route_description}</p></section>
              {extraPhotos.length > 0 && <div className="photos">{extraPhotos.map((k) => <img key={k} src={r.photos[k]} alt={`${r.name}: ${k}`} loading="lazy" />)}</div>}
              <section><h2 className="h3">Hazards</h2><p>{r.hazards}</p></section>
              <section><h2 className="h3">Skills you need</h2><p>{r.skills}</p></section>
              <section><h2 className="h3">Trip reports</h2>
                {reps.length
                  ? <ul className="reports">{reps.map((x) => <li key={x.url}><time dateTime={x.date}>{x.date}</time><a href={x.url}>{x.title}</a></li>)}</ul>
                  : <p className="muted">No trip reports yet.</p>}
              </section>
            </div>
            <aside className="side">
              <div className="guide">
                <h2 className="h3">Go with a guide</h2>
                <p>{r.go_guided}</p>
                {r.products.map((p) => <a key={p.url} href={p.url}>{p.name} →</a>)}
              </div>
              <dl className="details">
                <dt>Ability</dt><dd>{r.level}</dd>
                <dt>Best when</dt><dd>{r.season}</dd>
                <dt>Zone</dt><dd><Link href={zoneHref(z)}>{z.name}</Link></dd>
                <dt>Access</dt><dd>{r.access}</dd>
                {r.ates && <><dt>ATES</dt><dd>{r.ates}</dd></>}
              </dl>
              <div>
                <h2 className="h3">Where it is</h2>
                <div dangerouslySetInnerHTML={{ __html: mapSVG({ zones: zonesLite, focus: r, mini: true }) }} />
                <p className="caption">{r.name} · <Link className="linkbtn" href={zoneHref(z)}>Full map →</Link></p>
              </div>
              <div><h2 className="h3">Before you go</h2><p className="muted" style={{ margin: 0 }}>Check the avalanche forecast at <a href="https://avalanche.ca">avalanche.ca</a> and the BC Parks page for closures and permits on the day you go.</p></div>
            </aside>
          </div>
          <p className="disclaimer">Your guide chooses the objective and the line on the day based on conditions, weather and the group. Route descriptions are general information, not instructions.{r.last_updated ? ` Last updated ${fmtDate(r.last_updated)}.` : ""}</p>
          {more.length > 0 && (
            <div className="more">
              <div className="morehead"><h2 className="h3">More from {z.name}</h2><Link className="linkbtn" href="/routes">All routes →</Link></div>
              <div className="cards">{more.map((m) => <Card key={m.slug} r={lite(m)} zoneName={z.name} />)}</div>
            </div>
          )}
        </article>
      </main></div>
      <JsonLd data={[
        { "@context": "https://schema.org", "@type": "Article", headline: `${r.name}: ${DISC[r.discipline].kind} route guide`, description: r.summary, url,
          author: { "@type": "Person", name: r.author || "Ross Berg" }, dateModified: r.last_updated || undefined,
          image: r.photos.hero ? `${SITE_URL}${r.photos.hero}` : undefined,
          publisher: { "@type": "Organization", name: "Altus Mountain Guides", url: "https://altusmountainguides.com" } },
        { "@context": "https://schema.org", "@type": "TouristAttraction", name: r.name, description: r.summary, url,
          geo: { "@type": "GeoCoordinates", latitude: r.lat, longitude: r.lng }, containedInPlace: { "@type": "Place", name: `${z.name}, British Columbia` } },
        { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
          { "@type": "ListItem", position: 1, name: "Routes", item: `${SITE_URL}/routes` },
          { "@type": "ListItem", position: 2, name: z.name, item: `${SITE_URL}/routes/${z.slug}` },
          { "@type": "ListItem", position: 3, name: r.name, item: url } ] },
      ]} />
    </>
  );
}

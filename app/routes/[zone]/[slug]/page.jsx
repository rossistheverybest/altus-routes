import Link from "next/link";
import { notFound } from "next/navigation";
import { ROUTES, CRAG, zoneBy, routeBy, reportsFor, routeForCragLine, lite } from "../../../../lib/data";
import { DISC, unit, routeHref, zoneHref } from "../../../../lib/shared";
import { SITE_URL, BUILD_NOTES, INDEXABLE_STATUSES } from "../../../../lib/site";
import { cragSVG } from "../../../../lib/crag";
import { PageHead, JsonLd } from "../../../../components/Chrome";
import Card from "../../../../components/Card";
import CragPage from "../../../../components/CragPage";
import TopoMap from "../../../../components/TopoMap";
import TopoTiles from "../../../../components/TopoTiles";
import Profile, { hasProfile } from "../../../../components/Profile";

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

export default async function RoutePage({ params }) {
  const { zone, slug } = await params;
  if (slug === CRAG_SLUG && zone === CRAG.zone) return <CragPage />;
  const r = routeBy[slug]; if (!r || r.zone !== zone) notFound();
  const z = zoneBy[r.zone];
  const reps = reportsFor(r.slug);
  const more = ROUTES.filter((x) => x.zone === r.zone && x.slug !== r.slug);
  const cragLine = routeForCragLine(r.slug);
  const extraPhotos = ["start", "crux", "payoff", "detail"].filter((k) => r.photos[k]);
  const url = `${SITE_URL}${routeHref(r)}`;
  const point = { lat: r.lat, lng: r.lng };

  const facts = [
    [r.discipline === "ski" ? "Vertical" : "Elevation gain", unit(r.gain_m, "m")],
    ["High point", unit(r.high_point_m, "m")],
    ["Distance", unit(r.distance_km, "km")],
    ["Time", r.time],
    ["Grade", r.grade],
    ["Ability", r.level],
    ["Aspect", r.aspect],
    ["Max pitch", r.max_pitch],
    ["Terrain", r.terrain],
    ["ATES", r.ates],
    ["Season", r.season],
  ].filter(([, v]) => v);

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
    line = (<>
      <TopoMap mode="lines" tracks={r.tracks} discipline={r.discipline} className="tall" />
      <ol className="lines">{r.tracks.map((l, i) => <li key={i}><b>{i + 1}</b>{l.name}</li>)}</ol>
    </>);
  } else {
    line = (<>
      <TopoMap mode="point" point={point} discipline={r.discipline} className="tall" />
      <p className="caption">Our GPS track for this route is coming. The pin shows the general area.</p>
    </>);
  }

  return (
    <>
      <PageHead crumbs={[["Routes", "/routes"], [z.name, zoneHref(z)], [r.name, null]]} />
      <div className="gut"><main className="wrap routepage">
        <header className={`hero${r.photos.hero ? " hasphoto" : ""}`}>
          {r.photos.hero ? <img className="heroimg" src={r.photos.hero} alt={r.name} /> : <TopoTiles lat={r.lat} lng={r.lng} z={12} cols={7} rows={3} className="dim" />}
          <div className="in">
            <p className="eyebrow">{DISC[r.discipline].label}{r.style ? ` · ${r.style}` : ""} · {z.name}</p>
            <h1 className="routetitle">{r.name}</h1>
            <p className="sum">{r.summary}</p>
          </div>
        </header>

        {BUILD_NOTES && r.verify && <div className="flag"><b>Draft · verify ({r.status})</b>{r.verify}</div>}

        <div className="duo">
          <div className="factcol">
            <section className="factcard" aria-labelledby="facts">
              <h2 id="facts" className="cardtitle">Route Facts</h2>
              <dl className="facts">{facts.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
            </section>
            <div className="guide" id="guide">
              <p className="eyebrow">Go with a guide</p>
              <p>{r.go_guided}</p>
              {r.products.map((p) => <a key={p.url} className="btn" href={p.url}>{p.name}</a>)}
            </div>
          </div>
          <div className="profilecol">
            {hasProfile(r) ? (<><h2 className="sectitle">Route Profile</h2><Profile r={r} /></>) : (<>
              <h2 className="sectitle">Where It Is</h2>
              <TopoMap mode="point" point={point} discipline={r.discipline} />
              <p className="caption">{z.name} · <Link className="linkbtn" href={zoneHref(z)}>All {z.name} routes →</Link></p>
              {BUILD_NOTES && <p className="flag"><b>Build note</b>Add profile_length, profile_fitness, profile_technical and profile_commitment (1–5) in the Sheet to show the Route Profile chart here.</p>}
            </>)}
          </div>
        </div>

        <div className="body">
          <div className="prose">
            <section id="line"><p className="eyebrow">The line</p>{line}<p className="caption">Lines are approximate. Your guide chooses the line on the day.</p></section>
            <section id="overview"><p className="eyebrow">Overview</p><p className="lead">{r.overview}</p></section>
            {r.guide_quote && <blockquote className="quote">{r.guide_quote}<cite>{r.author}</cite></blockquote>}
            <section id="route"><p className="eyebrow">The route</p><p>{r.route_description}</p></section>
            {extraPhotos.length > 0 && <div className="photos">{extraPhotos.map((k) => <img key={k} src={r.photos[k]} alt={`${r.name}: ${k}`} loading="lazy" />)}</div>}
            <section id="hazards"><p className="eyebrow">Hazards</p><p>{r.hazards}</p></section>
            <section id="skills"><p className="eyebrow">Skills you need</p><p>{r.skills}</p></section>
            <section id="reports"><p className="eyebrow">Trip reports</p>
              {reps.length
                ? <ul className="reports">{reps.map((x) => <li key={x.url}><time dateTime={x.date}>{x.date}</time><a href={x.url}>{x.title}</a></li>)}</ul>
                : <p className="muted">No trip reports yet.</p>}
            </section>
          </div>
          <aside className="side">
            <dl className="details">
              <dt>Access</dt><dd>{r.access}</dd>
              <dt>Zone</dt><dd><Link href={zoneHref(z)}>{z.name}</Link></dd>
              <dt>Before you go</dt><dd>Check the avalanche forecast at <a href="https://avalanche.ca">avalanche.ca</a> and BC Parks for closures and permits on the day.</dd>
            </dl>
          </aside>
        </div>

        <p className="disclaimer">Your guide chooses the objective and the line on the day based on conditions, weather and the group. Route descriptions are general information, not instructions.{r.last_updated ? ` Last updated ${fmtDate(r.last_updated)}.` : ""}</p>

        {more.length > 0 && (
          <section className="more">
            <div className="morehead"><h2 className="sectitle">More From {z.name}</h2><Link className="linkbtn" href="/routes">All routes →</Link></div>
            <div className="cards">{more.map((m) => <Card key={m.slug} r={lite(m)} zoneName={z.name} />)}</div>
          </section>
        )}
      </main></div>

      <nav className="routenav gut" aria-label="On this page">
        <div className="in">
          <a href="#line">The Line</a><a href="#overview">Overview</a><a href="#hazards">Hazards</a><a href="#reports">Trip Reports</a>
          <a className="primary" href="#guide">Go With A Guide</a>
        </div>
      </nav>

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

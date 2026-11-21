import Link from "next/link";
import { MAIN, PHONE, OFFERINGS_URL } from "../lib/site";

export function SiteHeader() {
  // Matches the main site's nav: logo, phone, "See all offerings" and Menu.
  return (
    <header className="site">
      <div className="in">
        <a className="logo" href={MAIN} aria-label="Altus Mountain Guides home"><img src="/altus-logo.png" alt="Altus Mountain Guides" /></a>
        <div className="nav__r">
          <a className="tel" href={`tel:${PHONE.replace(/[^\d+]/g, "")}`}><em>Call</em><span>{PHONE.replace(/^\+1\s?/, "")}</span></a>
          <a className="cta" href={OFFERINGS_URL}>See all offerings<svg viewBox="0 0 16 10" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M0 5h14.5M10.5 1l4 4-4 4" /></svg></a>
          <a className="menu-btn" href={MAIN} aria-label="Menu"><span className="lbl">Menu</span><span className="bars" aria-hidden="true"><i /><i /></span></a>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="sitefoot gut">
      <div className="in">
        <div><b>Altus Mountain Guides</b>IFMGA and ACMG guides based in Squamish, BC.<br /><a href="tel:+16048488543">604-848-8543</a><a href="mailto:info@altusmountainguides.com">info@altusmountainguides.com</a></div>
        <div><b>Routes</b><Link href="/routes">All Sea to Sky routes</Link><Link href="/routes/whistler">Whistler &amp; Spearhead</Link><Link href="/routes/squamish/stawamus-chief">Climbs on the Chief</Link><Link href="/routes/squamish">Squamish</Link></div>
        <div><b>Courses and trips</b><a href={`${MAIN}/ski-courses-trips`}>Ski courses and trips</a><a href={MAIN}>All programs</a></div>
        <div><b>Before you go</b><a href="https://avalanche.ca" rel="noopener">Avalanche forecast (avalanche.ca)</a><a href="https://bcparks.ca" rel="noopener">BC Parks closures</a><span className="fine">Route descriptions are general information, not instructions.</span></div>
      </div>
    </footer>
  );
}

export function PageHead({ crumbs = [], title, lede }) {
  return (
    <div className="pagehead gut">
      <div className="in">
        <nav className="crumb" aria-label="Breadcrumb">
          <a href={MAIN}>Home</a>
          {crumbs.map(([label, href], i) => (
            <span key={i}> / {href ? <Link href={href}>{label}</Link> : <span aria-current="page">{label}</span>}</span>
          ))}
        </nav>
        {title && <h1>{title}</h1>}
        {lede && <p className="lede">{lede}</p>}
      </div>
    </div>
  );
}

export function JsonLd({ data }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

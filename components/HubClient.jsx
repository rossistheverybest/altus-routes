"use client";
// Interactive part of the hub and zone pages: filters, map and route cards.
// Rendered on the server first with no filters, so every route link is in the HTML Google sees.
import { useMemo, useRef, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DISC, LEVELS, zoneHref } from "../lib/shared";
import { mapSVG } from "../lib/map";
import Card from "./Card";

export default function HubClient({ zones, routes, activeZone = null, crag = null }) {
  const router = useRouter();
  const [disc, setDisc] = useState(new Set());
  const [level, setLevel] = useState(new Set());
  const [q, setQ] = useState("");
  const [hover, setHover] = useState(null);
  const mapRef = useRef(null);
  const zoneName = Object.fromEntries(zones.map((z) => [z.slug, z.name]));

  const matches = (r) =>
    (!disc.size || disc.has(r.discipline)) &&
    (!level.size || level.has(r.level)) &&
    (!activeZone || r.zone === activeZone) &&
    (!q || `${r.name} ${r.summary} ${r.grade} ${zoneName[r.zone]}`.toLowerCase().includes(q.toLowerCase()));
  const vis = routes.filter(matches);
  const visSet = useMemo(() => new Set(vis.map((r) => r.slug)), [vis]);
  const svg = useMemo(() => mapSVG({ zones, routes, activeZone, visible: visSet }), [zones, routes, activeZone, visSet]);

  const toggle = (set, setter, v) => { const n = new Set(set); n.has(v) ? n.delete(v) : n.add(v); setter(n); };

  useEffect(() => {
    const el = mapRef.current; if (!el) return;
    el.querySelectorAll(".pin").forEach((p) => p.classList.toggle("hl", p.dataset.route === hover));
  }, [hover, svg]);

  const onMapClick = (e) => {
    const pin = e.target.closest("[data-route]");
    if (pin) return router.push(`/routes/${pin.dataset.zoneOf}/${pin.dataset.route}`);
    const zone = e.target.closest("[data-zone]");
    if (zone) router.push(activeZone === zone.dataset.zone ? "/routes" : zoneHref(zone.dataset.zone));
  };
  const onMapOver = (e) => { const pin = e.target.closest("[data-route]"); setHover(pin ? pin.dataset.route : null); };

  const groups = zones.filter((z) => !activeZone || z.slug === activeZone).map((z) => {
    const rs = vis.filter((r) => r.zone === z.slug); if (!rs.length) return null;
    return (
      <section key={z.slug}>
        <div className="zonehead">
          <h2>{activeZone ? z.name : <Link href={zoneHref(z)}>{z.name}</Link>}</h2>
          {!activeZone && <p>{z.blurb}</p>}
        </div>
        {crag && z.slug === crag.zone && (
          <Link className="cragcard" href={`/routes/${crag.zone}/stawamus-chief`}>
            <img src={crag.photo} alt="The Stawamus Chief with climbing routes marked" />
            <span><span className="czone">Crag view</span><span className="cname">{crag.name}</span><span className="cstats">{crag.count} climbs marked on the face · open →</span></span>
          </Link>
        )}
        <div className="cards">
          {rs.map((r) => (
            <div key={r.slug} className={hover === r.slug ? "hlwrap" : undefined}>
              <Card r={r} zoneName={z.name} onHover={setHover} />
            </div>
          ))}
        </div>
      </section>
    );
  });

  return (
    <>
      <div className="filters" role="toolbar" aria-label="Filter routes">
        {Object.entries(DISC).map(([k, v]) => (
          <button key={k} className="chip" aria-pressed={disc.has(k)} onClick={() => toggle(disc, setDisc, k)}>
            <span className="dot" style={{ background: `var(${v.c})` }} />{v.label}
          </button>
        ))}
        <span className="sep" />
        {LEVELS.map((k) => (
          <button key={k} className="chip" aria-pressed={level.has(k)} onClick={() => toggle(level, setLevel, k)}>{k}</button>
        ))}
        <input className="search" type="search" placeholder="Search routes" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search routes" />
      </div>
      <div className="atlas">
        <div className="mapcard">
          <div className="mapbar">
            <b>{activeZone ? zoneName[activeZone] : "Vancouver to the Duffey"}</b>
            <span>{vis.length} of {activeZone ? routes.filter((r) => r.zone === activeZone).length : routes.length} routes {activeZone && <Link className="reset" href="/routes">All zones</Link>}</span>
          </div>
          <div ref={mapRef} onClick={onMapClick} onMouseOver={onMapOver} onMouseLeave={() => setHover(null)} dangerouslySetInnerHTML={{ __html: svg }} />
          <div className="maplegend">
            {Object.values(DISC).map((v) => <span key={v.label}><span className="dot" style={{ background: `var(${v.c})` }} />{v.label}</span>)}
            <span>Tap a zone to zoom · tap a pin to open</span>
          </div>
        </div>
        <div className="index">{groups.some(Boolean) ? groups : <p className="empty">No routes match these filters.</p>}</div>
      </div>
    </>
  );
}

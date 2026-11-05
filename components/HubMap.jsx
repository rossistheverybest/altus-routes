"use client";
// The /routes hub: full-screen map, area blocks, filters, a route card on click and, with an area picked, a list drawer.
// The full route list is rendered under the map (children) so every route link is in the page for search engines.
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import AltusMap, { COL } from "./AltusMap";
import TopoTiles from "./TopoTiles";
import { DISC, LEVELS, routeHref, zoneHref, cardStats } from "../lib/shared";

export default function HubMap({ zones, routes, geometry, initialZone = null, children }) {
  const [zone, setZone] = useState(initialZone);
  const [disc, setDisc] = useState([]);
  const [level, setLevel] = useState("");
  const [q, setQ] = useState("");
  const [card, setCard] = useState(null);
  const zoneBy = useMemo(() => Object.fromEntries(zones.map((z) => [z.slug, z])), [zones]);
  const z = zone ? zoneBy[zone] : null;
  const hubRef = useRef(null);

  const match = (r) => (!disc.length || disc.includes(r.discipline)) && (!level || r.level === level) &&
    (!q || `${r.name} ${r.summary} ${r.grade} ${zoneBy[r.zone]?.name}`.toLowerCase().includes(q.toLowerCase()));
  const vis = routes.filter(match);
  const visSlugs = useMemo(() => (disc.length || level || q ? vis.map((r) => r.slug) : null), [disc, level, q, routes]); // eslint-disable-line react-hooks/exhaustive-deps
  const inZone = z ? vis.filter((r) => r.zone === z.slug) : vis;
  const count = (slug) => vis.filter((r) => !slug || r.zone === slug).length;

  const pickZone = (slug) => {
    setZone(slug); setCard(null);
    try { window.history.replaceState(null, "", slug ? zoneHref(slug) : "/routes"); document.title = slug ? `${zoneBy[slug].name} Routes | Altus Mountain Guides` : "Altus Mountain Tick List | Altus Mountain Guides"; } catch {}
  };
  const pickRoute = (p) => {
    const r = p.slug && routes.find((x) => x.slug === p.slug);
    setCard(r ? { ...r, line: p.line } : { lineOnly: true, name: p.line, zone: p.zone, discipline: p.discipline });
    if (r && r.zone !== zone) setZone(r.zone);
  };
  useEffect(() => { const k = (e) => e.key === "Escape" && setCard(null); window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, []);
  const toggle = (d) => setDisc((x) => (x.includes(d) ? x.filter((y) => y !== d) : [...x, d]));
  const zn = (slug) => zoneBy[slug]?.name || "";

  return (
    <>
      <section ref={hubRef} className={`hub${z ? " haszone" : ""}`} aria-label="Route map">
        <AltusMap zones={zones} routes={routes} geometry={geometry} activeZone={zone} visible={visSlugs} discs={disc.length ? disc : null}
          selected={card && !card.lineOnly ? card.slug : null} pad={z ? { left: 0.04, right: 0.34, top: 0.1, bottom: 0.16 } : undefined}
          onZone={pickZone} onRoute={pickRoute} />

        {!z && (
          <div className="hub-title">
            <p className="eyebrow">Sea to Sky and beyond</p>
            <h1>Altus Mountain Tick List.</h1>
            <p>Ski tours, rock climbs, alpine routes and mountain runs our guides rate, written up with the guided option for each. Tap a route on the map, or pick an area below.</p>
            <div className="hub-legend">{Object.entries(DISC).map(([k, v]) => <span key={k}><i style={{ background: COL[k] }} />{v.label} {routes.filter((r) => r.discipline === k).length}</span>)}</div>
          </div>
        )}

        {z && (
          <aside className="hub-drawer" aria-label={`Routes in ${z.name}`}>
            <div className="hd-head">
              <button className="hd-back" onClick={() => pickZone(null)}>← All areas</button>
              <h1>{z.name}.</h1>
              <p>{z.blurb}</p>
            </div>
            <ul className="hd-list">
              {inZone.map((r) => (
                <li key={r.slug}>
                  <button className={card?.slug === r.slug ? "on" : ""} onClick={() => pickRoute({ slug: r.slug })}>
                    <span className="hd-thumb">{r.hero ? <img src={r.hero} alt="" loading="lazy" /> : <TopoTiles lat={r.lat} lng={r.lng} z={12} cols={3} rows={3} />}</span>
                    <span className="hd-text"><b>{r.name}</b><span className="hd-meta"><i style={{ background: COL[r.discipline] }} />{DISC[r.discipline].label} · {r.level}</span><span>{cardStats(r)}</span></span>
                  </button>
                </li>
              ))}
              {!inZone.length && <li className="hd-empty">{routes.some((r) => r.zone === z.slug) ? "No routes here match the filters." : "Routes for this area are coming soon. Ask us about guided trips here."}</li>}
            </ul>
          </aside>
        )}

        {card && (
          <div className="hub-card" role="dialog" aria-label={card.name}>
            <button className="x" aria-label="Close" onClick={() => setCard(null)}>×</button>
            {!card.lineOnly && <span className="hc-img">{card.hero ? <img src={card.hero} alt="" /> : <TopoTiles lat={card.lat} lng={card.lng} z={13} cols={3} rows={3} />}</span>}
            <div className="hc-body">
              <span className="eyebrow">{DISC[card.discipline]?.label}{card.level ? ` · ${card.level}` : ""}{card.reportCount ? ` · ${card.reportCount} report${card.reportCount > 1 ? "s" : ""}` : ""}</span>
              <b>{card.name}</b>
              {card.line && !card.lineOnly && <span className="hc-line">Line: {card.line}</span>}
              {card.lineOnly ? <span>A line in {zn(card.zone)}. Ask us about guiding it.</span> : <span className="hc-stats">{cardStats(card)}</span>}
              <div className="hc-btns">
                {card.lineOnly
                  ? <a className="btn solid" href={`mailto:info@altusmountainguides.com?subject=${encodeURIComponent(card.name + " (" + zn(card.zone) + ")")}`}>Ask about it</a>
                  : <><Link className="btn solid" href={routeHref(card)}>View route</Link>{card.guided && <a className="btn" href={card.guided}>Guided trip</a>}</>}
              </div>
            </div>
          </div>
        )}

        <div className="hub-bottom">
          <div className="hub-filters" role="toolbar" aria-label="Filter routes">
            {Object.entries(DISC).map(([k, v]) => <button key={k} className="chip" aria-pressed={disc.includes(k)} onClick={() => toggle(k)}><span className="dot" style={{ background: COL[k] }} />{v.label}</button>)}
            <label className="hf-level"><span className="sr">Ability</span>
              <select value={level} onChange={(e) => setLevel(e.target.value)}><option value="">Any ability</option>{LEVELS.map((l) => <option key={l}>{l}</option>)}</select>
            </label>
            <label className="hf-search"><span className="sr">Search routes</span><input type="search" placeholder="Search a route, peak or crag" value={q} onChange={(e) => setQ(e.target.value)} /></label>
            <span className="hf-count">{z ? inZone.length : vis.length} routes</span>
            <a className="chip" href="#list">List ↓</a>
          </div>
        </div>
      </section>
      <AreaBlocks zones={zones} routes={routes.filter((r) => (!level || r.level === level) && (!q || `${r.name} ${r.summary} ${r.grade}`.toLowerCase().includes(q.toLowerCase())))}
        disc={disc} toggle={toggle} clear={() => setDisc([])} zone={zone}
        onPick={(slug) => { pickZone(slug); hubRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }} />
      <div id="list">{children}</div>
    </>
  );
}

// Area blocks under the map, sortable by activity.
function AreaBlocks({ zones, routes, disc, toggle, clear, zone, onPick }) {
  const stats = (slug) => Object.fromEntries(Object.keys(DISC).map((k) => [k, routes.filter((r) => r.zone === slug && r.discipline === k).length]));
  const score = (st) => (disc.length ? disc.reduce((a, d) => a + st[d], 0) : Object.values(st).reduce((a, b) => a + b, 0));
  const groups = [["sea-to-sky", "Sea to Sky"], ["afield", "Further afield"]];
  const centre = (p) => [p.reduce((a, x) => a + x[0], 0) / p.length, p.reduce((a, x) => a + x[1], 0) / p.length];
  const zoomFor = (p) => { const span = Math.max(...p.map((x) => x[1])) - Math.min(...p.map((x) => x[1])); return Math.max(4, Math.min(11, Math.round(Math.log2(360 / span)) - 1)); };
  return (
    <section className="areas gut" aria-label="Areas">
      <div className="wrap areas-in">
        <div className="areas-head">
          <div><p className="eyebrow">Choose an area</p><h2 className="sechead">Areas</h2></div>
          <div className="areas-sort" role="group" aria-label="Sort areas by activity">
            <button className="chip" aria-pressed={!disc.length} onClick={clear}>All activities</button>
            {Object.entries(DISC).map(([k, v]) => <button key={k} className="chip" aria-pressed={disc.includes(k)} onClick={() => toggle(k)}><span className="dot" style={{ background: COL[k] }} />{v.label}</button>)}
          </div>
        </div>
        {groups.map(([g, label]) => {
          const zs = zones.filter((x) => (x.group || "sea-to-sky") === g).map((x) => ({ ...x, st: stats(x.slug) })).map((x) => ({ ...x, n: score(x.st) }))
            .sort((a, b) => (disc.length ? b.n - a.n : 0));
          return (
            <div key={g} className="areas-group">
              <h3 className="eyebrow">{label}</h3>
              <div className="areas-grid">
                {zs.map((x) => {
                  const total = Object.values(x.st).reduce((a, b) => a + b, 0);
                  const [lat, lng] = centre(x.polygon);
                  return (
                    <button key={x.slug} className={`area${x.n === 0 ? " dim" : ""}${zone === x.slug ? " on" : ""}`} onClick={() => onPick(x.slug)}>
                      <span className="area-topo"><TopoTiles lat={lat} lng={lng} z={zoomFor(x.polygon)} cols={3} rows={3} className="dim" /></span>
                      <span className="area-body">
                        <b>{x.name}</b>
                        <span className="area-count">{total ? `${total} route${total === 1 ? "" : "s"}` : "Routes coming soon"}</span>
                        {total > 0 && <span className="area-acts">{Object.entries(x.st).filter(([, n]) => n).map(([k, n]) => <span key={k} className={disc.length && !disc.includes(k) ? "off" : ""}><i style={{ background: COL[k] }} />{n} {DISC[k].label.toLowerCase()}</span>)}</span>}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

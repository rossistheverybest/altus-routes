"use client";
// Interactive part of the hub and zone pages: filters, map and route cards.
// Rendered on the server first with no filters, so every route link is in the HTML Google sees.
import { useMemo, useState } from "react";
import Link from "next/link";
import { DISC, LEVELS, zoneHref } from "../lib/shared";
import Card from "./Card";
import TopoMap from "./TopoMap";

export default function HubClient({ zones, routes, activeZone = null, crag = null }) {
  const [disc, setDisc] = useState(new Set());
  const [level, setLevel] = useState(new Set());
  const [q, setQ] = useState("");
  const [hover, setHover] = useState(null);
  const zoneName = Object.fromEntries(zones.map((z) => [z.slug, z.name]));

  const matches = (r) =>
    (!disc.size || disc.has(r.discipline)) &&
    (!level.size || level.has(r.level)) &&
    (!activeZone || r.zone === activeZone) &&
    (!q || `${r.name} ${r.summary} ${r.grade} ${zoneName[r.zone]}`.toLowerCase().includes(q.toLowerCase()));
  const vis = routes.filter(matches);
  const visSet = useMemo(() => new Set(vis.map((r) => r.slug)), [vis]);

  const toggle = (set, setter, v) => { const n = new Set(set); n.has(v) ? n.delete(v) : n.add(v); setter(n); };


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
            <Card key={r.slug} r={r} zoneName={z.name} onHover={setHover} hl={hover === r.slug} />
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
          <TopoMap mode="corridor" zones={zones} routes={routes} activeZone={activeZone} visible={visSet} hover={hover} onHover={setHover} />
          <div className="maplegend">
            {Object.values(DISC).map((v) => <span key={v.label}><span className="dot" style={{ background: `var(${v.c})` }} />{v.label}</span>)}
            <span>Tap a zone to zoom · tap a pin to open · Topo / Aerial top right</span>
          </div>
        </div>
        <div className="index">{groups.some(Boolean) ? groups : <p className="empty">No routes match these filters.</p>}</div>
      </div>
    </>
  );
}

"use client";
// Preview of the full-screen hub map in the Altus vector styles. Not linked from the site.
import { useState } from "react";
import Link from "next/link";
import AltusMap from "./AltusMap";
import { routeHref } from "../lib/shared";

export default function MapPreview({ zones, routes, geometry }) {
  const palette = "muted";
  const [zone, setZone] = useState(null);
  const [route, setRoute] = useState(null);
  const count = (slug) => routes.filter((r) => !slug || r.zone === slug).length;
  return (
    <div className="mp">
      <AltusMap palette={palette} zones={zones} routes={routes} geometry={geometry} activeZone={zone} onZone={(s) => { setZone(s); setRoute(null); }} onRoute={(p) => { const r = routes.find((x) => x.slug === p.slug); setRoute(r ? { ...r, line: p.line } : { name: p.line, zone: p.zone, discipline: p.discipline, zoneOnly: true, zoneName: zones.find((z) => z.slug === p.zone)?.name }); }} />
      <div className="mp-title">
        <p className="eyebrow">Map style preview</p>
        <h1>Sea to Sky Routes.</h1>
        <p>Pick an area below, or tap a number on the map. Zoom in to see each route.</p>
        <div className="mp-legend"><span><i style={{ background: "#5AA9E6" }} />Ski</span><span><i style={{ background: "#E8894A" }} />Rock</span><span><i style={{ background: "#B39BE3" }} />Alpine</span><span><i style={{ background: "#6CCB8F" }} />Run</span></div>
      </div>
      {route && (
        <div className="mp-card">
          <button className="x" aria-label="Close" onClick={() => setRoute(null)}>×</button>
          <span className="eyebrow">{route.discipline}{route.level ? ` · ${route.level}` : ""}</span>
          <b>{route.name}</b>
          {route.zoneOnly ? (<>
            <span>A line in {route.zoneName}. Ask us about guiding it.</span>
            <Link className="btn" href={`/routes/${route.zone}`}>{route.zoneName} routes</Link>
          </>) : (<>
            {route.line && <span className="eyebrow">Line: {route.line}</span>}
            <span>{route.summary}</span>
            <Link className="btn" href={routeHref(route)}>View route</Link>
          </>)}
        </div>
      )}
      <nav className="mp-blocks" aria-label="Choose an area">
        <button aria-pressed={!zone} onClick={() => { setZone(null); setRoute(null); }}><b>All zones</b><span>{count()} routes</span></button>
        {zones.map((z) => <button key={z.slug} aria-pressed={zone === z.slug} onClick={() => { setZone(z.slug); setRoute(null); }}><b>{z.name}</b><span>{count(z.slug)} routes</span></button>)}
      </nav>
    </div>
  );
}

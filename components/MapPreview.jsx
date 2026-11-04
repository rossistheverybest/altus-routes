"use client";
// Preview of the full-screen hub map in the Altus vector styles. Not linked from the site.
import { useState } from "react";
import Link from "next/link";
import AltusMap from "./AltusMap";
import { routeHref } from "../lib/shared";

export default function MapPreview({ zones, routes }) {
  const [palette, setPalette] = useState("muted");
  const [zone, setZone] = useState(null);
  const [route, setRoute] = useState(null);
  const count = (slug) => routes.filter((r) => !slug || r.zone === slug).length;
  return (
    <div className="mp">
      <AltusMap palette={palette} zones={zones} routes={routes} activeZone={zone} onZone={(s) => { setZone(s); setRoute(null); }} onRoute={(p) => setRoute(routes.find((r) => r.slug === p.slug))} />
      <div className="mp-title">
        <p className="eyebrow">Map style preview</p>
        <h1>Sea to Sky Routes.</h1>
        <p>Pick an area below, or tap a number on the map. Zoom in to see each route.</p>
        <div className="mp-toggle" role="group" aria-label="Map colours">
          {["muted", "dark"].map((p) => <button key={p} aria-pressed={palette === p} onClick={() => setPalette(p)}>{p === "muted" ? "Muted" : "Dark"}</button>)}
        </div>
      </div>
      {route && (
        <div className="mp-card">
          <button className="x" aria-label="Close" onClick={() => setRoute(null)}>×</button>
          <span className="eyebrow">{route.discipline} · {route.level}</span>
          <b>{route.name}</b>
          <span>{route.summary}</span>
          <Link className="btn" href={routeHref(route)}>View route</Link>
        </div>
      )}
      <nav className="mp-blocks" aria-label="Choose an area">
        <button aria-pressed={!zone} onClick={() => { setZone(null); setRoute(null); }}><b>All zones</b><span>{count()} routes</span></button>
        {zones.map((z) => <button key={z.slug} aria-pressed={zone === z.slug} onClick={() => { setZone(z.slug); setRoute(null); }}><b>{z.name}</b><span>{count(z.slug)} routes</span></button>)}
      </nav>
    </div>
  );
}

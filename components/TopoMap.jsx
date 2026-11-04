"use client";
// Interactive topo / aerial map (Leaflet). Modes:
//  - corridor: all zones + route pins, click a pin to open the route, click a zone to open the zone page
//  - lines:    a route's GPS lines on the topo, numbered
//  - point:    one route's location
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { TOPO, AERIAL } from "../lib/tiles";

const COL = { ski: "#5AA9E6", rock: "#E8894A", alpine: "#B39BE3", run: "#6CCB8F" };
const GOLD = "#FCB124";

export default function TopoMap({ mode = "corridor", zones = [], routes = [], activeZone = null, visible = null, hover = null, onHover, tracks = null, point = null, discipline = "ski", height, className = "" }) {
  const el = useRef(null);
  const map = useRef(null);
  const layers = useRef({});
  const router = useRouter();
  const routerRef = useRef(router); routerRef.current = router;
  const hoverRef = useRef(onHover); hoverRef.current = onHover;

  // Create the map once.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !el.current || map.current) return;
      const m = L.map(el.current, { scrollWheelZoom: false, zoomControl: true, attributionControl: true, preferCanvas: false });
      const topo = L.tileLayer(TOPO.url, { maxZoom: TOPO.maxZoom, attribution: TOPO.attribution });
      const aerial = L.tileLayer(AERIAL.url, { maxZoom: AERIAL.maxZoom, attribution: AERIAL.attribution });
      topo.addTo(m);
      L.control.layers({ Topo: topo, Aerial: aerial }, null, { position: "topright", collapsed: false }).addTo(m);
      m.on("click", () => m.scrollWheelZoom.enable());
      m.on("mouseout", () => m.scrollWheelZoom.disable());
      map.current = m; layers.current.L = L;

      if (mode === "corridor") {
        layers.current.zones = {};
        zones.forEach((z) => {
          const poly = L.polygon(z.polygon, { color: GOLD, weight: 1.5, dashArray: "5 4", fillColor: GOLD, fillOpacity: 0.06 })
            .bindTooltip(z.name, { sticky: true, className: "maptip" })
            .on("click", (e) => { L.DomEvent.stopPropagation(e); routerRef.current.push(activeZone === z.slug ? "/routes" : `/routes/${z.slug}`); })
            .addTo(m);
          layers.current.zones[z.slug] = poly;
        });
        layers.current.pins = {};
        routes.forEach((r) => {
          const c = L.circleMarker([r.lat, r.lng], { radius: 7, color: "#111", weight: 2, fillColor: COL[r.discipline], fillOpacity: 1 })
            .bindTooltip(r.name, { direction: "top", offset: [0, -6], className: "maptip" })
            .on("click", (e) => { L.DomEvent.stopPropagation(e); routerRef.current.push(`/routes/${r.zone}/${r.slug}`); })
            .on("mouseover", () => hoverRef.current?.(r.slug))
            .on("mouseout", () => hoverRef.current?.(null))
            .addTo(m);
          layers.current.pins[r.slug] = c;
        });
      }
      if (mode === "lines" && tracks) {
        const all = [];
        layers.current.lines = tracks.map((l, i) => {
          all.push(...l.coords);
          const g = L.layerGroup().addTo(m);
          L.polyline(l.coords, { color: "#111", weight: 7, opacity: 0.55 }).addTo(g);
          const pl = L.polyline(l.coords, { color: COL[discipline] || GOLD, weight: 4 }).addTo(g);
          L.marker(l.coords[0], { icon: L.divIcon({ className: "lnum-icon", html: `<span>${i + 1}</span>`, iconSize: [22, 22] }) }).bindTooltip(l.name, { className: "maptip" }).addTo(g);
          pl.bindTooltip(`${i + 1}. ${l.name}`, { sticky: true, className: "maptip" });
          return { g, pl };
        });
        m.fitBounds(L.latLngBounds(all), { padding: [20, 20] });
      }
      if (mode === "point" && point) {
        L.circleMarker([point.lat, point.lng], { radius: 10, color: "#111", weight: 3, fillColor: COL[discipline] || GOLD, fillOpacity: 1 }).addTo(m);
        m.setView([point.lat, point.lng], 11);
      }
      fit();
      setTimeout(() => m.invalidateSize(), 50);
    })();
    return () => { cancelled = true; if (map.current) { map.current.remove(); map.current = null; } };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function fit() {
    const m = map.current, L = layers.current.L; if (!m || mode !== "corridor") return;
    const z = activeZone && zones.find((x) => x.slug === activeZone);
    const pts = z ? z.polygon : zones.flatMap((x) => x.polygon);
    m.fitBounds(L.latLngBounds(pts), { padding: [10, 10] });
  }

  // Filters, zone focus and hover.
  useEffect(() => {
    const ls = layers.current; if (!map.current || mode !== "corridor" || !ls.pins) return;
    Object.entries(ls.pins).forEach(([slug, c]) => {
      const on = !visible || visible.has(slug);
      c.setStyle({ fillOpacity: on ? 1 : 0.15, opacity: on ? 1 : 0.2, radius: hover === slug ? 10 : 7, color: hover === slug ? "#fff" : "#111" });
      if (on) c.bringToFront();
    });
    Object.entries(ls.zones || {}).forEach(([slug, p]) => p.setStyle({ fillOpacity: activeZone === slug ? 0.12 : activeZone ? 0.02 : 0.06, opacity: activeZone && activeZone !== slug ? 0.35 : 1 }));
  }, [visible, hover, activeZone, mode]);

  return <div ref={el} className={`topomap ${className}`} style={height ? { height } : undefined} role="region" aria-label="Topographic map" />;
}

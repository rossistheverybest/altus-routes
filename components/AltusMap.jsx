"use client";
// Full-screen corridor map in the Altus vector style (MapLibre). Zones are spotlit when picked; pins open routes.
import { useEffect, useRef } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import { altusStyle, PALETTES, SOURCES, CONTOUR_THRESHOLDS } from "../lib/mapstyle";

const COL = { ski: "#5AA9E6", rock: "#E8894A", alpine: "#B39BE3", run: "#6CCB8F" };
const GOLD = "#FFBF00";

const ring = (poly) => { const r = poly.map(([lat, lng]) => [lng, lat]); r.push(r[0]); return r; };

export default function AltusMap({ palette = "muted", zones, routes, activeZone = null, onRoute, onZone, dim = 0.45 }) {
  const el = useRef(null);
  const mapRef = useRef(null);
  const cb = useRef({ onRoute, onZone }); cb.current = { onRoute, onZone };

  useEffect(() => {
    let map, cancelled = false;
    (async () => {
      const maplibregl = (await import("maplibre-gl")).default;
      const mlcontour = (await import("maplibre-contour")).default;
      if (cancelled || !el.current) return;
      const dem = new mlcontour.DemSource({ url: SOURCES.dem, encoding: "terrarium", maxzoom: 13, worker: true });
      dem.setupMaplibre(maplibregl);
      const contours = dem.contourProtocolUrl({ thresholds: CONTOUR_THRESHOLDS, contourLayer: "contours", elevationKey: "ele", levelKey: "level" });
      map = new maplibregl.Map({
        container: el.current, style: altusStyle(PALETTES[palette], contours),
        bounds: [[-123.6, 49.25], [-122.1, 50.55]], fitBoundsOptions: { padding: 40 },
        attributionControl: { compact: true }, dragRotate: false, pitchWithRotate: false, cooperativeGestures: false,
      });
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
      mapRef.current = map;
      if (typeof window !== "undefined") window.__altusMap = map;
      map.on("error", (e) => console.error("[altus-map]", e?.error?.message || e));
      map.on("load", () => {
        const zoneFC = { type: "FeatureCollection", features: zones.map((z) => ({ type: "Feature", properties: { slug: z.slug, name: z.name }, geometry: { type: "Polygon", coordinates: [ring(z.polygon)] } })) };
        const centroid = (z) => { const n = z.polygon.length; return [z.polygon.reduce((a, p) => a + p[1], 0) / n, z.polygon.reduce((a, p) => a + p[0], 0) / n]; };
        const countFC = { type: "FeatureCollection", features: zones.map((z) => ({ type: "Feature", properties: { slug: z.slug, count: routes.filter((r) => r.zone === z.slug).length }, geometry: { type: "Point", coordinates: centroid(z) } })) };
        const pinFC = { type: "FeatureCollection", features: routes.map((r) => ({ type: "Feature", properties: { slug: r.slug, zone: r.zone, name: r.name, color: COL[r.discipline] }, geometry: { type: "Point", coordinates: [r.lng, r.lat] } })) };
        map.addSource("zones", { type: "geojson", data: zoneFC });
        map.addSource("spot", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
        map.addSource("counts", { type: "geojson", data: countFC });
        map.addSource("pins", { type: "geojson", data: pinFC });
        map.addLayer({ id: "spot", type: "fill", source: "spot", paint: { "fill-color": "#000", "fill-opacity": dim } });
        map.addLayer({ id: "zone-fill", type: "fill", source: "zones", paint: { "fill-color": GOLD, "fill-opacity": ["case", ["==", ["get", "slug"], ""], 0.14, 0.03] } });
        map.addLayer({ id: "zone-line", type: "line", source: "zones", paint: { "line-color": ["case", ["==", ["get", "slug"], ""], GOLD, "#C79A6B"], "line-width": ["case", ["==", ["get", "slug"], ""], 3, 1.4], "line-dasharray": [3, 2] } });
        map.addLayer({ id: "count-bg", type: "circle", source: "counts", maxzoom: 10.5, paint: { "circle-radius": ["interpolate", ["linear"], ["get", "count"], 1, 16, 17, 26], "circle-color": "#000", "circle-stroke-color": "#E0C3A4", "circle-stroke-width": 2 } });
        map.addLayer({ id: "count-label", type: "symbol", source: "counts", maxzoom: 10.5, layout: { "text-field": ["to-string", ["get", "count"]], "text-font": ["Noto Sans Bold"], "text-size": 14, "text-allow-overlap": true }, paint: { "text-color": "#fff" } });
        map.addLayer({ id: "pins", type: "circle", source: "pins", minzoom: 9, paint: { "circle-radius": 7, "circle-color": ["get", "color"], "circle-stroke-color": "#000", "circle-stroke-width": 2 } });
        map.on("click", "pins", (e) => { const f = e.features?.[0]; if (f) cb.current.onRoute?.(f.properties); });
        map.on("click", "zone-fill", (e) => { const f = e.features?.[0]; if (f) cb.current.onZone?.(f.properties.slug); });
        map.on("click", "count-bg", (e) => { const f = e.features?.[0]; if (f) cb.current.onZone?.(f.properties.slug); });
        ["pins", "zone-fill", "count-bg"].forEach((l) => { map.on("mouseenter", l, () => (map.getCanvas().style.cursor = "pointer")); map.on("mouseleave", l, () => (map.getCanvas().style.cursor = "")); });
        map.__ready = true;
      });
    })();
    return () => { cancelled = true; map?.remove(); mapRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [palette]);

  useEffect(() => {
    let t;
    const go = () => {
      const m = mapRef.current;
      if (!m || !m.__ready) { t = setTimeout(go, 200); return; }
      const zones_ = zones;
      const z = activeZone && zones_.find((x) => x.slug === activeZone);
      const world = [[-140, 40], [-110, 40], [-110, 60], [-140, 60], [-140, 40]];
      const r = (poly) => { const a = poly.map(([lat, lng]) => [lng, lat]); a.push(a[0]); return a; };
      m.getSource("spot").setData(z ? { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [world, r(z.polygon).reverse()] } } : { type: "FeatureCollection", features: [] });
      m.setPaintProperty("zone-fill", "fill-opacity", ["case", ["==", ["get", "slug"], activeZone || ""], 0.12, 0.03]);
      m.setPaintProperty("zone-line", "line-color", ["case", ["==", ["get", "slug"], activeZone || ""], GOLD, "#C79A6B"]);
      m.setPaintProperty("zone-line", "line-width", ["case", ["==", ["get", "slug"], activeZone || ""], 3, 1.4]);
      const pts = z ? z.polygon : zones_.flatMap((x) => x.polygon);
      const lngs = pts.map((p) => p[1]), lats = pts.map((p) => p[0]);
      const w = m.getContainer().clientWidth, h = m.getContainer().clientHeight;
      const pad = { top: Math.round(h * 0.12), bottom: Math.round(h * 0.26), left: w > 900 ? Math.round(w * 0.36) : 30, right: Math.round(w * 0.06) };
      m.fitBounds([[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]], { padding: pad, duration: 900 });
      m.setLayoutProperty("count-bg", "visibility", activeZone ? "none" : "visible");
      m.setLayoutProperty("count-label", "visibility", activeZone ? "none" : "visible");
      m.setFilter("pins", activeZone ? ["==", ["get", "zone"], activeZone] : null);
      m.setLayerZoomRange("pins", activeZone ? 0 : 10.5, 24);
    };
    go();
    return () => clearTimeout(t);
  }, [activeZone, zones, palette]);

  return <div ref={el} className="altusmap" role="region" aria-label="Map of the Sea to Sky routes" />;
}

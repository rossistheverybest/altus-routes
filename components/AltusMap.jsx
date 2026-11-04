"use client";
// The hub map: MapLibre in the Altus muted style. Areas are spotlit when picked, route shapes and pins are filtered,
// and clicking a pin, line or area reports back to the page.
import { useEffect, useRef } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import { altusStyle, PALETTES, SOURCES, CONTOUR_THRESHOLDS } from "../lib/mapstyle";

export const COL = { ski: "#5AA9E6", rock: "#E8894A", alpine: "#B39BE3", run: "#6CCB8F" };
const GOLD = "#FFBF00";
const WORLD = [[-140, 40], [-110, 40], [-110, 60], [-140, 60], [-140, 40]];
const ring = (poly) => { const r = poly.map(([lat, lng]) => [lng, lat]); r.push(r[0]); return r; };
const bboxOf = (pts) => { const lngs = pts.map((p) => p[1]), lats = pts.map((p) => p[0]); return [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]]; };

export default function AltusMap({ zones, routes, geometry = null, activeZone = null, visible = null, discs = null, selected = null, pad, onRoute, onZone, onReady }) {
  const el = useRef(null);
  const mapRef = useRef(null);
  const cb = useRef({}); cb.current = { onRoute, onZone, onReady };
  const state = useRef({}); state.current = { activeZone, visible, discs, selected, pad };

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
        container: el.current, style: altusStyle(PALETTES.muted, contours),
        bounds: [[-123.6, 49.25], [-122.1, 50.55]], fitBoundsOptions: { padding: 30 },
        attributionControl: { compact: true }, dragRotate: false, pitchWithRotate: false, touchPitch: false,
      });
      map.touchZoomRotate.disableRotation();
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
      mapRef.current = map;
      map.on("error", (e) => console.error("[altus-map]", e?.error?.message || e));
      map.on("load", () => {
        const byslug = Object.fromEntries(routes.map((r) => [r.slug, r]));
        const centroid = (z) => { const n = z.polygon.length; return [z.polygon.reduce((a, p) => a + p[1], 0) / n, z.polygon.reduce((a, p) => a + p[0], 0) / n]; };
        map.addSource("zones", { type: "geojson", data: { type: "FeatureCollection", features: zones.map((z) => ({ type: "Feature", properties: { slug: z.slug, name: z.name }, geometry: { type: "Polygon", coordinates: [ring(z.polygon)] } })) } });
        map.addSource("spot", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
        map.addSource("counts", { type: "geojson", data: { type: "FeatureCollection", features: zones.map((z) => ({ type: "Feature", properties: { slug: z.slug, count: routes.filter((r) => r.zone === z.slug).length }, geometry: { type: "Point", coordinates: centroid(z) } })) } });
        map.addSource("pins", { type: "geojson", data: { type: "FeatureCollection", features: routes.map((r) => ({ type: "Feature", properties: { slug: r.slug, zone: r.zone, discipline: r.discipline, color: COL[r.discipline] }, geometry: { type: "Point", coordinates: [r.lng, r.lat] } })) } });
        map.addSource("geo", { type: "geojson", data: { type: "FeatureCollection", features: (geometry?.features || []).filter((f) => !f.properties.slug || byslug[f.properties.slug]).map((f) => ({ ...f, properties: { ...f.properties, slug: f.properties.slug || "", color: COL[f.properties.discipline] || COL.ski } })) } });

        map.addLayer({ id: "spot", type: "fill", source: "spot", paint: { "fill-color": "#000", "fill-opacity": 0.45 } });
        map.addLayer({ id: "zone-fill", type: "fill", source: "zones", paint: { "fill-color": GOLD, "fill-opacity": 0.03 } });
        map.addLayer({ id: "zone-line", type: "line", source: "zones", paint: { "line-color": "#C79A6B", "line-width": 1.4, "line-dasharray": [3, 2] } });
        map.addLayer({ id: "geo-area-fill", type: "fill", source: "geo", minzoom: 9, filter: ["==", ["get", "kind"], "area"], paint: { "fill-color": ["get", "color"], "fill-opacity": 0.16 } });
        map.addLayer({ id: "geo-area-line", type: "line", source: "geo", minzoom: 9, filter: ["==", ["get", "kind"], "area"], paint: { "line-color": ["get", "color"], "line-width": 2, "line-dasharray": [2, 1.5] } });
        map.addLayer({ id: "geo-line-case", type: "line", source: "geo", minzoom: 9.5, filter: ["==", ["get", "kind"], "line"], layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": "#1d1d1c", "line-opacity": 0.55, "line-width": ["interpolate", ["linear"], ["zoom"], 10, 3, 14, 7] } });
        map.addLayer({ id: "geo-line", type: "line", source: "geo", minzoom: 9.5, filter: ["==", ["get", "kind"], "line"], layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": ["get", "color"], "line-width": ["interpolate", ["linear"], ["zoom"], 10, 1.6, 14, 4] } });
        map.addLayer({ id: "geo-line-label", type: "symbol", source: "geo", minzoom: 12.5, filter: ["all", ["==", ["get", "kind"], "line"], ["!=", ["get", "name"], ""]], layout: { "symbol-placement": "line", "text-field": ["get", "name"], "text-font": ["Noto Sans Bold"], "text-size": 11 }, paint: { "text-color": "#1d1d1c", "text-halo-color": "#ffffff", "text-halo-width": 1.4 } });
        map.addLayer({ id: "geo-hut", type: "circle", source: "geo", minzoom: 10, filter: ["==", ["get", "kind"], "hut"], paint: { "circle-radius": 5, "circle-color": "#fff", "circle-stroke-color": "#1d1d1c", "circle-stroke-width": 2 } });
        map.addLayer({ id: "geo-hut-label", type: "symbol", source: "geo", minzoom: 11, filter: ["==", ["get", "kind"], "hut"], layout: { "text-field": ["get", "name"], "text-font": ["Noto Sans Bold"], "text-size": 11, "text-offset": [0, 1.1], "text-anchor": "top" }, paint: { "text-color": "#1d1d1c", "text-halo-color": "#fff", "text-halo-width": 1.4 } });
        map.addLayer({ id: "count-bg", type: "circle", source: "counts", maxzoom: 10.5, paint: { "circle-radius": ["interpolate", ["linear"], ["get", "count"], 1, 16, 17, 26], "circle-color": "#000", "circle-stroke-color": "#E0C3A4", "circle-stroke-width": 2 } });
        map.addLayer({ id: "count-label", type: "symbol", source: "counts", maxzoom: 10.5, layout: { "text-field": ["to-string", ["get", "count"]], "text-font": ["Noto Sans Bold"], "text-size": 14, "text-allow-overlap": true }, paint: { "text-color": "#fff" } });
        map.addLayer({ id: "pins", type: "circle", source: "pins", minzoom: 10.5, paint: { "circle-radius": 7, "circle-color": ["get", "color"], "circle-stroke-color": "#000", "circle-stroke-width": 2 } });

        const hit = (l, fn) => { map.on("click", l, (e) => { const f = e.features?.[0]; if (f) fn(f.properties, e); }); map.on("mouseenter", l, () => (map.getCanvas().style.cursor = "pointer")); map.on("mouseleave", l, () => (map.getCanvas().style.cursor = "")); };
        hit("pins", (p) => cb.current.onRoute?.({ slug: p.slug }));
        hit("geo-line", (p) => cb.current.onRoute?.({ slug: p.slug, line: p.name, zone: p.zone, discipline: p.discipline }));
        hit("geo-area-fill", (p) => cb.current.onRoute?.({ slug: p.slug, line: p.name, zone: p.zone, discipline: p.discipline }));
        hit("count-bg", (p) => cb.current.onZone?.(p.slug));
        hit("zone-fill", (p) => { if (!state.current.activeZone) cb.current.onZone?.(p.slug); });
        map.__ready = true;
        applyZone(true); applyFilters(); cb.current.onReady?.();
        setTimeout(() => { map.resize(); applyZone(true); }, 350);
        let rt; new ResizeObserver(() => { clearTimeout(rt); rt = setTimeout(() => { if (!state.current.selected) applyZone(true); }, 250); }).observe(el.current);
      });
    })();
    return () => { cancelled = true; map?.remove(); mapRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function padding(m) {
    const w = m.getContainer().clientWidth, h = m.getContainer().clientHeight, p = state.current.pad || {};
    const f = (v, d, size) => Math.round((v ?? d) * size);
    const phone = w <= 900;
    return { top: phone ? Math.round(h * (state.current.activeZone ? 0.06 : 0.36)) : f(p.top, 0.1, h), bottom: phone ? Math.round(h * 0.3) : f(p.bottom, 0.25, h), left: phone ? 16 : f(p.left, 0.3, w), right: phone ? 16 : f(p.right, 0.05, w) };
  }

  function applyZone(instant) {
    const m = mapRef.current; if (!m?.__ready) return;
    const az = state.current.activeZone, z = az && zones.find((x) => x.slug === az);
    m.getSource("spot").setData(z ? { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [WORLD, ring(z.polygon).reverse()] } } : { type: "FeatureCollection", features: [] });
    m.setPaintProperty("zone-fill", "fill-opacity", ["case", ["==", ["get", "slug"], az || ""], 0.1, 0.03]);
    m.setPaintProperty("zone-line", "line-color", ["case", ["==", ["get", "slug"], az || ""], GOLD, "#C79A6B"]);
    m.setPaintProperty("zone-line", "line-width", ["case", ["==", ["get", "slug"], az || ""], 3, 1.4]);
    ["count-bg", "count-label"].forEach((l) => m.setLayoutProperty(l, "visibility", az ? "none" : "visible"));
    m.setLayerZoomRange("pins", az ? 0 : 10.5, 24);
    try { m.fitBounds(bboxOf(z ? z.polygon : zones.flatMap((x) => x.polygon)), { padding: padding(m), duration: instant ? 0 : 900 }); } catch {}
    applyFilters();
  }

  function applyFilters() {
    const m = mapRef.current; if (!m?.__ready) return;
    const { activeZone: az, visible: vis, discs: ds, selected: sel } = state.current;
    const zoneOk = az ? ["==", ["get", "zone"], az] : true;
    const visOk = vis ? ["in", ["get", "slug"], ["literal", vis]] : true;
    const discOk = ds ? ["in", ["get", "discipline"], ["literal", ds]] : true;
    m.setFilter("pins", ["all", zoneOk, visOk]);
    const geoShow = ["any", ["all", ["!=", ["get", "slug"], ""], visOk], ["all", ["==", ["get", "slug"], ""], discOk]];
    m.setFilter("geo-area-fill", ["all", ["==", ["get", "kind"], "area"], geoShow]);
    m.setFilter("geo-area-line", ["all", ["==", ["get", "kind"], "area"], geoShow]);
    m.setFilter("geo-line-case", ["all", ["==", ["get", "kind"], "line"], geoShow]);
    m.setFilter("geo-line", ["all", ["==", ["get", "kind"], "line"], geoShow]);
    m.setFilter("geo-line-label", ["all", ["==", ["get", "kind"], "line"], ["!=", ["get", "name"], ""], geoShow]);
    m.setPaintProperty("pins", "circle-radius", ["case", ["==", ["get", "slug"], sel || ""], 11, 7]);
    m.setPaintProperty("pins", "circle-stroke-color", ["case", ["==", ["get", "slug"], sel || ""], GOLD, "#000"]);
    m.setPaintProperty("pins", "circle-stroke-width", ["case", ["==", ["get", "slug"], sel || ""], 4, 2]);
  }

  useEffect(() => { applyZone(false); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [activeZone]);
  useEffect(() => { applyFilters(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [visible, discs, selected]);
  useEffect(() => {
    const m = mapRef.current; if (!m?.__ready || !selected) return;
    const r = routes.find((x) => x.slug === selected); if (!r) return;
    const z = Math.max(m.getZoom(), 11.5);
    m.easeTo({ center: [r.lng, r.lat], zoom: z, padding: padding(m), duration: 700 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  return <div ref={el} className="altusmap" role="region" aria-label="Map of Sea to Sky routes" />;
}

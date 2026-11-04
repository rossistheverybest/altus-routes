// Altus map styles for MapLibre (vector tiles), so every colour on the map is ours to set.
// Data: OpenFreeMap vector tiles (OpenStreetMap, no key) + AWS Terrain Tiles for hill shading and contour lines.
// To move to MapTiler later, swap SOURCES.vector / SOURCES.dem / GLYPHS for their keyed URLs; the layers stay the same.

export const SOURCES = {
  vector: "https://tiles.openfreemap.org/planet",
  dem: "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png",
};
export const GLYPHS = "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf";
export const ATTRIBUTION = '© <a href="https://openfreemap.org">OpenFreeMap</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · Terrain: Mapzen/AWS';

// Two muted palettes. Edit colours here.
export const PALETTES = {
  muted: {
    name: "Muted",
    bg: "#e8e4dc", forest: "#d3d5c6", grass: "#dfddd0", rock: "#dcd6cb", ice: "#f6f6f3", iceLine: "#c6cfd3",
    water: "#a7b7bd", waterway: "#97aab1", park: "#7f8f6c",
    shadow: "#4f483f", highlight: "#ffffff", accent: "#8d857a", shadeStrength: 0.45,
    contour: "#9a8466", contourMinor: 0.28, contourMajor: 0.55,
    road: "#ffffff", roadCase: "#b9b2a7", highway: "#d9bf86", trail: "#7a6a55",
    label: "#3f3a33", halo: "#e8e4dc", peak: "#2f2b26",
  },
  dark: {
    name: "Dark",
    bg: "#1d1d1c", forest: "#222520", grass: "#232420", rock: "#262523", ice: "#3a3c3d", iceLine: "#55595b",
    water: "#23323a", waterway: "#2c3e47", park: "#4b5a43",
    shadow: "#000000", highlight: "#8a8277", accent: "#3a3631", shadeStrength: 0.55,
    contour: "#c79a6b", contourMinor: 0.2, contourMajor: 0.45,
    road: "#45423e", roadCase: "#1d1d1c", highway: "#9a845c", trail: "#a58a68",
    label: "#d6d0c6", halo: "#1d1d1c", peak: "#efe9df",
  },
};

export const CONTOUR_THRESHOLDS = { 9: [500, 1000], 10: [200, 1000], 11: [100, 500], 12: [100, 500], 13: [50, 250], 14: [20, 100], 15: [10, 50] };

export function altusStyle(p, contourTilesUrl) {
  const font = (w) => [w === "bold" ? "Noto Sans Bold" : w === "italic" ? "Noto Sans Italic" : "Noto Sans Regular"];
  const layers = [
    { id: "bg", type: "background", paint: { "background-color": p.bg } },
    { id: "landcover-wood", type: "fill", source: "omt", "source-layer": "landcover", filter: ["in", ["get", "class"], ["literal", ["wood", "forest"]]], paint: { "fill-color": p.forest } },
    { id: "landcover-grass", type: "fill", source: "omt", "source-layer": "landcover", filter: ["in", ["get", "class"], ["literal", ["grass", "wetland", "farmland"]]], paint: { "fill-color": p.grass } },
    { id: "landcover-rock", type: "fill", source: "omt", "source-layer": "landcover", filter: ["in", ["get", "class"], ["literal", ["rock", "sand"]]], paint: { "fill-color": p.rock } },
    { id: "hillshade", type: "hillshade", source: "dem", paint: { "hillshade-shadow-color": p.shadow, "hillshade-highlight-color": p.highlight, "hillshade-accent-color": p.accent, "hillshade-exaggeration": p.shadeStrength } },
    { id: "landcover-ice", type: "fill", source: "omt", "source-layer": "landcover", filter: ["==", ["get", "class"], "ice"], paint: { "fill-color": p.ice, "fill-opacity": 0.85 } },
    { id: "landcover-ice-line", type: "line", source: "omt", "source-layer": "landcover", filter: ["==", ["get", "class"], "ice"], paint: { "line-color": p.iceLine, "line-width": 0.6 } },
    { id: "water", type: "fill", source: "omt", "source-layer": "water", paint: { "fill-color": p.water } },
    { id: "waterway", type: "line", source: "omt", "source-layer": "waterway", paint: { "line-color": p.waterway, "line-width": ["interpolate", ["linear"], ["zoom"], 8, 0.4, 14, 1.6] } },
    { id: "park-line", type: "line", source: "omt", "source-layer": "park", paint: { "line-color": p.park, "line-width": 1, "line-dasharray": [3, 2], "line-opacity": 0.6 } },
  ];
  if (contourTilesUrl) {
    layers.push(
      { id: "contour-minor", type: "line", source: "contours", "source-layer": "contours", filter: ["!=", ["get", "level"], 1], paint: { "line-color": p.contour, "line-opacity": p.contourMinor, "line-width": 0.6 } },
      { id: "contour-major", type: "line", source: "contours", "source-layer": "contours", filter: ["==", ["get", "level"], 1], paint: { "line-color": p.contour, "line-opacity": p.contourMajor, "line-width": 1.1 } },
      { id: "contour-label", type: "symbol", source: "contours", "source-layer": "contours", filter: ["==", ["get", "level"], 1], minzoom: 12,
        layout: { "symbol-placement": "line", "text-field": ["concat", ["get", "ele"], " m"], "text-font": font(), "text-size": 10 },
        paint: { "text-color": p.contour, "text-halo-color": p.halo, "text-halo-width": 1 } },
    );
  }
  layers.push(
    { id: "road-trail", type: "line", source: "omt", "source-layer": "transportation", filter: ["in", ["get", "class"], ["literal", ["path", "track"]]], minzoom: 11, paint: { "line-color": p.trail, "line-width": 1, "line-dasharray": [2, 1.5], "line-opacity": 0.8 } },
    { id: "road-minor-case", type: "line", source: "omt", "source-layer": "transportation", filter: ["in", ["get", "class"], ["literal", ["minor", "service", "tertiary", "secondary", "primary"]]], minzoom: 9, paint: { "line-color": p.roadCase, "line-width": ["interpolate", ["linear"], ["zoom"], 9, 1, 14, 4] } },
    { id: "road-minor", type: "line", source: "omt", "source-layer": "transportation", filter: ["in", ["get", "class"], ["literal", ["minor", "service", "tertiary", "secondary", "primary"]]], minzoom: 9, paint: { "line-color": p.road, "line-width": ["interpolate", ["linear"], ["zoom"], 9, 0.4, 14, 2.5] } },
    { id: "road-highway", type: "line", source: "omt", "source-layer": "transportation", filter: ["in", ["get", "class"], ["literal", ["motorway", "trunk"]]], paint: { "line-color": p.highway, "line-width": ["interpolate", ["linear"], ["zoom"], 7, 0.8, 14, 4] } },
    { id: "water-name", type: "symbol", source: "omt", "source-layer": "water_name", layout: { "text-field": ["get", "name"], "text-font": font("italic"), "text-size": 11 }, paint: { "text-color": p.waterway, "text-halo-color": p.halo, "text-halo-width": 1 } },
    { id: "peak", type: "symbol", source: "omt", "source-layer": "mountain_peak", minzoom: 10,
      layout: { "text-field": ["concat", ["get", "name"], ["case", ["has", "ele"], ["concat", "\n", ["get", "ele"], " m"], ""]], "text-font": font(), "text-size": 10.5, "text-anchor": "top", "text-offset": [0, 0.2] },
      paint: { "text-color": p.peak, "text-halo-color": p.halo, "text-halo-width": 1.2 } },
    { id: "place", type: "symbol", source: "omt", "source-layer": "place", filter: ["in", ["get", "class"], ["literal", ["city", "town", "village"]]],
      layout: { "text-field": ["upcase", ["get", "name"]], "text-font": font("bold"), "text-size": ["match", ["get", "class"], "city", 13, "town", 12, 10.5], "text-letter-spacing": 0.12 },
      paint: { "text-color": p.label, "text-halo-color": p.halo, "text-halo-width": 1.4 } },
  );
  const sources = {
    omt: { type: "vector", url: SOURCES.vector, attribution: ATTRIBUTION },
    dem: { type: "raster-dem", tiles: [SOURCES.dem], encoding: "terrarium", tileSize: 256, maxzoom: 14 },
  };
  if (contourTilesUrl) sources.contours = { type: "vector", tiles: [contourTilesUrl], maxzoom: 15 };
  return { version: 8, glyphs: GLYPHS, sources, layers };
}

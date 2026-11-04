// Map tiles used everywhere on the site. Change providers here.
//
// Topo: OpenTopoMap (free, attribution required, fair-use limits).
// Aerial: Esri World Imagery (attribution required; commercial use needs a free ArcGIS Location Platform key).
// For launch traffic, swap TOPO for a keyed provider (e.g. MapTiler Outdoor) and keep the same shape.

export const TOPO = {
  name: "Topo",
  url: "https://tile.opentopomap.org/{z}/{x}/{y}.png",
  sub: null,
  maxZoom: 17,
  attribution: 'Map data © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, SRTM · Style © <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)',
};

export const AERIAL = {
  name: "Aerial",
  url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  maxZoom: 18,
  attribution: "Imagery © Esri, Maxar, Earthstar Geographics",
};

// Static tile URL for a point (used for card and hero backgrounds before a photo exists).
export function tileFor(lat, lng, z) {
  const n = 2 ** z;
  const x = ((lng + 180) / 360) * n;
  const r = (lat * Math.PI) / 180;
  const y = ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * n;
  return { x, y, z };
}

export const tileUrl = (t, x, y, z) => t.url.replace("{z}", z).replace("{x}", x).replace("{y}", y);

// On Netlify, route static tiles through its image CDN (cached at the edge). Elsewhere, load directly.
export const cachedTile = (url) => (process.env.NETLIFY ? `/.netlify/images?url=${encodeURIComponent(url)}&w=256&fm=webp&q=70` : url);

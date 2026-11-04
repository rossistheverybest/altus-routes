// A real topo map image centred on a point, built from map tiles. Server-rendered, no JavaScript.
// Used behind cards and the route hero until the route has its own photo.
import { TOPO, AERIAL, tileFor, tileUrl, cachedTile } from "../lib/tiles";

export default function TopoTiles({ lat, lng, z = 13, cols = 3, rows = 3, aerial = false, className = "", eager = false }) {
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  const src = aerial ? AERIAL : TOPO;
  const t = tileFor(lat, lng, z);
  const x0 = Math.floor(t.x) - Math.floor(cols / 2), y0 = Math.floor(t.y) - Math.floor(rows / 2);
  // Offset (px) of the point inside the mosaic, so we can centre the mosaic on it.
  const ox = (t.x - x0) * 256, oy = (t.y - y0) * 256;
  const tiles = [];
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) tiles.push([x0 + i, y0 + j]);
  return (
    <span className={`tiles ${className}`} aria-hidden="true">
      <span className="tilegrid" style={{ width: cols * 256, gridTemplateColumns: `repeat(${cols},256px)`, transform: `translate(${-ox}px, ${-oy}px)` }}>
        {tiles.map(([x, y]) => <img key={`${x}-${y}`} src={cachedTile(tileUrl(src, x, y, z))} alt="" loading={eager ? "eager" : "lazy"} width="256" height="256" />)}
      </span>
    </span>
  );
}

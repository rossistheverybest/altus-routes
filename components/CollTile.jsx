import Link from "next/link";
import { routeBy } from "../lib/data";
import TopoTiles from "./TopoTiles";

export default function CollTile({ c }) {
  const r = routeBy[c.routes[0]];
  return (
    <Link className="coll-tile" href={`/collections/${c.slug}`}>
      <span className="ct-img">{c.hero ? <img src={c.hero} alt="" loading="lazy" /> : r && <TopoTiles lat={r.lat} lng={r.lng} z={11} cols={3} rows={3} className="dim" />}</span>
      <span className="ct-body"><span className="eyebrow">{c.routes.length} routes</span><b>{c.title}</b></span>
    </Link>
  );
}

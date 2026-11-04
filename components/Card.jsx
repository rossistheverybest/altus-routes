"use client";
import Link from "next/link";
import { DISC, routeHref, cardStats } from "../lib/shared";
import TopoTiles from "./TopoTiles";

export default function Card({ r, zoneName, onHover, hl }) {
  return (
    <Link
      className={`card${hl ? " hl" : ""}`} href={routeHref(r)} data-route={r.slug}
      onMouseEnter={onHover ? () => onHover(r.slug) : undefined}
      onMouseLeave={onHover ? () => onHover(null) : undefined}
    >
      <span className="cimg">
        {r.hero ? <img className="photo" src={r.hero} alt="" loading="lazy" /> : <TopoTiles lat={r.lat} lng={r.lng} z={13} cols={3} rows={3} className="dim" />}
        <span className="ctag"><i className="dot" style={{ background: `var(${DISC[r.discipline].c})` }} />{DISC[r.discipline].label}</span>
        {r.reportCount > 0 && <span className="crep">{r.reportCount} report{r.reportCount > 1 ? "s" : ""}</span>}
      </span>
      <span className="cbody">
        <span className="czone">{zoneName}</span>
        <span className="cname">{r.name}</span>
        <span className="cstats">{cardStats(r)}</span>
      </span>
    </Link>
  );
}

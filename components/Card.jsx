"use client";
import Link from "next/link";
import { DISC, routeHref, cardStats } from "../lib/shared";
import Topo from "./Topo";

export default function Card({ r, zoneName, onHover }) {
  return (
    <Link
      className="card" href={routeHref(r)} data-route={r.slug}
      onMouseEnter={onHover ? () => onHover(r.slug) : undefined}
      onMouseLeave={onHover ? () => onHover(null) : undefined}
    >
      <span className="cimg">
        {r.hero ? <img src={r.hero} alt="" loading="lazy" /> : <Topo seed={r.slug} alpha={0.28} />}
        <span className="ctag">{DISC[r.discipline].label}</span>
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

"use client";
// Photo carousel for a route: swipe on a phone, arrows on desktop.
import { useRef, useState, useEffect } from "react";

export default function Carousel({ slides, label = "Route photos" }) {
  const track = useRef(null);
  const [i, setI] = useState(0);
  useEffect(() => {
    const el = track.current; if (!el) return;
    const on = () => setI(Math.round(el.scrollLeft / el.clientWidth));
    el.addEventListener("scroll", on, { passive: true });
    return () => el.removeEventListener("scroll", on);
  }, []);
  const go = (n) => { const el = track.current; const k = Math.max(0, Math.min(slides.length - 1, n)); el.scrollTo({ left: k * el.clientWidth, behavior: "smooth" }); };
  return (
    <section className="carousel" aria-roledescription="carousel" aria-label={label}>
      <div className="ctrack" ref={track} tabIndex={0} onKeyDown={(e) => { if (e.key === "ArrowRight") go(i + 1); if (e.key === "ArrowLeft") go(i - 1); }}>
        {slides.map((s, k) => (
          <figure key={k} className="cslide" aria-roledescription="slide" aria-label={`${k + 1} of ${slides.length}`}>
            {s.node}
            <figcaption><b>{s.title}</b>{s.credit && <span>{s.credit}</span>}</figcaption>
          </figure>
        ))}
      </div>
      {slides.length > 1 && (
        <div className="cnav">
          <button type="button" aria-label="Previous photo" onClick={() => go(i - 1)} disabled={i === 0}>←</button>
          <span className="cdots">{slides.map((_, k) => <button key={k} type="button" aria-label={`Photo ${k + 1}`} aria-current={k === i} onClick={() => go(k)} />)}</span>
          <button type="button" aria-label="Next photo" onClick={() => go(i + 1)} disabled={i === slides.length - 1}>→</button>
        </div>
      )}
    </section>
  );
}

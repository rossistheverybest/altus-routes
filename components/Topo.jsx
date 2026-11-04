"use client";
// Contour-line texture that stands in for a photo until the route's own photo is added.
import { useEffect, useRef } from "react";

export default function Topo({ seed, alpha = 0.3 }) {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current; if (!cv) return;
    const draw = () => {
      const rect = cv.getBoundingClientRect(); if (!rect.width) return;
      const dpr = window.devicePixelRatio || 1;
      cv.width = rect.width * dpr; cv.height = rect.height * dpr;
      const g = cv.getContext("2d"); g.setTransform(dpr, 0, 0, dpr, 0, 0);
      let s = [...seed].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
      const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
      const peaks = [0, 1, 2].map(() => ({ x: rnd() * rect.width, y: rnd() * rect.height * 0.8, h: 0.6 + rnd() * 0.6, r: (0.25 + rnd() * 0.35) * Math.max(rect.width, rect.height) }));
      const f = (x, y) => peaks.reduce((a, p) => a + p.h * Math.exp(-((x - p.x) ** 2 + (y - p.y) ** 2) / (2 * p.r * p.r)), 0);
      g.strokeStyle = "#C79A6B"; g.globalAlpha = alpha; g.lineWidth = 1;
      const step = Math.max(3, Math.round(rect.width / 140));
      for (let lv = 0.08; lv < 1.8; lv += 0.09) {
        g.beginPath();
        for (let x = 0; x < rect.width; x += step) for (let y = 0; y < rect.height; y += step) {
          const a = f(x, y) > lv, b = f(x + step, y) > lv, c = f(x, y + step) > lv;
          if (a !== b) { g.moveTo(x + step / 2, y); g.lineTo(x + step / 2, y + step * 0.8); }
          if (a !== c) { g.moveTo(x, y + step / 2); g.lineTo(x + step * 0.8, y + step / 2); }
        }
        g.stroke();
      }
    };
    draw();
    const ro = new ResizeObserver(draw); ro.observe(cv);
    return () => ro.disconnect();
  }, [seed, alpha]);
  return <canvas ref={ref} className="topo" aria-hidden="true" />;
}

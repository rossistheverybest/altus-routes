"use client";
// Links a drawn line with its list entry on hover, and opens a route when its line on the photo is clicked.
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function Hoverable({ children, hrefs = {}, className }) {
  const ref = useRef(null);
  const router = useRouter();
  useEffect(() => {
    const root = ref.current; if (!root) return;
    const keyOf = (el) => el.dataset.line != null ? ["line", el.dataset.line] : ["cline", el.dataset.cline];
    const els = root.querySelectorAll("[data-line],[data-cline]");
    const on = (el, v) => { const [k, n] = keyOf(el); root.querySelectorAll(`[data-${k}="${n}"]`).forEach((e) => e.classList.toggle("hl", v)); };
    const handlers = [];
    els.forEach((el) => {
      const enter = () => on(el, true), leave = () => on(el, false);
      const click = () => { const s = el.dataset.route; if (el.tagName.toLowerCase() === "g" && s && hrefs[s]) router.push(hrefs[s]); };
      el.addEventListener("mouseenter", enter); el.addEventListener("mouseleave", leave); el.addEventListener("click", click);
      handlers.push(() => { el.removeEventListener("mouseenter", enter); el.removeEventListener("mouseleave", leave); el.removeEventListener("click", click); });
    });
    return () => handlers.forEach((h) => h());
  }, [hrefs, router]);
  return <div ref={ref} className={className}>{children}</div>;
}

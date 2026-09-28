import { useEffect, useRef, useState, type ReactNode } from "react";
export const money = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
export const count = (value: number) => new Intl.NumberFormat("en-IN").format(value);
export const title = (value: string) => value.replace(/\b\w/g, (letter) => letter.toUpperCase());
export function SectionHeader({ number, label, children, copy }: { number: string; label: string; children: ReactNode; copy?: string }) {
  return <div className="ai-section-header"><span className="ai-eyebrow">{number} / {label}</span><h2>{children}</h2>{copy && <p>{copy}</p>}</div>;
}
export function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = ref.current; if (!node) return;
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { node.classList.add("is-revealed"); observer.disconnect(); } }, { threshold: 0.08 });
    observer.observe(node); return () => observer.disconnect();
  }, []);
  return <div ref={ref} className={`ai-reveal ${className}`}>{children}</div>;
}
export function Counter({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null), [display, setDisplay] = useState(value);
  useEffect(() => {
    const node = ref.current; if (!node || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return; observer.disconnect();
      const start = performance.now();
      const tick = (now: number) => { const progress = Math.min(1, (now - start) / 850); setDisplay(Math.round(value * (1 - (1 - progress) ** 3))); if (progress < 1) frame = requestAnimationFrame(tick); };
      frame = requestAnimationFrame(tick);
    });
    observer.observe(node); return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, [value]);
  return <span ref={ref} aria-label={count(value)}>{count(display)}</span>;
}

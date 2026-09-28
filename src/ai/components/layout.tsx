import { useEffect, useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
const links = [
  { id: "overview", label: "Overview" },
  { id: "data", label: "Data" },
  { id: "models", label: "Models" },
  { id: "performance", label: "Performance" },
  { id: "predict", label: "Predict" },
  { id: "insights", label: "Insights" },
];
export function Navbar() {
  const [open, setOpen] = useState(false),
    [active, setActive] = useState("overview"),
    [progress, setProgress] = useState(0);
  useEffect(() => {
    const scroll = () => {
      const maximum = document.documentElement.scrollHeight - innerHeight;
      setProgress(maximum > 0 ? scrollY / maximum : 0);
    };
    scroll();
    window.addEventListener("scroll", scroll, { passive: true });
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting) setActive(entry.target.id);
      },
      { rootMargin: "-15% 0px -60% 0px" },
    );
    for (const link of links) {
      const node = document.getElementById(link.id);
      if (node) observer.observe(node);
    }
    return () => {
      window.removeEventListener("scroll", scroll);
      observer.disconnect();
    };
  }, []);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const toggle = document.querySelector<HTMLButtonElement>(".ai-menu-button");
    const focusables = [
      ...document.querySelectorAll<HTMLAnchorElement>("#ai-navigation a"),
      ...(toggle ? [toggle] : []),
    ];
    focusables[0]?.focus();
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
      if (event.key === "Tab") {
        const first = focusables[0],
          last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", escape);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", escape);
      toggle?.focus();
    };
  }, [open]);
  return (
    <header className={`ai-nav ${progress > 0.015 ? "scrolled" : ""}`}>
      <a className="ai-wordmark" href="#overview">
        CARDEKHO<span>AI</span>
        <small>USED CAR PRICE INTELLIGENCE</small>
      </a>
      <nav
        id="ai-navigation"
        className={open ? "open" : ""}
        aria-label="CarDekho AI navigation"
      >
        {links.map((link) => (
          <a
            key={link.id}
            href={`#${link.id}`}
            aria-current={active === link.id ? "location" : undefined}
            onClick={() => setOpen(false)}
          >
            {link.label}
          </a>
        ))}
      </nav>
      <a className="ai-nav-cta" href="#predict">
        VALUE YOUR CAR <ArrowUpRight size={16} />
      </a>
      <button
        className="ai-menu-button"
        onClick={() => setOpen(!open)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="ai-navigation"
      >
        {open ? <X /> : <Menu />}
      </button>
      <div
        className="ai-scroll-progress"
        style={{ transform: `scaleX(${progress})` }}
      />
    </header>
  );
}
export function Footer() {
  return (
    <footer className="ai-footer">
      <div className="ai-footer-wordmark">
        CARDEKHO <span>AI</span>
      </div>
      <div className="ai-footer-top">
        <span>USED CAR PRICE INTELLIGENCE</span>
        <a href="../">OPEN THE ORIGINAL EXPERIENCE ↗</a>
      </div>
      <div className="ai-footer-links">
        {links.map((link) => (
          <a href={`#${link.id}`} key={link.id}>
            {link.label}
          </a>
        ))}
      </div>
      <div className="ai-footer-bottom">
        <p>
          Academic machine-learning project using historical CarDekho listings.
          <br />
          Not affiliated with CarDekho, Ferrari or Lamborghini. Estimates do not
          replace inspection.
        </p>
        <span>PYTHON / SCIKIT-LEARN / REACT / FASTAPI</span>
        <a href="../web/media/ASSET_CREDITS.md">ASSET CREDITS ↗</a>
      </div>
    </footer>
  );
}

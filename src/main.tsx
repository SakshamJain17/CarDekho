import { lazy, Suspense, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { ArrowDown, ArrowRight, ArrowUpRight, Menu, MoveUpRight, X } from "lucide-react";
import "@/styles/index.css";

const CarShowroom = lazy(() => import("@/components/ui/car-showroom"));
function LandingExperience() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showroomOpen, setShowroomOpen] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) if (entry.isIntersecting) { entry.target.classList.add("revealed"); observer.unobserve(entry.target); }
    }, { threshold: 0.12 });
    document.querySelectorAll("[data-reveal]").forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);
  function chooseDataset(key: string) {
    const select = document.getElementById("dataset") as HTMLSelectElement | null;
    if (select && !select.disabled) { select.value = key; select.dispatchEvent(new Event("change", { bubbles: true })); }
    document.getElementById("workspace")?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }
  return <>
    <header className="editorial-nav">
      <a href="#" className="editorial-brand" aria-label="CarDekho home"><span className="brand-symbol">CD<span>↗</span></span><span>CARDEKHO<small>PRICE INTELLIGENCE</small></span></a>
      <nav aria-label="Main navigation" className={menuOpen ? "editorial-links open" : "editorial-links"}><a href="#showroom" onClick={() => setMenuOpen(false)}>The experience</a><a href="#collections" onClick={() => setMenuOpen(false)}>The collections</a><a href="#workspace" onClick={() => setMenuOpen(false)}>The price lab</a></nav>
      <a href="#workspace" className="nav-valuation">Discover your value <ArrowUpRight size={15} /></a>
      <button className="nav-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-label={menuOpen ? "Close navigation" : "Open navigation"}>{menuOpen ? <X size={22} /> : <Menu size={22} />}</button>
    </header>
    <section className="campaign-hero" aria-labelledby="campaign-title">
      <img className="campaign-image" src="web/media/grand-tourer-hero.png" alt="An original red grand touring coupe in a mountain-side automotive studio at dusk" fetchPriority="high" width="1672" height="941" />
      <div className="campaign-shade" />
      <div className="campaign-copy"><span className="campaign-kicker"><i /> THE ART OF UNDERSTANDING VALUE</span><h1 id="campaign-title">MORE THAN<br />A MACHINE.<br /><em>A perspective.</em></h1><p>Every line tells a story.<br />Every detail shapes its value.</p><a className="campaign-button" href="#workspace">DISCOVER YOUR VALUE <span><ArrowUpRight size={21} /></span></a></div>
      <div className="campaign-bottom"><a href="#showroom"><ArrowDown size={16} /> SCROLL TO DISCOVER</a><span>CARDEKHO / PRICE LAB — 01</span><span className="campaign-caption">ORIGINAL CONCEPT ART / NOT A LISTED VEHICLE</span></div>
    </section>
    <section className="editorial-intro" data-reveal>
      <div className="intro-meta"><span>PASSION, MEET PRECISION.</span><span>01 / OUR PHILOSOPHY</span></div>
      <div className="intro-grid"><h2>A car has character.<br />Its value has <em>evidence.</em></h2><div><p>Look beyond the badge. Explore the engineering, the ownership, and the data behind every estimate. A considered approach to vehicle value, built for the curious.</p><a href="#workspace" className="text-link">Explore the intelligence <ArrowUpRight size={18} /></a></div></div>
      <div className="editorial-stats"><div><strong>04</strong><span>DATA COLLECTIONS</span></div><div><strong>03</strong><span>REGRESSION ALGORITHMS</span></div><div><strong>12</strong><span>TRAINED EXPERIMENTS</span></div><div><strong>100%</strong><span>BROWSER-SIDE INFERENCE</span></div></div>
    </section>
    <section id="showroom" className="showroom-section">
      <div className="showroom-heading" data-reveal><div><span className="campaign-kicker">02 / THE DIGITAL SHOWROOM</span><h2>Every angle.<br /><em>Extraordinary.</em></h2></div><p>A real-time 3D study in form, light, and material.<br />Drag to explore. Choose your finish.</p></div>
      {showroomOpen ? <Suspense fallback={<div className="showroom-loading" role="status">PREPARING THE DIGITAL SHOWROOM…</div>}><CarShowroom /></Suspense> : <div className="showroom-preview"><img src="web/media/car-concept-poster.jpg" alt="Preview of the interactive concept-car showroom" loading="lazy" /><button className="showroom-enter" onClick={() => setShowroomOpen(true)}><span className="round-arrow"><MoveUpRight size={26} /></span><strong>ENTER THE 3D EXPERIENCE</strong><small>Loads a locally hosted 10.3 MB concept car</small></button></div>}
      <div className="showroom-disclaimer"><span>CONCEPT CAR / VISUAL EXPERIENCE ONLY</span><span>The showroom vehicle does not represent your selected listing. Paint changes do not change price predictions.</span></div>
    </section>
    <section id="collections" className="collections-section" data-reveal>
      <div className="collection-heading"><div><span className="eyebrow">03 / THE COLLECTIONS</span><h2>Four lenses.<br /><em>One pursuit.</em></h2></div><p>Distinct data. Distinct stories.<br />Choose a collection to enter the price lab.</p></div>
      <div className="collection-grid">{[
        { key: "v3", number: "01", name: "The engineering edit", subtitle: "Engine. Power. Efficiency.", rows: "6,926", type: "DETAILED SPECIFICATIONS" },
        { key: "v4", number: "02", name: "The contemporary edit", subtitle: "Dimensions. Location. Drivetrain.", rows: "2,059", type: "EXPANDED VEHICLE DETAILS" },
        { key: "basic", number: "03", name: "The essentials edit", subtitle: "The fundamentals of ownership.", rows: "3,577", type: "CORE VEHICLE LISTINGS" },
        { key: "small", number: "04", name: "The mixed-vehicle edit", subtitle: "Cars and motorcycles together.", rows: "299", type: "SMALL / MIXED VEHICLES" },
      ].map((c) => <button key={c.key} className={`collection-card collection-${c.key}`} onClick={() => chooseDataset(c.key)}><div className="collection-top"><span>{c.number} / {c.key.toUpperCase()}</span><ArrowUpRight size={25} /></div><span className="collection-rule" /><small>{c.type}</small><h3>{c.name}</h3><p>{c.subtitle}</p><div className="collection-count"><strong>{c.rows}</strong><span>CLEANED RECORDS</span></div></button>)}</div>
      <p className="collection-footnote">Collections remain separate because features and vehicle populations differ. Record counts are not a count of unique vehicles across all sources.</p>
    </section>
    <div className="lab-introduction" data-reveal><span>04 / PRICE INTELLIGENCE</span><h2>Now, make it <em>yours.</em></h2><a href="#workspace">ENTER THE PRICE LAB <ArrowRight size={19} /></a></div>
  </>;
}
const root = document.getElementById("cinematic-hero");
if (root) createRoot(root).render(<LandingExperience />);

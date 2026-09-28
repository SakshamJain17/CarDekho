import { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { HeroScrub } from "@/components/ui/hero-scrub";
import "@/styles/index.css";

// Stable reference avoids restarting the component's preload effect on renders.
const frameUrl = (i: number) =>
  `https://raw.githubusercontent.com/duthiljean/ferrari-hero-demo/main/${String(i + 1).padStart(4, "0")}.webp`;

function LandingHero() {
  useEffect(() => {
    const workspace = document.getElementById("workspace");
    const sidebar = document.getElementById("sidebar");
    const menu = document.getElementById("menu-button");
    if (!workspace) return;
    const update = () => {
      const inIntro = workspace.getBoundingClientRect().top > window.innerHeight * 0.3;
      document.body.classList.toggle("hero-active", inIntro);
      if (sidebar) sidebar.inert = inIntro;
      if (menu) menu.inert = inIntro;
    };
    const observer = new IntersectionObserver(update, { threshold: [0, 0.1, 0.3] });
    observer.observe(workspace);
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      document.body.classList.remove("hero-active");
      if (sidebar) sidebar.inert = false;
      if (menu) menu.inert = false;
    };
  }, []);

  return (
    <div className="landing-shell">
      <header className="landing-nav">
        <a href="#workspace" className="landing-brand">CARDEKHO <span>/ PRICE INTELLIGENCE</span></a>
        <a href="#workspace" className="landing-cta">Explore the price lab <ArrowUpRight size={15} aria-hidden /></a>
      </header>
      <HeroScrub
        frameCount={300}
        frameUrl={frameUrl}
        titleTop="CARDEKHO"
        titleBottom="PRICE LAB"
        accentHex="#141416"
        posterUrl="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1600&q=80"
      />
      <a href="#workspace" className="landing-scroll">EXPLORE THE DATA <ArrowDown size={13} aria-hidden /></a>
    </div>
  );
}

const root = document.getElementById("cinematic-hero");
if (root) createRoot(root).render(<LandingHero />);

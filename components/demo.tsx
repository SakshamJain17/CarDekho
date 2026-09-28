import { HeroScrub } from "@/components/ui/hero-scrub";

export default function Demo() {
  return (
    <HeroScrub
      frameCount={300}
      frameUrl={(i) =>
        `https://raw.githubusercontent.com/duthiljean/ferrari-hero-demo/main/${String(i + 1).padStart(4, "0")}.webp`
      }
      titleTop="Ferrari"
      titleBottom="Amalfi"
      accentHex="#3a9b8a"
    />
  );
}

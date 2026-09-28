import { useEffect, useRef, useState } from "react";
import { Pause, Play, X } from "lucide-react";

export const drivingPoster = new URL(
  "../web/media/driving-intro-poster.jpg",
  document.baseURI,
).href;
const filmUrl = new URL("../web/media/driving-intro.mp4", document.baseURI)
  .href;
const sourceUrl =
  "https://mixkit.co/free-stock-video/a-red-sports-car-traveling-along-a-curvy-asphalt-road-52427/";

export default function HeroFilm() {
  const connection = (
    navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    }
  ).connection;
  const conserveData = Boolean(
    connection?.saveData ||
    ["slow-2g", "2g"].includes(connection?.effectiveType || ""),
  );
  const [enabled, setEnabled] = useState(
    () =>
      !conserveData && !matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [paused, setPaused] = useState(false),
    [playing, setPlaying] = useState(false),
    [hasFrame, setHasFrame] = useState(false),
    [failed, setFailed] = useState(false),
    [filmOpen, setFilmOpen] = useState(false);
  const video = useRef<HTMLVideoElement>(null),
    dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const query = matchMedia("(prefers-reduced-motion: reduce)");
    const changed = () => {
      setEnabled(!query.matches && !conserveData);
      if (query.matches) setPaused(true);
    };
    query.addEventListener("change", changed);
    return () => query.removeEventListener("change", changed);
  }, [conserveData]);
  useEffect(() => {
    const node = video.current;
    if (!node || !enabled || failed) return;
    let visible = true;
    const synchronize = () => {
      if (visible && !document.hidden && !paused && !filmOpen)
        node.play().catch(() => setPlaying(false));
      else node.pause();
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        synchronize();
      },
      { threshold: 0.1 },
    );
    observer.observe(node);
    document.addEventListener("visibilitychange", synchronize);
    synchronize();
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", synchronize);
      node.pause();
    };
  }, [enabled, paused, failed, filmOpen]);
  useEffect(() => {
    const node = dialog.current;
    if (!filmOpen || !node) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    node.showModal();
    node
      .querySelector("video")
      ?.play()
      .catch(() => undefined);
    return () => {
      node.querySelector("video")?.pause();
      if (node.open) node.close();
      document.body.style.overflow = previous;
    };
  }, [filmOpen]);
  function toggle() {
    if (playing) {
      setPaused(true);
      video.current?.pause();
    } else {
      setEnabled(true);
      setPaused(false);
      if (video.current) {
        if (!video.current.getAttribute("src")) video.current.src = filmUrl;
        video.current.play().catch(() => setPlaying(false));
      }
    }
  }
  return (
    <>
      <img
        className="performance-hero-image"
        src={drivingPoster}
        alt="Real stock-footage frame of a red car driving on a winding countryside road"
        width="1920"
        height="1080"
        fetchPriority="high"
      />
      <video
        ref={video}
        className={`performance-hero-video ${enabled && hasFrame && !failed ? "has-frame" : ""}`}
        src={enabled ? filmUrl : undefined}
        poster={drivingPoster}
        muted
        loop
        playsInline
        preload={enabled ? "auto" : "none"}
        aria-hidden="true"
        tabIndex={-1}
        onPlaying={() => {
          setPlaying(true);
          setHasFrame(true);
        }}
        onPause={() => setPlaying(false)}
        onLoadedData={() => setHasFrame(true)}
        onError={() => {
          setFailed(true);
          setPlaying(false);
        }}
      />
      <div className="performance-video-controls">
        <button
          onClick={toggle}
          disabled={failed}
          aria-label={playing ? "Pause homepage video" : "Play homepage video"}
          aria-pressed={playing}
        >
          {playing ? <Pause size={15} /> : <Play size={15} />}
          <span>
            {failed
              ? "VIDEO UNAVAILABLE"
              : playing
                ? "PAUSE MOTION"
                : "PLAY MOTION"}
          </span>
        </button>
        <button onClick={() => setFilmOpen(true)}>
          <Play size={15} />
          <span>WATCH THE INTRO</span>
        </button>
      </div>
      <span className="performance-image-note">
        REAL DRIVING FOOTAGE /{" "}
        <a href={sourceUrl} target="_blank" rel="noreferrer">
          MIXKIT CREDIT ↗
        </a>
      </span>
      <dialog
        ref={dialog}
        className="performance-film-dialog"
        aria-labelledby="performance-film-title"
        onClose={() => setFilmOpen(false)}
        onClick={(event) => {
          if (event.target === dialog.current) dialog.current.close();
        }}
      >
        <div className="performance-film-header">
          <div>
            <span>THE INTRO / REAL FOOTAGE</span>
            <h2 id="performance-film-title">THE ROAD. THE CAR. THE STORY.</h2>
          </div>
          <button
            aria-label="Close intro film"
            onClick={() => dialog.current?.close()}
          >
            <X />
          </button>
        </div>
        <video
          src={filmOpen ? filmUrl : undefined}
          poster={drivingPoster}
          controls
          playsInline
          preload="metadata"
          aria-label="Real driving intro film"
        />
        <p>
          Licensed stock-driving footage, not the vehicle configured in the
          predictor. This is a silent film.
          <a href={sourceUrl} target="_blank" rel="noreferrer">
            SOURCE &amp; CREDIT ↗
          </a>
        </p>
      </dialog>
    </>
  );
}

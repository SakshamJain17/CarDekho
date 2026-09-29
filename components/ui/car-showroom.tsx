import { useEffect, useRef, useState, type CSSProperties } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { KTX2Loader } from "three/addons/loaders/KTX2Loader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { Maximize2, Minimize2, Pause, Play, RotateCcw } from "lucide-react";

const finishes = [{ name: "Carmine", color: "#a80c24" }, { name: "Pearl", color: "#d8d8d1" }, { name: "Graphite", color: "#252932" }, { name: "Champagne", color: "#b39b71" }];
export default function CarShowroom({ assetBase = "web/media/", studio = "standard" }: { assetBase?: string; studio?: "standard" | "performance" }) {
  const mount = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const paintRef = useRef<THREE.MeshPhysicalMaterial[]>([]);
  const reduced = useRef(matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [status, setStatus] = useState("Loading the concept car…");
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [finish, setFinish] = useState(studio === "performance" ? 2 : 0);
  const [rotating, setRotating] = useState(!reduced.current);
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    const host = mount.current;
    if (!host) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" }); }
    catch { setFailed(true); setStatus("3D isn't available on this device. The price lab still works."); return; }
    let disposed = false, visible = true;
    const cinematic = studio === "performance";
    const scene = new THREE.Scene(); scene.background = new THREE.Color(cinematic ? "#08090a" : "#101011");
    if (cinematic) scene.fog = new THREE.Fog(0x08090a, 9, 28);
    const camera = new THREE.PerspectiveCamera(cinematic ? 30 : 34, 1, 0.05, 100);
    const defaultPosition = cinematic ? new THREE.Vector3(4.6, 1.65, 5.0) : new THREE.Vector3(6.6, 2.65, 7.6); camera.position.copy(defaultPosition);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = cinematic ? 0.85 : 1.05;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.setAttribute("aria-label", "Interactive concept car. Drag to rotate or use the arrow keys; plus and minus zoom.");
    renderer.domElement.tabIndex = 0; host.appendChild(renderer.domElement);
    const controls = new OrbitControls(camera, renderer.domElement); controlsRef.current = controls;
    controls.target.set(0, 0.55, 0); controls.enableDamping = true; controls.dampingFactor = 0.06;
    controls.enablePan = false; controls.minDistance = 4.5; controls.maxDistance = 13;
    controls.minPolarAngle = 0.3; controls.maxPolarAngle = Math.PI / 2 - 0.025;
    controls.autoRotate = !reduced.current; controls.autoRotateSpeed = 0.38; controls.saveState(); controls.update();
    const pmrem = new THREE.PMREMGenerator(renderer), environment = new RoomEnvironment();
    const environmentTexture = pmrem.fromScene(environment, 0.04); scene.environment = environmentTexture.texture;
    environment.dispose(); pmrem.dispose();
    if (cinematic) scene.environmentIntensity = 0.55;
    scene.add(new THREE.HemisphereLight(0xd8e0f2, 0x393333, cinematic ? 0.7 : 1.3));
    const key = new THREE.DirectionalLight(0xffffff, cinematic ? 2.5 : 4); key.position.set(3, 7, 4); key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024); key.shadow.camera.left = -5; key.shadow.camera.right = 5;
    key.shadow.camera.top = 5; key.shadow.camera.bottom = -5; key.shadow.normalBias = 0.025; scene.add(key);
    const rim = new THREE.DirectionalLight(0xd1dfff, cinematic ? 1.4 : 2.2); rim.position.set(-5, 3, -4); scene.add(rim);
    const floor = new THREE.Mesh(cinematic ? new THREE.PlaneGeometry(200, 200) : new THREE.CircleGeometry(20, 96), new THREE.MeshStandardMaterial({ color: cinematic ? 0x080a0b : 0x171719, roughness: cinematic ? 0.86 : 0.78, metalness: cinematic ? 0.05 : 0.15 }));
    floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
    const platform = new THREE.Mesh(new THREE.CylinderGeometry(3.7, 3.8, 0.035, 96), new THREE.MeshStandardMaterial({ color: cinematic ? 0x101214 : 0x222225, roughness: cinematic ? 0.82 : 0.66, metalness: cinematic ? 0.12 : 0.25 }));
    platform.position.y = -0.03; platform.receiveShadow = true; scene.add(platform);
    const ktx = new KTX2Loader().setTranscoderPath(new URL(`${assetBase}basis/`, document.baseURI).href).detectSupport(renderer);
    const loader = new GLTFLoader().setKTX2Loader(ktx);
    const disposeObject = (object: THREE.Object3D) => object.traverse((node) => {
      if (!(node instanceof THREE.Mesh)) return;
      node.geometry.dispose();
      for (const material of Array.isArray(node.material) ? node.material : [node.material]) {
        for (const value of Object.values(material)) if (value instanceof THREE.Texture) value.dispose();
        material.dispose();
      }
    });
    loader.load(new URL(`${assetBase}car-concept.glb`, document.baseURI).href, (gltf) => {
      if (disposed) { disposeObject(gltf.scene); return; }
      const car = gltf.scene, bounds = new THREE.Box3().setFromObject(car), size = bounds.getSize(new THREE.Vector3());
      car.scale.setScalar(4.8 / Math.max(size.x, size.z));
      const scaled = new THREE.Box3().setFromObject(car), center = scaled.getCenter(new THREE.Vector3());
      car.position.set(-center.x, -scaled.min.y + 0.02, -center.z); car.rotation.y = Math.PI * 0.1;
      const paint = new Set<THREE.MeshPhysicalMaterial>();
      car.traverse((node) => {
        if (!(node instanceof THREE.Mesh)) return;
        node.castShadow = true; node.receiveShadow = true;
        for (const material of Array.isArray(node.material) ? node.material : [node.material]) {
          if (material instanceof THREE.MeshPhysicalMaterial && /Paint [12]/i.test(material.name)) {
            material.color.set(finishes[cinematic ? 2 : 0].color); material.clearcoat = 1; material.clearcoatRoughness = cinematic ? 0.18 : 0.12;
            if (cinematic) material.roughness = Math.max(material.roughness, 0.25);
            paint.add(material);
          }
        }
      });
      paintRef.current = [...paint]; scene.add(car); setReady(true); setStatus("Drag to rotate · Scroll over the car to zoom");
    }, (event) => {
      if (!disposed && event.total) setStatus(`Loading the concept car · ${Math.round(event.loaded / event.total * 100)}%`);
    }, () => { if (!disposed) { setFailed(true); setStatus("The 3D asset couldn't load. Please refresh; predictions remain available."); } });
    const resize = () => {
      if (disposed || !host.clientWidth || !host.clientHeight) return;
      camera.aspect = host.clientWidth / host.clientHeight;
      camera.position.copy(defaultPosition).multiplyScalar(host.clientWidth < 600 ? 1.2 : 1);
      camera.updateProjectionMatrix(); renderer.setSize(host.clientWidth, host.clientHeight); controls.update();
    };
    const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(host); resize();
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, { rootMargin: "100px" }); observer.observe(host);
    let previous = performance.now();
    renderer.setAnimationLoop((now) => {
      const delta = Math.min((now - previous) / 1000, 0.1); previous = now;
      if (visible && !document.hidden) { controls.update(delta); renderer.render(scene, camera); }
    });
    const keyboard = (event: KeyboardEvent) => {
      if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "+", "=", "-"].includes(event.key)) return;
      event.preventDefault(); controls.autoRotate = false; setRotating(false);
      const spherical = new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
      if (event.key === "ArrowLeft") spherical.theta -= 0.15;
      if (event.key === "ArrowRight") spherical.theta += 0.15;
      if (event.key === "ArrowUp") spherical.phi = Math.max(controls.minPolarAngle, spherical.phi - 0.1);
      if (event.key === "ArrowDown") spherical.phi = Math.min(controls.maxPolarAngle, spherical.phi + 0.1);
      if (event.key === "+" || event.key === "=") spherical.radius = Math.max(controls.minDistance, spherical.radius * 0.9);
      if (event.key === "-") spherical.radius = Math.min(controls.maxDistance, spherical.radius * 1.1);
      camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(spherical)); controls.update();
    };
    const stopRotation = () => { controls.autoRotate = false; setRotating(false); };
    const contextLost = (event: Event) => { event.preventDefault(); setFailed(true); setStatus("Graphics context lost. Refresh to restart the showroom; the price lab remains available."); };
    renderer.domElement.addEventListener("keydown", keyboard); renderer.domElement.addEventListener("webglcontextlost", contextLost);
    controls.addEventListener("start", stopRotation);
    const motionQuery = matchMedia("(prefers-reduced-motion: reduce)");
    const motionChange = () => { reduced.current = motionQuery.matches; if (motionQuery.matches) stopRotation(); };
    motionQuery.addEventListener("change", motionChange);
    return () => {
      disposed = true; renderer.setAnimationLoop(null); resizeObserver.disconnect(); observer.disconnect();
      motionQuery.removeEventListener("change", motionChange); renderer.domElement.removeEventListener("keydown", keyboard);
      renderer.domElement.removeEventListener("webglcontextlost", contextLost); controls.removeEventListener("start", stopRotation);
      controls.dispose(); controlsRef.current = null; paintRef.current = []; ktx.dispose(); disposeObject(scene);
      environmentTexture.dispose(); renderer.dispose(); renderer.domElement.remove();
    };
  }, [assetBase, studio]);
  function changeFinish(index: number) { setFinish(index); for (const material of paintRef.current) material.color.set(finishes[index].color); }
  function toggleRotation() { if (controlsRef.current) controlsRef.current.autoRotate = !rotating; setRotating(!rotating); }
  return <div className={`car-showroom ${expanded ? "expanded" : ""}`}>
    <div className="three-mount" ref={mount} />
    {failed && <img className="showroom-fallback" src={`${assetBase}car-concept-poster.jpg`} alt="Concept car shown as a static fallback" />}
    <div className="viewer-label"><span>CAR CONCEPT / MATERIAL STUDY</span><strong>{finishes[finish].name}</strong></div>
    <div className="viewer-status" role="status" aria-live="polite">{status}</div>
    <div className="viewer-controls"><div className="paint-controls" role="group" aria-label="Car paint finish">{finishes.map((item, index) => <button key={item.name} style={{ "--swatch": item.color } as CSSProperties} onClick={() => changeFinish(index)} disabled={!ready || failed} aria-label={`${item.name} paint`} aria-pressed={finish === index} title={item.name} />)}</div><div className="camera-controls"><button disabled={!ready || failed} onClick={toggleRotation} aria-label={rotating ? "Pause rotation" : "Start rotation"}>{rotating ? <Pause size={18} /> : <Play size={18} />}</button><button disabled={!ready || failed} onClick={() => { controlsRef.current?.reset(); if (controlsRef.current) controlsRef.current.autoRotate = false; setRotating(false); }} aria-label="Reset camera"><RotateCcw size={18} /></button><button onClick={() => setExpanded(!expanded)} aria-label={expanded ? "Reduce showroom size" : "Expand showroom"}>{expanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}</button></div></div>
    <div className="viewer-credit">3D: Eric Chadwick / DGG, via Khronos · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a></div>
  </div>;
}

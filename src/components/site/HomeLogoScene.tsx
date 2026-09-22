"use client";

import { useEffect, useRef, type RefObject } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { gsap, pageScrollRange } from "@/lib/animations/gsap";

function disposeModel(root: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  root.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    geometries.add(object.geometry);
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      materials.add(material);
      for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value);
    }
    if (object instanceof THREE.SkinnedMesh) object.skeleton.dispose();
  });
  textures.forEach(texture => {
    const image = texture.source.data;
    if (typeof ImageBitmap !== "undefined" && image instanceof ImageBitmap) image.close();
    texture.dispose();
  });
  materials.forEach(material => material.dispose());
  geometries.forEach(geometry => geometry.dispose());
}

export default function HomeLogoScene({ track, onError }: { track: RefObject<HTMLDivElement | null>; onError: () => void }) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const section = track.current;
    if (!host || !section) return;
    let disposed = false;
    let visible = false;
    let frame = 0;
    let renderer: THREE.WebGLRenderer | undefined;
    let model: THREE.Object3D | undefined;
    let environment: THREE.WebGLRenderTarget | undefined;
    let animation: gsap.core.Tween | undefined;
    let resizeObserver: ResizeObserver | undefined;
    const abort = new AbortController();
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
    const pivot = new THREE.Group();
    scene.add(pivot);

    const render = () => {
      frame = 0;
      if (disposed || !visible || document.hidden || !renderer || !model) return;
      renderer.render(scene, camera);
      host.dataset.ready = "true";
      // Useful for regression checks without exposing objects on window.
      host.dataset.rotation = String(pivot.rotation.y);
    };
    const requestRender = () => {
      if (!frame && !disposed && visible && !document.hidden) frame = requestAnimationFrame(render);
    };
    const updateVisibility = () => {
      if (visible && !document.hidden) {
        animation?.scrollTrigger?.enable(false, true);
        requestRender();
      } else {
        animation?.scrollTrigger?.disable(false);
        cancelAnimationFrame(frame);
        frame = 0;
      }
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      updateVisibility();
    });
    observer.observe(host);
    document.addEventListener("visibilitychange", updateVisibility);
    const lostContext = (event: Event) => { event.preventDefault(); if (!disposed) onError(); };

    async function initialize() {
      try {
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
        renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
        renderer.setClearColor(0x000000, 0);
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 0.95;
        renderer.domElement.style.cssText = "width:100%;height:100%;display:block";
        renderer.domElement.addEventListener("webglcontextlost", lostContext);
        host.appendChild(renderer.domElement);

        const room = new RoomEnvironment();
        const pmrem = new THREE.PMREMGenerator(renderer);
        try { environment = pmrem.fromScene(room, 0.04); }
        finally { room.dispose(); pmrem.dispose(); }
        scene.environment = environment.texture;
        scene.environmentIntensity = 0.55;
        scene.add(new THREE.HemisphereLight(0xffffff, 0x70839c, 0.7));
        const key = new THREE.DirectionalLight(0xfff5e8, 1.2);
        key.position.set(3, 4, 5);
        scene.add(key);
        const fill = new THREE.DirectionalLight(0xc7e1ff, 0.5);
        fill.position.set(-4, 1, 3);
        scene.add(fill);

        const response = await fetch("/servitec_logo_3d.glb", { signal: abort.signal });
        if (!response.ok) throw new Error("Logo model unavailable");
        const gltf = await new GLTFLoader().parseAsync(await response.arrayBuffer(), "/");
        if (disposed) { disposeModel(gltf.scene); return; }
        model = gltf.scene;
        const bounds = new THREE.Box3().setFromObject(model);
        const center = bounds.getCenter(new THREE.Vector3());
        const size = bounds.getSize(new THREE.Vector3());
        model.position.sub(center);
        pivot.add(model);
        // The supplied GLB's front is +Z. A sphere fit keeps every angle in view.
        const radius = size.length() / 2;
        const resize = () => {
          if (!renderer || disposed) return;
          const { width, height } = host.getBoundingClientRect();
          if (!width || !height) return;
          renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
          renderer.setSize(width, height, false);
          camera.aspect = width / height;
          const verticalFov = THREE.MathUtils.degToRad(camera.fov / 2);
          const fitAngle = Math.min(verticalFov, Math.atan(Math.tan(verticalFov) * camera.aspect));
          camera.position.set(0, 0, radius / Math.sin(fitAngle) * 1.08);
          camera.updateProjectionMatrix();
          animation?.scrollTrigger?.refresh();
          requestRender();
        };
        resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(host);
        resizeObserver.observe(document.body);
        resize();
        animation = gsap.fromTo(pivot.rotation, { y: 0 }, {
          y: Math.PI * 2, ease: "none",
          onUpdate: requestRender,
          scrollTrigger: {
            id: "servitec-home-logo",
            ...pageScrollRange(),
            scrub: 0.25, invalidateOnRefresh: true,
          },
        });
        updateVisibility();
        requestRender();
      } catch {
        if (!disposed) onError();
      }
    }
    void initialize();
    return () => {
      disposed = true;
      abort.abort();
      observer.disconnect();
      resizeObserver?.disconnect();
      document.removeEventListener("visibilitychange", updateVisibility);
      animation?.scrollTrigger?.kill();
      animation?.kill();
      cancelAnimationFrame(frame);
      if (model) disposeModel(model);
      scene.clear();
      environment?.dispose();
      if (renderer) {
        renderer.domElement.removeEventListener("webglcontextlost", lostContext);
        renderer.dispose();
        renderer.forceContextLoss();
        renderer.domElement.remove();
      }
    };
  }, [track, onError]);

  return <div ref={hostRef} aria-hidden="true" className="absolute inset-0" data-logo-scene />;
}

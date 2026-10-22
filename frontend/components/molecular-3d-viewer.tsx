"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RotateCcw, Play, Pause, Maximize2, Layers } from "lucide-react";

interface Atom {
  index: number;
  element: string;
  atomic_num: number;
  x: number;
  y: number;
  z: number;
  is_aromatic?: boolean;
}

interface Bond {
  source: number;
  target: number;
  order: number;
  is_aromatic?: boolean;
}

interface Conformer3D {
  atoms: Atom[];
  bonds: Bond[];
  optimization_method?: string;
}

interface Molecular3DViewerProps {
  conformer?: Conformer3D | null;
  svgFallback?: string;
  className?: string;
}

const CPK_COLORS: Record<string, number> = {
  C: 0x43e5f5,   // Cyan accent for carbon in scientific dark theme
  H: 0xf2f6fc,   // Crisp white
  O: 0xff4f5e,   // Vivid red
  N: 0x638bff,   // Vivid blue
  S: 0xf5c842,   // Amber yellow
  P: 0xff8e3c,   // Warm orange
  F: 0x24d49a,   // Halogen teal/green
  Cl: 0x24d49a,
  Br: 0x9b51e0,  // Purple
  I: 0x7b2cbf,
};

const ATOM_RADII: Record<string, number> = {
  H: 0.28,
  C: 0.45,
  N: 0.42,
  O: 0.40,
  F: 0.38,
  P: 0.52,
  S: 0.52,
  Cl: 0.48,
  Br: 0.55,
  I: 0.60,
};

export default function Molecular3DViewer({
  conformer,
  svgFallback,
  className = "h-80 w-full",
}: Molecular3DViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRotating, setIsRotating] = useState(true);
  const [viewMode, setViewMode] = useState<"ball_and_stick" | "spacefill">("ball_and_stick");
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const molGroupRef = useRef<THREE.Group | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!containerRef.current || !conformer || !conformer.atoms || conformer.atoms.length === 0) {
      return;
    }

    const container = containerRef.current;
    const width = container.clientWidth || 400;
    const height = container.clientHeight || 320;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;

    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // 2. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x43e5f5, 1.2);
    dirLight1.position.set(10, 15, 20);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x638bff, 0.8);
    dirLight2.position.set(-10, -10, -15);
    scene.add(dirLight2);

    // 3. Molecular Group & Center of Mass normalization
    const molGroup = new THREE.Group();
    molGroupRef.current = molGroup;
    scene.add(molGroup);

    let cx = 0, cy = 0, cz = 0;
    const atoms = conformer.atoms;
    atoms.forEach((a) => {
      cx += a.x;
      cy += a.y;
      cz += a.z;
    });
    cx /= atoms.length;
    cy /= atoms.length;
    cz /= atoms.length;

    // Find max radius for camera distance
    let maxDist = 1;
    atoms.forEach((a) => {
      const d = Math.sqrt((a.x - cx) ** 2 + (a.y - cy) ** 2 + (a.z - cz) ** 2);
      if (d > maxDist) maxDist = d;
    });

    camera.position.z = Math.max(maxDist * 2.6, 6);

    // 4. Render Atoms
    const atomMeshes: THREE.Mesh[] = [];
    atoms.forEach((a) => {
      const color = CPK_COLORS[a.element] || 0x8c9bb1;
      const baseRadius = ATOM_RADII[a.element] || 0.42;
      const radius = viewMode === "spacefill" ? baseRadius * 1.6 : baseRadius;

      const geometry = new THREE.SphereGeometry(radius, 24, 24);
      const material = new THREE.MeshPhongMaterial({
        color,
        shininess: 90,
        specular: 0x333333,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(a.x - cx, a.y - cy, a.z - cz);
      molGroup.add(mesh);
      atomMeshes.push(mesh);
    });

    // 5. Render Bonds
    if (viewMode === "ball_and_stick" && conformer.bonds) {
      conformer.bonds.forEach((b) => {
        const a1 = atoms[b.source];
        const a2 = atoms[b.target];
        if (!a1 || !a2) return;

        const p1 = new THREE.Vector3(a1.x - cx, a1.y - cy, a1.z - cz);
        const p2 = new THREE.Vector3(a2.x - cx, a2.y - cy, a2.z - cz);

        const dist = p1.distanceTo(p2);
        const bondRadius = b.order > 1.5 ? 0.11 : 0.08;

        const cylinderGeom = new THREE.CylinderGeometry(bondRadius, bondRadius, dist, 12);
        const bondMat = new THREE.MeshPhongMaterial({
          color: 0x4a5d78,
          shininess: 60,
        });

        const cylinder = new THREE.Mesh(cylinderGeom, bondMat);
        cylinder.position.copy(p1.clone().add(p2).multiplyScalar(0.5));
        cylinder.quaternion.setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          p2.clone().sub(p1).normalize()
        );
        molGroup.add(cylinder);
      });
    }

    // 6. Mouse Interaction (Orbit Rotate & Wheel Zoom)
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging || !molGroupRef.current) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      molGroupRef.current.rotation.y += deltaX * 0.01;
      molGroupRef.current.rotation.x += deltaY * 0.01;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      camera.position.z += e.deltaY * 0.01;
      camera.position.z = Math.max(camera.position.z, 2);
      camera.position.z = Math.min(camera.position.z, 50);
    };

    const dom = renderer.domElement;
    dom.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    dom.addEventListener("wheel", onWheel, { passive: false });

    // 7. Animation Loop
    const animate = () => {
      if (molGroupRef.current && isRotating && !isDragging) {
        molGroupRef.current.rotation.y += 0.005;
      }
      renderer.render(scene, camera);
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animate();

    // 8. Resize Handler
    const handleResize = () => {
      if (!container || !rendererRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      dom.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      dom.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      if (container.contains(dom)) container.removeChild(dom);
    };
  }, [conformer, isRotating, viewMode]);

  // If 3D conformer not present or failed
  if (!conformer || !conformer.atoms || conformer.atoms.length === 0) {
    return (
      <div className={`relative flex flex-col items-center justify-center p-4 rounded-xl border border-white/10 bg-[#0D1422] ${className}`}>
        {svgFallback ? (
          <div
            className="w-full h-full flex items-center justify-center"
            dangerouslySetInnerHTML={{ __html: svgFallback }}
          />
        ) : (
          <p className="text-sm text-[#8C9BB1]">No conformer available.</p>
        )}
        <div className="absolute bottom-2 left-3 right-3 text-center">
          <span className="text-[11px] text-[#8C9BB1] bg-[#111B2B]/80 px-2 py-1 rounded border border-white/5">
            2D Depiction Active (3D distance geometry conformer not calculated or constrained)
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative rounded-xl border border-white/10 bg-[#070B14]/80 overflow-hidden ${className}`}>
      {/* 3D WebGL Canvas */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Floating Controls Overlay */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-[#111B2B]/90 backdrop-blur-md px-2 py-1.5 rounded-lg border border-white/10 text-xs shadow-lg">
        <button
          onClick={() => setIsRotating(!isRotating)}
          title={isRotating ? "Pause Rotation" : "Auto Rotate"}
          className={`p-1.5 rounded hover:bg-white/10 transition-colors ${
            isRotating ? "text-[#43E5F5]" : "text-[#8C9BB1]"
          }`}
        >
          {isRotating ? <Pause size={14} /> : <Play size={14} />}
        </button>

        <button
          onClick={() => {
            if (molGroupRef.current) {
              molGroupRef.current.rotation.set(0, 0, 0);
            }
          }}
          title="Reset Orientation"
          className="p-1.5 rounded hover:bg-white/10 text-[#8C9BB1] hover:text-[#F2F6FC] transition-colors"
        >
          <RotateCcw size={14} />
        </button>

        <button
          onClick={() =>
            setViewMode(viewMode === "ball_and_stick" ? "spacefill" : "ball_and_stick")
          }
          title={`Style: ${viewMode === "ball_and_stick" ? "Ball & Stick" : "Space-filling"}`}
          className="p-1.5 rounded hover:bg-white/10 text-[#8C9BB1] hover:text-[#43E5F5] transition-colors"
        >
          <Layers size={14} />
        </button>
      </div>

      {/* Info Badge */}
      <div className="absolute bottom-2 left-3 flex items-center gap-2">
        <span className="text-[10px] uppercase font-mono tracking-wider text-[#43E5F5] bg-[#111B2B]/90 px-2 py-0.5 rounded border border-[#43E5F5]/20">
          3D Force Field: {conformer.optimization_method || "ETKDGv3 + MMFF"}
        </span>
        <span className="text-[10px] text-[#8C9BB1] bg-[#111B2B]/80 px-2 py-0.5 rounded border border-white/5 font-mono">
          {conformer.atoms.length} Atoms · {conformer.bonds?.length || 0} Bonds
        </span>
      </div>
    </div>
  );
}

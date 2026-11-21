"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Center, OrbitControls, useGLTF } from "@react-three/drei";
import { Suspense, useMemo, useRef, useState } from "react";
import { BackSide, Mesh, MeshBasicMaterial, type Group } from "three";

type HeroParcelProps = {
  interactive?: boolean;
  speed: number;
  phase: number;
  motion?: "logo-tour" | "free-spin" | "still" | "bob";
  view?: "perspective" | "top";
  quarterView?: boolean;
  isPanning?: boolean;
  onPanStart?: () => void;
  onPanEnd?: () => void;
};

function Parcel({ speed, phase, motion = "logo-tour", isPanning = false }: HeroParcelProps) {
  const parcel = useRef<Group>(null);
  const { scene } = useGLTF("/models/plop-parcel.glb");
  const model = useMemo(() => {
    const clonedScene = scene.clone(true);
    const parcelBody = clonedScene.getObjectByName("outline");

    if (parcelBody instanceof Mesh && parcelBody.parent) {
      const toonHull = new Mesh(
        parcelBody.geometry,
        new MeshBasicMaterial({
          color: "#22120b",
          depthWrite: false,
          side: BackSide,
          toneMapped: false,
        }),
      );

      toonHull.name = "toon-outline";
      toonHull.position.copy(parcelBody.position);
      toonHull.quaternion.copy(parcelBody.quaternion);
      toonHull.scale.copy(parcelBody.scale).multiplyScalar(1.035);
      toonHull.renderOrder = -1;
      parcelBody.parent.add(toonHull);
    }

    return clonedScene;
  }, [scene]);

  useFrame(({ clock }) => {
    if (!parcel.current) return;

    // When panning, freeze vertical bobbing completely
    if (isPanning) {
      parcel.current.position.y = 0;
      return;
    }

    const elapsed = clock.getElapsedTime() * speed + phase;

    if (motion === "still" || motion === "bob") {
      parcel.current.position.y = 0;
      parcel.current.rotation.set(0, 0, 0);
      return;
    }

    if (motion === "free-spin") {
      parcel.current.position.y = Math.sin(elapsed * 0.65) * 0.06;
      parcel.current.rotation.set(elapsed * 0.52, elapsed * 0.8, elapsed * 0.31);
      return;
    }

    // 5000x slower vertical bob:
    const slowBobFreq = 1.25 / 5000;
    parcel.current.position.y = Math.sin(elapsed * slowBobFreq) * 0.045;
    parcel.current.rotation.x = -0.04 + Math.sin(elapsed * 0.35) * 0.025;
    parcel.current.rotation.y = Math.sin(elapsed * 0.72) * (Math.PI / 2.65);
    parcel.current.rotation.z = Math.sin(elapsed * 0.48) * 0.045;
  });

  return <primitive ref={parcel} object={model} />;
}

export function ParcelScene({
  interactive = false,
  isPanning = false,
  ...props
}: HeroParcelProps) {
  const isDraggingRef = useRef(false);

  return (
    <>
      <ambientLight intensity={1.8} />
      <directionalLight color="#fff0dc" intensity={2.5} position={[3, 4, 5]} />
      <directionalLight color="#ffad7a" intensity={0.7} position={[-4, 1, 3]} />
      <Suspense fallback={null}>
        <Center>
          <Parcel isPanning={isPanning} {...props} />
        </Center>
      </Suspense>
      {interactive && (
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          enableDamping
          dampingFactor={0.08}
          rotateSpeed={0.65}
          panSpeed={0.8}
          onStart={() => {
            isDraggingRef.current = true;
          }}
          onEnd={() => {
            isDraggingRef.current = false;
          }}
        />
      )}
    </>
  );
}

export default function HeroParcel({
  interactive = false,
  view = "perspective",
  quarterView = false,
  ...props
}: HeroParcelProps) {
  const topView = view === "top";

  let cameraPosition: [number, number, number];
  let cameraFov: number;

  if (topView) {
    cameraPosition = [0, 7.5, 0.01];
    cameraFov = 28;
  } else if (quarterView) {
    cameraPosition = [3.8, 3.0, 5.4];
    cameraFov = 34;
  } else {
    cameraPosition = [4.8, 3.8, 8.4];
    cameraFov = 32;
  }

  return (
    <Canvas
      camera={{ position: cameraPosition, fov: cameraFov }}
      dpr={[1, 1.5]}
      gl={{ alpha: true, antialias: true, premultipliedAlpha: false }}
      onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
      style={{ background: "transparent", height: "100%", width: "100%" }}
    >
      <ParcelScene interactive={interactive} {...props} />
    </Canvas>
  );
}

useGLTF.preload("/models/plop-parcel.glb");

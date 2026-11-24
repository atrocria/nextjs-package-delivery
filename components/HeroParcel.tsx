"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Center, OrbitControls, useGLTF } from "@react-three/drei";
import { Suspense, useMemo, useRef, type RefObject } from "react";
import {
  BackSide,
  Box3,
  Mesh,
  MeshBasicMaterial,
  Quaternion,
  Vector3,
  type Group,
} from "three";

type HeroParcelProps = {
  interactive?: boolean;
  enableZoom?: boolean;
  dropStartRotation?: { x: number; y: number; z: number };
  dropElapsedRef?: { current: number };
  dropDelaySeconds?: number;
  dropDurationSeconds?: number;
  motionSpeed?: number;
  rotationXDegrees?: number;
  rotationYDegrees?: number;
  rotationZDegrees?: number;
  motion?: "logo-tour" | "free-spin" | "still" | "bob" | "drop";
  view?: "perspective" | "top";
  quarterView?: boolean;
  isPanning?: boolean;
};

function Parcel({
  parcelRef,
  motionSpeed = 1,
  dropStartRotation = { x: 0, y: 0, z: 0 },
  dropElapsedRef,
  dropDelaySeconds = 0.42,
  dropDurationSeconds = 0.52,
  rotationXDegrees = 0,
  rotationYDegrees = 0,
  rotationZDegrees = 0,
  motion = "logo-tour",
  isPanning = false,
}: HeroParcelProps & { parcelRef: RefObject<Group | null> }) {
  const { scene } = useGLTF("/models/plop-parcel.glb");
  const model = useMemo(() => {
    const clonedScene = scene.clone(true);
    clonedScene.rotation.order = "YXZ";
    const parcelBody = clonedScene.getObjectByName("outline");

    if (parcelBody instanceof Mesh && parcelBody.parent) {
      const toonHull = new Mesh(
        parcelBody.geometry,
        new MeshBasicMaterial({
          color: "#22120b",
          depthWrite: true,
          side: BackSide,
          toneMapped: false,
          polygonOffset: true,
          polygonOffsetFactor: 1,
          polygonOffsetUnits: 1,
        }),
      );

      toonHull.name = "toon-outline";
      toonHull.position.copy(parcelBody.position);
      toonHull.quaternion.copy(parcelBody.quaternion);
      toonHull.scale.copy(parcelBody.scale).multiplyScalar(1.025);
      toonHull.renderOrder = -1;
      parcelBody.parent.add(toonHull);
    }

    return clonedScene;
  }, [scene]);

  useFrame(({ clock }) => {
    if (!parcelRef.current) return;

    if (motion === "drop") {
      const dropElapsed = dropElapsedRef?.current ?? 0;
      const startX = (dropStartRotation.x * Math.PI) / 180;
      const startY = (dropStartRotation.y * Math.PI) / 180;
      const startZ = (dropStartRotation.z * Math.PI) / 180;
      const targetX = (rotationXDegrees * Math.PI) / 180;
      const targetY = (rotationYDegrees * Math.PI) / 180;
      const targetZ = (rotationZDegrees * Math.PI) / 180;
      const progress = Math.min(
        1,
        Math.max(0, (dropElapsed - dropDelaySeconds) / dropDurationSeconds),
      );
      const easedProgress = progress * progress;
      const impactElapsed = dropElapsed - dropDelaySeconds - dropDurationSeconds;
      const wobble =
        impactElapsed >= 0 && impactElapsed < 0.3
          ? Math.sin(impactElapsed * 52) * Math.exp(-impactElapsed * 17)
          : 0;

      parcelRef.current.position.y = 0;
      parcelRef.current.rotation.set(
        startX + (targetX - startX) * easedProgress + wobble * 0.025,
        startY + (targetY - startY) * easedProgress + wobble * 0.018,
        startZ + (targetZ - startZ) * easedProgress + wobble * 0.07,
      );
      return;
    }

    if (isPanning) {
      parcelRef.current.position.y = 0;
      return;
    }

    const elapsed = clock.elapsedTime * motionSpeed;
    const rotationX = (rotationXDegrees * Math.PI) / 180;
    const rotationY = (rotationYDegrees * Math.PI) / 180;
    const rotationZ = (rotationZDegrees * Math.PI) / 180;

    if (motion === "still") {
      parcelRef.current.position.y = 0;
      parcelRef.current.rotation.set(rotationX, rotationY, rotationZ);
      return;
    }

    parcelRef.current.position.y = Math.sin(elapsed) * 0.045;

    if (motion === "bob") {
      parcelRef.current.rotation.set(rotationX, rotationY, rotationZ);
      return;
    }

    if (motion === "free-spin") {
      parcelRef.current.rotation.set(
        rotationX + elapsed * 0.52,
        rotationY + elapsed * 0.8,
        rotationZ + elapsed * 0.31,
      );
      return;
    }

    parcelRef.current.rotation.x =
      rotationX - 0.04 + Math.sin(elapsed * 0.35) * 0.025;
    parcelRef.current.rotation.y = rotationY + Math.sin(elapsed * 0.72) * (Math.PI / 2.65);
    parcelRef.current.rotation.z = rotationZ + Math.sin(elapsed * 0.48) * 0.045;
  }, -3);

  return <primitive ref={parcelRef} object={model} />;
}

type FloatingParcelConfig = {
  anchorRef: RefObject<HTMLDivElement | null>;
  motion: "logo-tour" | "bob";
  motionSpeed?: number;
  rotationXDegrees: number;
  rotationYDegrees: number;
  rotationZDegrees: number;
};

function FloatingParcel({ config }: { config: FloatingParcelConfig }) {
  const rootRef = useRef<Group | null>(null);
  const parcelRef = useRef<Group | null>(null);
  const bounds = useMemo(() => new Box3(), []);
  const dimensions = useMemo(() => new Vector3(), []);
  const measuredAnchorSize = useRef({ width: 0, height: 0 });
  const { gl, size } = useThree();

  useFrame(({ clock }) => {
    const root = rootRef.current;
    const parcel = parcelRef.current;
    const anchor = config.anchorRef.current;
    if (!root || !parcel || !anchor) return;

    const canvasBounds = gl.domElement.getBoundingClientRect();
    const anchorBounds = anchor.getBoundingClientRect();
    root.position.set(
      anchorBounds.left + anchorBounds.width / 2 - canvasBounds.left - size.width / 2,
      size.height / 2 - (anchorBounds.top + anchorBounds.height / 2 - canvasBounds.top),
      0,
    );

    if (
      anchorBounds.width !== measuredAnchorSize.current.width ||
      anchorBounds.height !== measuredAnchorSize.current.height
    ) {
      root.scale.setScalar(1);
      parcel.updateWorldMatrix(true, true);
      bounds.setFromObject(parcel);
      bounds.getSize(dimensions);
      if (dimensions.x > 0 && dimensions.y > 0) {
        root.scale.setScalar(
          (Math.min(anchorBounds.width / dimensions.x, anchorBounds.height / dimensions.y) *
            0.72),
        );
        measuredAnchorSize.current = {
          width: anchorBounds.width,
          height: anchorBounds.height,
        };
      }
    }

    const elapsed = clock.elapsedTime * (config.motionSpeed ?? 1);
    const rotationX = (config.rotationXDegrees * Math.PI) / 180;
    const rotationY = (config.rotationYDegrees * Math.PI) / 180;
    const rotationZ = (config.rotationZDegrees * Math.PI) / 180;
    const isLogoTour = config.motion === "logo-tour";
    parcel.position.y = Math.sin(elapsed) * 0.045;
    parcel.rotation.set(
      isLogoTour
        ? rotationX - 0.04 + Math.sin(elapsed * 0.35) * 0.025
        : rotationX,
      isLogoTour
        ? rotationY + Math.sin(elapsed * 0.72) * (Math.PI / 2.65)
        : rotationY,
      isLogoTour
        ? rotationZ + Math.sin(elapsed * 0.48) * 0.045
        : rotationZ,
    );
  });

  return (
    <group ref={rootRef}>
      <Center>
        <Parcel
          parcelRef={parcelRef}
          motion="still"
          rotationXDegrees={config.rotationXDegrees}
          rotationYDegrees={config.rotationYDegrees}
          rotationZDegrees={config.rotationZDegrees}
        />
      </Center>
    </group>
  );
}

function FloatingParcelScene({ parcels }: { parcels: FloatingParcelConfig[] }) {
  return (
    <>
      <ambientLight intensity={1.8} />
      <directionalLight color="#fff0dc" intensity={2.5} position={[3, 4, 5]} />
      <directionalLight color="#ffad7a" intensity={0.7} position={[-4, 1, 3]} />
      <Suspense fallback={null}>
        {parcels.map((config, index) => (
          <FloatingParcel key={index} config={config} />
        ))}
      </Suspense>
    </>
  );
}

export function FloatingParcelField({ parcels }: { parcels: FloatingParcelConfig[] }) {
  return (
    <Canvas
      orthographic
      camera={{ position: [0, 0, 1000], zoom: 1 }}
      dpr={[1, 1.5]}
      gl={{ alpha: true, antialias: true, premultipliedAlpha: false }}
      onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        background: "transparent",
        height: "100%",
        width: "100%",
      }}
    >
      <FloatingParcelScene parcels={parcels} />
    </Canvas>
  );
}

function ParcelOrbitControls({
  parcelRef,
  enableZoom,
}: {
  parcelRef: RefObject<Group | null>;
  enableZoom: boolean;
}) {
  const camera = useThree((state) => state.camera);
  const boxQuaternion = useMemo(() => new Quaternion(), []);
  const localUp = useMemo(() => new Vector3(0, 1, 0), []);
  const worldUp = useMemo(() => new Vector3(), []);

  useFrame(() => {
    const parcel = parcelRef.current;
    if (!parcel) return;

    parcel.getWorldQuaternion(boxQuaternion);
    camera.up.copy(worldUp.copy(localUp).applyQuaternion(boxQuaternion).normalize());
  }, -2);

  return (
    <OrbitControls
      enablePan
      enableZoom={enableZoom}
      enableRotate
      enableDamping
      dampingFactor={0.08}
      minDistance={4.5}
      maxDistance={9}
      rotateSpeed={0.65}
      panSpeed={0.8}
    />
  );
}

export function ParcelScene({
  interactive = false,
  enableZoom = false,
  isPanning = false,
  ...props
}: HeroParcelProps) {
  const parcelRef = useRef<Group | null>(null);

  return (
    <>
      <ambientLight intensity={1.8} />
      <directionalLight color="#fff0dc" intensity={2.5} position={[3, 4, 5]} />
      <directionalLight color="#ffad7a" intensity={0.7} position={[-4, 1, 3]} />
      <Suspense fallback={null}>
        <Center>
          <Parcel parcelRef={parcelRef} isPanning={isPanning} {...props} />
        </Center>
      </Suspense>
      {interactive && <ParcelOrbitControls parcelRef={parcelRef} enableZoom={enableZoom} />}
    </>
  );
}

export default function HeroParcel({
  interactive = false,
  enableZoom = false,
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
      <ParcelScene interactive={interactive} enableZoom={enableZoom} {...props} />
    </Canvas>
  );
}

useGLTF.preload("/models/plop-parcel.glb");

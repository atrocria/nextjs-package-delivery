"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Center, OrbitControls, useGLTF } from "@react-three/drei";
import { Suspense, useMemo, useRef, type RefObject } from "react";
import { BackSide, Mesh, MeshBasicMaterial, Quaternion, Vector3, type Group } from "three";

type HeroParcelProps = {
  interactive?: boolean;
  motionSpeed?: number;
  rotationXDegrees?: number;
  rotationYDegrees?: number;
  rotationZDegrees?: number;
  motion?: "logo-tour" | "free-spin" | "still" | "bob";
  view?: "perspective" | "top";
  quarterView?: boolean;
  isPanning?: boolean;
};

function Parcel({
  parcelRef,
  motionSpeed = 1,
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
    if (!parcelRef.current) return;

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

function ParcelOrbitControls({ parcelRef }: { parcelRef: RefObject<Group | null> }) {
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
      enableZoom={false}
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
      {interactive && <ParcelOrbitControls parcelRef={parcelRef} />}
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

"use client";

import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  MapPin,
  Menu,
  Package,
  PackageCheck,
  Plane,
  ShieldCheck,
  SlidersHorizontal,
  Truck,
} from "lucide-react";
import HeroParcel, { FloatingParcelField } from "@/components/HeroParcel";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { ScrollTrigger } from "gsap/ScrollTrigger";
import gsap from "gsap";

gsap.registerPlugin(ScrollTrigger);

const BOX_ROTATIONS = {
  floating: { x: 0, y: -90, z: 0 },
  bouncing: { x: 61, y: -79, z: 16 },
} as const;

const DROP_LANDING_ROTATION = { x: 0, y: -90, z: 0 } as const;
const DROP_DELAY_SECONDS = 0.42;
const DROP_DURATION_SECONDS = 0.52;

type HeroParcelId = "floating" | "float-b" | "float-c" | "float-d" | "float-e" | "main";
type ParcelDebugSettings = {
  rotationX: number;
  rotationY: number;
  rotationZ: number;
  scale: number;
  offsetX: number;
  offsetY: number;
};

type ParcelControl = {
  key: keyof ParcelDebugSettings;
  label: string;
  min: number;
  max: number;
  step: number;
  suffix: string;
};

const PARCEL_CONTROLS: ParcelControl[] = [
  { key: "rotationX", label: "Rotate X", min: -180, max: 180, step: 1, suffix: "°" },
  { key: "rotationY", label: "Rotate Y", min: -180, max: 180, step: 1, suffix: "°" },
  { key: "rotationZ", label: "Rotate Z", min: -180, max: 180, step: 1, suffix: "°" },
  { key: "scale", label: "Scale", min: 0.5, max: 2, step: 0.05, suffix: "×" },
  { key: "offsetX", label: "Move X", min: -15, max: 15, step: 1, suffix: "%" },
  { key: "offsetY", label: "Move Y", min: -15, max: 15, step: 1, suffix: "%" },
];

const HERO_PARCEL_POSITIONS: Record<
  HeroParcelId,
  { top: string; horizontal: string; side: "left" | "right" }
> = {
  floating: {
    top: "--floating-parcel-top",
    horizontal: "--floating-parcel-left",
    side: "left",
  },
  "float-b": {
    top: "--floating-parcel-b-top",
    horizontal: "--floating-parcel-b-left",
    side: "left",
  },
  "float-c": {
    top: "--floating-parcel-c-top",
    horizontal: "--floating-parcel-c-left",
    side: "left",
  },
  "float-d": {
    top: "--floating-parcel-d-top",
    horizontal: "--floating-parcel-d-left",
    side: "left",
  },
  "float-e": {
    top: "--floating-parcel-e-top",
    horizontal: "--floating-parcel-e-right",
    side: "right",
  },
  main: {
    top: "--hero-parcel-top",
    horizontal: "--hero-parcel-right",
    side: "right",
  },
};

const INITIAL_HERO_PARCELS: Record<HeroParcelId, ParcelDebugSettings> = {
  floating: {
    rotationX: BOX_ROTATIONS.floating.x,
    rotationY: BOX_ROTATIONS.floating.y,
    rotationZ: BOX_ROTATIONS.floating.z,
    scale: 1,
    offsetX: 0,
    offsetY: 0,
  },
  "float-b": {
    rotationX: -141,
    rotationY: -53,
    rotationZ: -70,
    scale: 1.3,
    offsetX: 0,
    offsetY: 0,
  },
  "float-c": {
    rotationX: -63,
    rotationY: 35,
    rotationZ: -173,
    scale: 1.05,
    offsetX: 1,
    offsetY: -6,
  },
  "float-d": {
    rotationX: 26,
    rotationY: -68,
    rotationZ: 4,
    scale: 0.85,
    offsetX: 2,
    offsetY: -2,
  },
  "float-e": {
    rotationX: 29,
    rotationY: -180,
    rotationZ: -14,
    scale: 0.8,
    offsetX: 2,
    offsetY: 0,
  },
  main: {
    rotationX: BOX_ROTATIONS.bouncing.x,
    rotationY: BOX_ROTATIONS.bouncing.y,
    rotationZ: BOX_ROTATIONS.bouncing.z,
    scale: 1.05,
    offsetX: 1,
    offsetY: -10,
  },
};

const PARCEL_CONTROL_TARGETS: { id: HeroParcelId; label: string }[] = [
  { id: "main", label: "Hero parcel" },
  { id: "floating", label: "Floating parcel 1" },
  { id: "float-b", label: "Floating parcel 2" },
  { id: "float-c", label: "Floating parcel 3" },
  { id: "float-d", label: "Floating parcel 4" },
  { id: "float-e", label: "Floating parcel 5" },
];

const RETURN_TO_HERO_SESSION_KEY = "plop-return-to-hero";

function restoreHeroAfterShipping() {
  if (typeof window === "undefined") return;
  if (sessionStorage.getItem(RETURN_TO_HERO_SESSION_KEY) !== "true") {
    window.history.scrollRestoration = "auto";
    return;
  }

  sessionStorage.removeItem(RETURN_TO_HERO_SESSION_KEY);
  window.history.scrollRestoration = "manual";
  window.history.replaceState(
    window.history.state,
    "",
    `${window.location.pathname}${window.location.search}`,
  );
  window.scrollTo(0, 0);
  window.location.reload();
}

if (typeof window !== "undefined") {
  if (sessionStorage.getItem(RETURN_TO_HERO_SESSION_KEY) !== "true") {
    window.history.scrollRestoration = "auto";
  }
  window.addEventListener("pageshow", restoreHeroAfterShipping);
  window.addEventListener("popstate", restoreHeroAfterShipping);
}

function getParcelPlacementStyle(id: HeroParcelId, settings: ParcelDebugSettings) {
  const position = HERO_PARCEL_POSITIONS[id];
  const top = `calc(var(${position.top}) + ${settings.offsetY}%)`;
  const horizontal = `calc(var(${position.horizontal}) ${position.side === "left" ? "+" : "-"} ${settings.offsetX}%)`;

  const placement =
    position.side === "left" ? { top, left: horizontal } : { top, right: horizontal };
  return id === "main" ? placement : { ...placement, transform: `scale(${settings.scale})` };
}

function ParcelIllustration({
  className,
  withContents = false,
}: {
  className: string;
  withContents?: boolean;
}) {
  return (
    <div className={`parcel-illustration ${className}`}>
      <div className="parcel-flap flap-left" />
      <div className="parcel-flap flap-right" />
      <div className="parcel-flap flap-back" />
      <div className="parcel-face">
        {withContents && (
          <div className="parcel-contents" aria-hidden="true">
            <span className="parcel-fill-item fill-item-one" />
            <span className="parcel-fill-item fill-item-two" />
            <span className="parcel-fill-item fill-item-three" />
          </div>
        )}
        <div className="tape-strip" />
        <div className="shipping-label">
          <strong>PLOP.</strong>
          <span>TO: SOMEWHERE NICE</span>
          <div className="barcode">|||| ||| || ||||</div>
        </div>
        <span className="parcel-mark">HANDLE WITH CARE ♡</span>
      </div>
    </div>
  );
}

export default function Home() {
  const dropPanelRef = useRef<HTMLElement>(null);
  const dropParcelRef = useRef<HTMLDivElement>(null);
  const dropElapsedRef = useRef(0);
  const packingRef = useRef<HTMLElement>(null);
  const truckRef = useRef<HTMLElement>(null);
  const planeRef = useRef<HTMLElement>(null);
  const arrivalRef = useRef<HTMLElement>(null);
  const floatingParcelFieldRef = useRef<HTMLDivElement>(null);
  const floatingParcelAnchor0 = useRef<HTMLDivElement>(null);
  const floatingParcelAnchor1 = useRef<HTMLDivElement>(null);
  const floatingParcelAnchor2 = useRef<HTMLDivElement>(null);
  const floatingParcelAnchor3 = useRef<HTMLDivElement>(null);
  const floatingParcelAnchor4 = useRef<HTMLDivElement>(null);
  const [tracking, setTracking] = useState("");
  const [trackingResult, setTrackingResult] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropAnimationComplete, setDropAnimationComplete] = useState(false);
  const dropAnimationCompleteRef = useRef(false);
  const floatingParcelPointerRef = useRef<{ x: number; y: number } | null>(null);
  const [heroParcelSettings, setHeroParcelSettings] = useState(INITIAL_HERO_PARCELS);

  useEffect(() => {
    const packingSection = packingRef.current;
    const truckSection = truckRef.current;
    const planeSection = planeRef.current;
    const arrivalSection = arrivalRef.current;
    const page = document.querySelector(".homepage");
    if (!packingSection || !truckSection || !planeSection || !arrivalSection || !page) return;

    const ctx = gsap.context(() => {
      gsap.set(".packaging-parcel .parcel-fill-item", { opacity: 1, y: 0, scale: 1 });
      const packagingTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: packingSection,
          start: "top 60%",
          toggleActions: "play none none reverse",
        },
      });
      packagingTimeline.to(
        ".gather-copy",
        {
          opacity: 1,
          y: 0,
          duration: 0.65,
        },
        0.45,
      );
      packagingTimeline.to(
        ".packaging-parcel",
        {
          opacity: 1,
          scale: 1,
          rotation: 0,
          duration: 0.9,
          ease: "back.out(1.2)",
        },
        0.2,
      );
      packagingTimeline.to(
        ".packaging-parcel .parcel-flap",
        {
          rotateX: 0,
          duration: 0.65,
          stagger: 0.12,
        },
        1,
      );
      packagingTimeline.to(
        ".gather-copy",
        {
          opacity: 0,
          y: -30,
          duration: 0.4,
        },
        1.6,
      );
      packagingTimeline.to(
        ".seal-copy",
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
        },
        1.8,
      );
      packagingTimeline.to(
        ".packaging-parcel .tape-strip",
        {
          scaleX: 1,
          duration: 0.7,
        },
        1.85,
      );
      packagingTimeline.to(
        ".packaging-parcel .shipping-label",
        {
          scale: 1,
          rotation: -4,
          duration: 0.6,
        },
        2.15,
      );

      const truckTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: truckSection,
          start: "top 60%",
          toggleActions: "play none none reverse",
        },
      });
      truckTimeline.to(".truck-scene", { opacity: 1, duration: 0.5 }, 0.35);
      truckTimeline.fromTo(
        ".delivery-truck",
        { x: -650 },
        { x: 0, duration: 1.1, ease: "power2.out" },
        0.45,
      );
      truckTimeline.to(".truck-copy", { opacity: 1, y: 0, duration: 0.65 }, 0.8);

      const planeTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: planeSection,
          start: "top 60%",
          toggleActions: "play none none reverse",
        },
      });
      planeTimeline.to(".sky-scene", { opacity: 1, duration: 0.5 }, 0.35);
      planeTimeline.fromTo(
        ".airplane",
        { x: -500, y: 100, rotation: -8 },
        { x: 0, y: 0, rotation: 0, duration: 1.6, ease: "power2.out" },
        0.45,
      );
      planeTimeline.to(".cloud-one", { x: 280, duration: 2.2 }, 0.7);
      planeTimeline.to(".cloud-two", { x: -260, duration: 2.2 }, 0.7);
      planeTimeline.to(".plane-copy", { opacity: 1, y: 0, duration: 0.65 }, 1.15);
      planeTimeline.to(".airplane", { x: 500, y: -100, rotation: -10, duration: 1.2 }, 2.6);

      const arrivalTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: arrivalSection,
          start: "top 60%",
          toggleActions: "play none none reverse",
        },
      });
      arrivalTimeline.to(".home-scene", { opacity: 1, duration: 0.5 }, 0.35);
      arrivalTimeline.fromTo(
        ".home-parcel",
        { y: -350, rotation: -15, scale: 0.5 },
        {
          y: 0,
          rotation: 0,
          scale: 1,
          duration: 1.4,
          ease: "bounce.out",
        },
        0.5,
      );
      arrivalTimeline.to(".home-door", { rotationY: -90, duration: 0.7 }, 1.75);
      arrivalTimeline.to(".final-copy", { opacity: 1, y: 0, duration: 0.7 }, 1.95);
    }, page);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const section = dropPanelRef.current;
    const parcel = dropParcelRef.current;
    if (!section || !parcel) return;
    const openingParcel = section.querySelector(".drop-opening-parcel");
    const copy = section.querySelector(".drop-panel-copy");
    if (!(openingParcel instanceof HTMLElement) || !(copy instanceof HTMLElement)) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      gsap.set(parcel, { y: 0, scale: 1, opacity: 0, rotation: 0 });
      gsap.set(openingParcel, { y: 0, scale: 1, opacity: 1, rotation: 0 });
      gsap.set(copy, { y: 0, opacity: 1 });
      gsap.set(section.querySelectorAll(".parcel-fill-item"), { y: 0, scale: 1, opacity: 1 });
      const frame = window.requestAnimationFrame(() => setDropAnimationComplete(true));
      return () => window.cancelAnimationFrame(frame);
    }

    const ctx = gsap.context(() => {
      gsap.set(parcel, { y: "-78vh", scale: 0.76, opacity: 0, rotation: 0 });
      gsap.set(openingParcel, { y: 30, scale: 0.65, opacity: 0, rotation: -8 });
      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "+=1000",
          refreshPriority: 1,
          scrub: 0.5,
          pin: true,
          anticipatePin: 1,
          snap: {
            snapTo: [0, 0.45, 1],
            delay: 1.45,
            duration: { min: 0.25, max: 0.65 },
            ease: "power1.inOut",
          },
        },
      });
      timeline.to(parcel, {
        y: 0,
        scale: 1,
        opacity: 1,
        duration: DROP_DURATION_SECONDS,
        delay: DROP_DELAY_SECONDS,
        ease: "power4.in",
      });
      timeline.to(parcel, { y: -16, duration: 0.09, ease: "power2.out" });
      timeline.to(parcel, { y: 0, duration: 0.12, ease: "power2.in" });
      timeline.to(parcel, { rotation: 2.5, duration: 0.055, ease: "power2.out" }, "<");
      timeline.to(parcel, { rotation: 0, duration: 0.12, ease: "power2.inOut" });
      timeline.to(parcel, { opacity: 0, scale: 0.82, duration: 0.3 }, 1.25);
      timeline.to(openingParcel, { y: 0, scale: 1, opacity: 1, rotation: 0, duration: 0.45 }, 1.25);
      timeline.to(copy, { opacity: 1, y: 0, duration: 0.55 }, 1.3);
      timeline.fromTo(
        ".drop-opening-parcel .parcel-fill-item",
        { opacity: 0, y: -38, scale: 0.55 },
        { opacity: 1, y: 0, scale: 1, duration: 0.38, stagger: 0.18, ease: "power2.out" },
        1.85,
      );
      timeline.eventCallback("onUpdate", () => {
        dropElapsedRef.current = timeline.time();
        const isComplete = timeline.progress() >= 1;
        if (dropAnimationCompleteRef.current !== isComplete) {
          dropAnimationCompleteRef.current = isComplete;
          setDropAnimationComplete(isComplete);
        }
      });
    }, section);

    return () => {
      ctx.revert();
      dropElapsedRef.current = 0;
      dropAnimationCompleteRef.current = false;
    };
  }, []);

  function handleTracking(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (tracking.trim()) setTrackingResult(true);
  }

  function moveFloatingParcel(anchor: HTMLDivElement, deltaX: number, deltaY: number) {
    const field = floatingParcelFieldRef.current;
    if (!field) return;

    const fieldBounds = field.getBoundingClientRect();
    if (fieldBounds.width === 0 || fieldBounds.height === 0) return;

    const anchorBounds = anchor.getBoundingClientRect();
    const nextLeft = Math.min(
      fieldBounds.right - anchorBounds.width,
      Math.max(fieldBounds.left, anchorBounds.left + deltaX),
    );
    const nextTop = Math.min(
      fieldBounds.bottom - anchorBounds.height,
      Math.max(fieldBounds.top, anchorBounds.top + deltaY),
    );
    const appliedDeltaX = nextLeft - anchorBounds.left;
    const appliedDeltaY = nextTop - anchorBounds.top;

    if (appliedDeltaX === 0 && appliedDeltaY === 0) return;

    setHeroParcelSettings((settings) => ({
      ...settings,
      floating: {
        ...settings.floating,
        offsetX: settings.floating.offsetX + (appliedDeltaX / fieldBounds.width) * 100,
        offsetY: settings.floating.offsetY + (appliedDeltaY / fieldBounds.height) * 100,
      },
    }));
  }

  function handleFloatingParcelPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    floatingParcelPointerRef.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handleFloatingParcelPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const previous = floatingParcelPointerRef.current;
    if (!previous) return;

    const deltaX = e.clientX - previous.x;
    const deltaY = e.clientY - previous.y;
    floatingParcelPointerRef.current = { x: e.clientX, y: e.clientY };
    moveFloatingParcel(e.currentTarget, deltaX, deltaY);
  }

  function handleFloatingParcelPointerUp() {
    floatingParcelPointerRef.current = null;
  }

  function handleFloatingParcelKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const movementByKey: Record<string, { x: number; y: number }> = {
      ArrowDown: { x: 0, y: 12 },
      ArrowLeft: { x: -12, y: 0 },
      ArrowRight: { x: 12, y: 0 },
      ArrowUp: { x: 0, y: -12 },
    };
    const movement = movementByKey[e.key];
    if (!movement) return;

    e.preventDefault();
    moveFloatingParcel(e.currentTarget, movement.x, movement.y);
  }

  return (
    <main className="homepage">
      {/* NAVIGATION */}
      <nav className="navbar [height:82px] [padding:0_7%] [display:flex] [align-items:center] [justify-content:space-between] [background:var(--cream)] [position:relative] [z-index:50]">
        <a
          href="#"
          className="logo [font-family:Fredoka,sans-serif] [font-size:37px] [font-weight:700] [letter-spacing:-2px]"
        >
          plop<span>.</span>
        </a>

        <div
          id="primary-navigation"
          className={`nav-links ${menuOpen ? "open" : ""}`}
        >
          <Link href="/shipping" onClick={() => setMenuOpen(false)}>
            Send a package
          </Link>
          <a href="#tracking" onClick={() => setMenuOpen(false)}>
            Track parcel
          </a>
          <a href="#about" onClick={() => setMenuOpen(false)}>
            About us
          </a>
        </div>

        <div className="nav-actions">
          <a href="/login" className="nav-cta nav-sign-in">
            Sign in
          </a>
          <a href="/register" className="nav-cta nav-get-started">
            Get started <ArrowUpRight size={17} />
          </a>
        </div>

        <button
          className="mobile-menu [display:none]"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
          aria-controls="primary-navigation"
        >
          <Menu />
        </button>
      </nav>

      {/* HERO */}
      <section
        className="hero-section [position:relative] [overflow:hidden] [background:var(--cream)] [isolation:isolate]"
      >
        <div
          className="journey-background [position:absolute] [inset:0] [z-index:-1]"
          style={{
            background:
              "radial-gradient(ellipse at 50% 45%, #fff 0%, transparent 65%), radial-gradient(ellipse at 85% 15%, #fce5cf 0%, transparent 35%)",
          }}
        />

        <div className="hero-copy scene-copy [position:absolute] [left:10%] [top:50%] [transform:translateY(-50%)] [z-index:5] [width:42%]">
          <span className="eyebrow [display:inline-flex] [align-items:center] [gap:9px] [font-size:10px] [font-weight:800] [letter-spacing:2px] [color:#8c8679] [margin-bottom:23px]">
            <span className="live-dot [width:7px] [height:7px] [background:#77b77c] [border-radius:50%] [box-shadow:0_0_0_5px_#77b77c22]" />{" "}
            Plop your parcel, ANYWHERE!
          </span>

          <h1>
            Your parcels
            <br />
            have places <span>to be.</span>
          </h1>

          <p>
            Send it. Track it. Plop it.
            <br />
            Deliveries made a little more delightful.
          </p>

          <div className="hero-actions [display:flex] [gap:12px] [flex-wrap:wrap]">
            <a
              href="/shipping"
              onClick={() => sessionStorage.setItem(RETURN_TO_HERO_SESSION_KEY, "true")}
              className="button-primary [background:var(--orange)] [color:white] [box-shadow:0_8px_22px_#ff914d33]"
            >
              Send a parcel <ArrowRight size={18} />
            </a>
            <a
              href="#services"
              className="button-secondary [border:1px_solid_#e4dfd5] [background:#fffdf8]"
            >
              Explore services
            </a>
          </div>
        </div>

        <details className="absolute bottom-11 left-[7%] z-20 w-[min(360px,86vw)] rounded-2xl border border-white/40 bg-[#292923]/90 p-3 text-white shadow-xl backdrop-blur-md">
          <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold">
            <SlidersHorizontal size={16} aria-hidden="true" />
            Parcel controls
          </summary>
          <p className="mt-2 text-xs text-white/70">
            Each parcel has independent rotation, scale, and position controls.
          </p>
          <div className="mt-3 max-h-[55svh] space-y-2 overflow-y-auto pr-1">
            {PARCEL_CONTROL_TARGETS.map((target) => (
              <details className="rounded-lg bg-white/10 px-2 py-1.5" key={target.id}>
                <summary className="cursor-pointer py-1 text-xs font-semibold">
                  {target.label}
                </summary>
                <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2">
                  {PARCEL_CONTROLS.map((control) => {
                    const value = heroParcelSettings[target.id][control.key];
                    const formattedValue =
                      control.key === "scale"
                        ? `${value.toFixed(2)}${control.suffix}`
                        : `${value}${control.suffix}`;

                    return (
                      <label className="min-w-0 text-xs" key={control.key}>
                        <span className="mb-1 flex justify-between gap-2">
                          <span>{control.label}</span>
                          <output>{formattedValue}</output>
                        </span>
                        <input
                          aria-label={`${target.label} ${control.label}`}
                          className="w-full accent-[#ff914d]"
                          max={control.max}
                          min={control.min}
                          onChange={(event) => {
                            const value = Number(event.currentTarget.value);
                            setHeroParcelSettings((current) => ({
                              ...current,
                              [target.id]: {
                                ...current[target.id],
                                [control.key]: value,
                              },
                            }));
                          }}
                          step={control.step}
                          type="range"
                          value={value}
                        />
                      </label>
                    );
                  })}
                </div>
                <button
                  className="mt-2 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold transition hover:bg-white/20"
                  onClick={() =>
                    setHeroParcelSettings((current) => ({
                      ...current,
                      [target.id]: INITIAL_HERO_PARCELS[target.id],
                    }))
                  }
                  type="button"
                >
                  Reset {target.label.toLowerCase()}
                </button>
              </details>
            ))}
          </div>
        </details>

        {/* FLOATING PARCELS */}
        <div
          ref={floatingParcelFieldRef}
          className="floating-boxes [position:absolute] [width:100%] [height:100%] [top:0] [left:0] [pointer-events:none] [z-index:6]"
        >
          <FloatingParcelField
            parcels={[
              {
                anchorRef: floatingParcelAnchor0,
                motion: "logo-tour",
                motionSpeed: 0.2,
                rotationXDegrees: heroParcelSettings.floating.rotationX,
                rotationYDegrees: heroParcelSettings.floating.rotationY,
                rotationZDegrees: heroParcelSettings.floating.rotationZ,
              },
              {
                anchorRef: floatingParcelAnchor1,
                motion: "bob",
                rotationXDegrees: heroParcelSettings["float-b"].rotationX,
                rotationYDegrees: heroParcelSettings["float-b"].rotationY,
                rotationZDegrees: heroParcelSettings["float-b"].rotationZ,
              },
              {
                anchorRef: floatingParcelAnchor2,
                motion: "bob",
                rotationXDegrees: heroParcelSettings["float-c"].rotationX,
                rotationYDegrees: heroParcelSettings["float-c"].rotationY,
                rotationZDegrees: heroParcelSettings["float-c"].rotationZ,
              },
              {
                anchorRef: floatingParcelAnchor3,
                motion: "bob",
                rotationXDegrees: heroParcelSettings["float-d"].rotationX,
                rotationYDegrees: heroParcelSettings["float-d"].rotationY,
                rotationZDegrees: heroParcelSettings["float-d"].rotationZ,
              },
              {
                anchorRef: floatingParcelAnchor4,
                motion: "bob",
                rotationXDegrees: heroParcelSettings["float-e"].rotationX,
                rotationYDegrees: heroParcelSettings["float-e"].rotationY,
                rotationZDegrees: heroParcelSettings["float-e"].rotationZ,
              },
            ]}
          />
          <div
            className="float-box float-a [position:absolute] [width:96px] [height:96px] [overflow:visible] [z-index:1]"
            ref={floatingParcelAnchor0}
            style={getParcelPlacementStyle("floating", heroParcelSettings.floating)}
            role="button"
            tabIndex={0}
            aria-label="Drag or use the arrow keys to move the floating parcel"
            onPointerDown={handleFloatingParcelPointerDown}
            onPointerMove={handleFloatingParcelPointerMove}
            onPointerUp={handleFloatingParcelPointerUp}
            onPointerCancel={handleFloatingParcelPointerUp}
            onKeyDown={handleFloatingParcelKeyDown}
          />
          <div
            className="decorative-parcel float-b"
            ref={floatingParcelAnchor1}
            style={getParcelPlacementStyle("float-b", heroParcelSettings["float-b"])}
            aria-hidden="true"
          />
          <div
            className="decorative-parcel float-c"
            ref={floatingParcelAnchor2}
            style={getParcelPlacementStyle("float-c", heroParcelSettings["float-c"])}
            aria-hidden="true"
          />
          <div
            className="decorative-parcel float-d"
            ref={floatingParcelAnchor3}
            style={getParcelPlacementStyle("float-d", heroParcelSettings["float-d"])}
            aria-hidden="true"
          />
          <div
            className="decorative-parcel float-e"
            ref={floatingParcelAnchor4}
            style={getParcelPlacementStyle("float-e", heroParcelSettings["float-e"])}
            aria-hidden="true"
          />
        </div>

        {/* HERO MAIN PARCEL (3D & PANNABLE) */}
        <div
          className="hero-box-container [position:absolute] [width:min(620px,_48vw,_82svh)] [height:min(620px,_58vw,_82svh)] [min-width:240px] [min-height:240px] [pointer-events:auto] [z-index:10] [user-select:none]"
          style={getParcelPlacementStyle("main", heroParcelSettings.main)}
        >
          <div
            className="hero-box-layout [width:100%] [height:100%] [display:flex] [flex-direction:column] [align-items:center] [justify-content:center]"
            style={{ transform: `scale(${heroParcelSettings.main.scale})` }}
          >
            <div className="hero-box-canvas-wrapper [width:100%] [height:90%] [pointer-events:auto] [user-select:none] [cursor:grab]">
              <HeroParcel
                interactive
                motion="bob"
                motionAmplitude={0.075}
                motionSpeed={1.7}
                quarterView
                rotationXDegrees={heroParcelSettings.main.rotationX}
                rotationYDegrees={heroParcelSettings.main.rotationY}
                rotationZDegrees={heroParcelSettings.main.rotationZ}
              />
            </div>
            <div className="hero-box-shadow [width:58%] [height:20px] [border-radius:50%] [background:radial-gradient(ellipse_at_center,_rgba(60,_25,_5,_0.28)_0%,_rgba(60,_25,_5,_0)_72%)] [margin-top:-12px] [opacity:0.35]" />
          </div>
        </div>

        <div className="scroll-indicator [position:absolute] [bottom:14px] [left:50%] [transform:translateX(-50%)] [z-index:20] [display:flex] [flex-direction:column] [align-items:center] [gap:3px] [font-size:9px] [letter-spacing:2px] [color:#898477] [pointer-events:none]">
          <span>SCROLL TO FOLLOW THE JOURNEY</span>
          <span className="scroll-chevron" aria-hidden="true">
            ⮟
          </span>
        </div>
      </section>

      <section className="drop-panel" ref={dropPanelRef} aria-labelledby="drop-panel-heading">
        <div className="drop-panel-inner">
          <div className="drop-panel-copy">
            <span className="drop-panel-eyebrow">A LITTLE MOMENT OF GRAVITY</span>
            <h2 id="drop-panel-heading">
              Good things
              <br />
              land softly.
            </h2>
            <p>
              One last little plop before the box opens and gets packed for its journey.
            </p>
            <span className="drop-panel-hint" aria-live="polite">
              {dropAnimationComplete ? "Packed and ready for the next step" : "Wait for the plop"}
            </span>
          </div>
          <div className="drop-panel-stage">
            <div className="drop-panel-ground" aria-hidden="true" />
            <div className="drop-parcel" ref={dropParcelRef}>
              <HeroParcel
                interactive
                dropStartRotation={BOX_ROTATIONS.bouncing}
                dropElapsedRef={dropElapsedRef}
                dropDelaySeconds={DROP_DELAY_SECONDS}
                dropDurationSeconds={DROP_DURATION_SECONDS}
                motion={dropAnimationComplete ? "still" : "drop"}
                quarterView
                rotationXDegrees={DROP_LANDING_ROTATION.x}
                rotationYDegrees={DROP_LANDING_ROTATION.y}
                rotationZDegrees={DROP_LANDING_ROTATION.z}
              />
            </div>
            <ParcelIllustration className="drop-opening-parcel" withContents />
          </div>
        </div>
      </section>

      <section
        className="packing-section story-section [position:relative] [overflow:hidden] [background:var(--cream)] [isolation:isolate]"
        ref={packingRef}
        aria-labelledby="packing-heading"
      >
        <div
          className="journey-background [position:absolute] [inset:0] [z-index:-1]"
          style={{
            background:
              "radial-gradient(ellipse at 50% 45%, #fff 0%, transparent 65%), radial-gradient(ellipse at 85% 15%, #fce5cf 0%, transparent 35%)",
          }}
        />
        <div className="gather-copy scene-copy [position:absolute] [left:10%] [top:50%] [transform:translateY(-50%)] [z-index:5] [width:42%]">
          <span className="eyebrow [display:inline-flex] [align-items:center] [gap:9px] [font-size:10px] [font-weight:800] [letter-spacing:2px] [color:#8c8679] [margin-bottom:23px]">
            PACKING THE GOOD STUFF
          </span>
          <h2 id="packing-heading">A little care goes a long way.</h2>
          <p>Everything tucked in and ready for a safe trip.</p>
        </div>

        <ParcelIllustration className="packaging-parcel" withContents />

        <div className="seal-copy scene-copy [position:absolute] [left:10%] [top:50%] [transform:translateY(-50%)] [z-index:5] [width:42%]">
          <span className="eyebrow [display:inline-flex] [align-items:center] [gap:9px] [font-size:10px] [font-weight:800] [letter-spacing:2px] [color:#8c8679] [margin-bottom:23px]">
            PACKED WITH CARE
          </span>
          <h2>
            All boxed up.
            <br />
            <span>Ready to go.</span>
          </h2>
          <p>Sealed, labelled and ready for an adventure.</p>
        </div>
      </section>

      <section
        className="truck-section story-section [position:relative] [overflow:hidden] [background:#f9edda] [isolation:isolate]"
        ref={truckRef}
        aria-labelledby="truck-heading"
      >
        <div className="truck-scene [position:absolute] [inset:0] [opacity:0] [overflow:hidden] [background:#f9edda]">
          <div className="road [position:absolute] [bottom:16%] [width:100%] [height:95px] [background:#d9d0c2] [border-top:7px_solid_#c4b9a9]" />
          <div className="road-line [position:absolute] [bottom:calc(16%_+_42px)] [width:100%] [border-top:4px_dashed_#fff9ef]" />
          <div className="delivery-truck [position:absolute] [bottom:calc(16%_+_75px)] [left:15%] [width:300px] [height:125px] [transform:translateX(-650px)]">
            <div className="truck-box [position:absolute] [left:0] [bottom:0] [width:190px] [height:115px] [background:#ff914d] [border:3px_solid_#e67c39] [border-radius:8px_8px_2px_2px] [display:grid] [place-items:center] [color:white] [font-family:Fredoka] [font-size:34px]">
              <span>PLOP.</span>
            </div>
            <div className="truck-cabin [position:absolute] [width:105px] [height:80px] [bottom:0] [right:0] [background:#e9a36f] [border-radius:20px_20px_3px_3px] [border:3px_solid_#d18a58]">
              <div className="truck-window [position:absolute] [top:10px] [right:9px] [width:58px] [height:35px] [border-radius:10px_10px_3px_3px] [background:#b7e1f5]" />
            </div>
            <div className="wheel wheel-one [position:absolute] [bottom:-17px] [width:40px] [height:40px] [background:#34332e] [border:7px_solid_#79766c] [border-radius:50%] [left:25px]" />
            <div className="wheel wheel-two [position:absolute] [bottom:-17px] [width:40px] [height:40px] [background:#34332e] [border:7px_solid_#79766c] [border-radius:50%] [right:20px]" />
          </div>
        </div>

        <div className="truck-copy scene-copy [position:absolute] [left:10%] [top:50%] [transform:translateY(-50%)] [z-index:5] [width:42%]">
          <span className="eyebrow [display:inline-flex] [align-items:center] [gap:9px] [font-size:10px] [font-weight:800] [letter-spacing:2px] [color:#8c8679] [margin-bottom:23px]">
            ON THE ROAD
          </span>
          <h2 id="truck-heading">
            Off we <span>go!</span>
          </h2>
          <p>Your parcel is hitting the road.</p>
        </div>
      </section>

      <section
        className="plane-section story-section [position:relative] [overflow:hidden] [background:#e9f4f4] [isolation:isolate]"
        ref={planeRef}
        aria-labelledby="plane-heading"
      >
        <div className="sky-scene [position:absolute] [inset:0] [opacity:0] [background:linear-gradient(180deg,_#b6def3,_#f1f7ed)] [overflow:hidden]">
          <div className="cloud cloud-one [position:absolute] [color:white] [font-size:170px] [opacity:0.8] [top:10%] [left:10%]">
            ☁
          </div>
          <div className="cloud cloud-two [position:absolute] [color:white] [font-size:230px] [opacity:0.8] [top:55%] [right:10%]">
            ☁
          </div>
          <div className="cloud cloud-three [position:absolute] [color:white] [font-size:170px] [opacity:0.8] [bottom:0] [left:40%]">
            ☁
          </div>
          <div className="airplane [position:absolute] [top:42%] [left:36%] [color:#ff914d] [transform:translateX(-500px)] [filter:drop-shadow(0_18px_12px_#5d91ac33)]">
            <Plane size={115} strokeWidth={1.4} />
            <span>PLOP</span>
          </div>
        </div>

        <div className="plane-copy scene-copy [position:absolute] [left:10%] [top:50%] [transform:translateY(-50%)] [z-index:5] [width:42%]">
          <span className="eyebrow [display:inline-flex] [align-items:center] [gap:9px] [font-size:10px] [font-weight:800] [letter-spacing:2px] [color:#8c8679] [margin-bottom:23px]">
            GOING THE EXTRA MILE
          </span>
          <h2 id="plane-heading">
            Taking the
            <br />
            <span>scenic route.</span>
          </h2>
          <p>Some parcels just need to spread their wings.</p>
        </div>
      </section>

      <section
        className="arrival-section story-section [position:relative] [overflow:hidden] [background:#c6e6f3] [isolation:isolate]"
        ref={arrivalRef}
        aria-labelledby="arrival-heading"
      >
        <div className="home-scene [position:absolute] [inset:0] [opacity:0] [background:linear-gradient(#c6e6f3_0_72%,_#c8dfb3_72%)] [overflow:hidden]">
          <div className="sun [position:absolute] [right:17%] [top:12%] [width:90px] [height:90px] [background:#ffd68c] [border-radius:50%]" />
          <div className="house [position:absolute] [bottom:17%] [left:50%] [transform:translateX(-50%)] [width:330px] [height:310px]">
            <div className="roof [position:absolute] [top:0] [left:-30px] [width:390px] [height:170px] [background:#d17d57] [clip-path:polygon(50%_0,_100%_100%,_0_100%)]" />
            <div className="house-body [position:absolute] [bottom:0] [left:15px] [width:300px] [height:205px] [background:#fff1d9] [border:4px_solid_#e6d5b9]">
              <div className="house-window [position:absolute] [top:40px] [left:27px] [width:65px] [height:70px] [background:#a7d9e8] [border:7px_solid_white] [border-radius:5px]" />
              <div className="home-door [position:absolute] [bottom:0] [left:112px] [width:75px] [height:135px] [background:#ff914d] [border:5px_solid_#e8a06c] [transform-origin:left]">
                <span />
              </div>
              <div className="house-window window-two [position:absolute] [top:40px] [width:65px] [height:70px] [background:#a7d9e8] [border:7px_solid_white] [border-radius:5px] [right:27px]" />
            </div>
          </div>
          <div className="home-ground [position:absolute] [width:100%] [bottom:0] [height:18%] [background:#a6c78c]" />
          <div className="home-parcel [position:absolute] [bottom:18%] [left:calc(50%_+_170px)] [z-index:5] [filter:drop-shadow(0_12px_10px_#71502b33)]">
            <div className="mini-box [width:100px] [height:85px] [background:#c9915e] [border:3px_solid_#a8734b] [display:grid] [place-items:center] [color:white] [font-family:Fredoka] [font-size:20px]">
              <span>PLOP.</span>
            </div>
          </div>
        </div>

        {/* FINAL TEXT */}
        <div className="final-copy scene-copy [text-align:center] [left:10%] [width:42%] [top:50%] [transform:translateY(-50%)] [position:absolute] [z-index:5]">
          <div className="success-icon [display:inline-grid] [place-items:center] [background:#e0efd8] [color:#669a61] [width:60px] [height:60px] [border-radius:50%] [margin-bottom:20px]">
            <CheckCircle2 size={30} />
          </div>
          <span className="eyebrow [display:inline-flex] [align-items:center] [gap:9px] [font-size:10px] [font-weight:800] [letter-spacing:2px] [color:#8c8679] [margin-bottom:23px]">
            MISSION ACCOMPLISHED
          </span>
          <h2 id="arrival-heading">
            <span>Plop!</span> It&apos;s here.
          </h2>
          <p>Your parcel made it. Delivered with a little bit of joy.</p>
          <a
            href="#tracking"
            className="button-primary [background:var(--orange)] [color:white] [box-shadow:0_8px_22px_#ff914d33]"
          >
            Send another parcel <ArrowRight size={18} />
          </a>
        </div>
      </section>

      {/* SERVICES */}
      <section
        className="services section-pad [background:#fffdf8] [padding:120px_9%]"
        id="services"
      >
        <div className="section-heading [margin-bottom:55px]">
          <span className="eyebrow [display:inline-flex] [align-items:center] [gap:9px] [font-size:10px] [font-weight:800] [letter-spacing:2px] [color:#8c8679] [margin-bottom:23px]">
            A LITTLE SOMETHING FOR EVERYONE
          </span>
          <h2>
            Wherever it goes,
            <br />
            we&apos;ve got it.
          </h2>
          <p>From just-around-the-corner to across-the-world.</p>
        </div>

        <div className="service-grid [display:grid] [grid-template-columns:repeat(3,_1fr)] [gap:22px]">
          <article className="service-card orange-card [padding:32px] [min-height:330px] [border-radius:24px] [position:relative] [overflow:hidden] [display:flex] [flex-direction:column] [background:#ffeadb]">
            <div className="service-icon [width:55px] [height:55px] [display:grid] [place-items:center] [background:#ffffff9c] [border-radius:17px] [margin-bottom:24px]">
              <Truck size={33} />
            </div>
            <span className="service-tag [font-size:9px] [font-weight:800] [letter-spacing:1.5px] [color:#817b70]">
              QUICK & EASY
            </span>
            <h3>Local delivery</h3>
            <p>For parcels that don&apos;t have to travel too far.</p>
            <div className="card-decoration [position:absolute] [right:15px] [top:90px] [font-size:65px] [opacity:0.7] [transform:rotate(-15deg)]">
              📦
            </div>
            <a href="#tracking">
              Learn more <ArrowUpRight size={17} />
            </a>
          </article>

          <article className="service-card blue-card [padding:32px] [min-height:330px] [border-radius:24px] [position:relative] [overflow:hidden] [display:flex] [flex-direction:column] [background:#e0f1fa]">
            <div className="service-icon [width:55px] [height:55px] [display:grid] [place-items:center] [background:#ffffff9c] [border-radius:17px] [margin-bottom:24px]">
              <Package size={33} />
            </div>
            <span className="service-tag [font-size:9px] [font-weight:800] [letter-spacing:1.5px] [color:#817b70]">
              THE EVERYDAY HERO
            </span>
            <h3>Standard delivery</h3>
            <p>Reliable delivery for your everyday parcels.</p>
            <div className="card-decoration [position:absolute] [right:15px] [top:90px] [font-size:65px] [opacity:0.7] [transform:rotate(-15deg)]">
              🎁
            </div>
            <a href="#tracking">
              Learn more <ArrowUpRight size={17} />
            </a>
          </article>

          <article className="service-card green-card [padding:32px] [min-height:330px] [border-radius:24px] [position:relative] [overflow:hidden] [display:flex] [flex-direction:column] [background:#e8efd9]">
            <div className="service-icon [width:55px] [height:55px] [display:grid] [place-items:center] [background:#ffffff9c] [border-radius:17px] [margin-bottom:24px]">
              <Plane size={33} />
            </div>
            <span className="service-tag [font-size:9px] [font-weight:800] [letter-spacing:1.5px] [color:#817b70]">
              FAR & WIDE
            </span>
            <h3>International</h3>
            <p>Sending something a little further? No problem.</p>
            <div className="card-decoration [position:absolute] [right:15px] [top:90px] [font-size:65px] [opacity:0.7] [transform:rotate(-15deg)]">
              🌎
            </div>
            <a href="#tracking">
              Learn more <ArrowUpRight size={17} />
            </a>
          </article>
        </div>
      </section>

      {/* TRACKING */}
      <section
        className="tracking-section section-pad [background:#292923] [color:white] [position:relative] [overflow:hidden] [display:flex] [justify-content:center] [text-align:center] [padding:120px_9%]"
        id="tracking"
      >
        <div className="tracking-decoration [position:absolute] [font-size:190px] [opacity:0.08] [left:5%] [top:20%] [transform:rotate(-15deg)]">
          📦
        </div>
        <div className="tracking-content [width:100%] [max-width:700px] [position:relative] [z-index:2]">
          <span className="eyebrow [display:inline-flex] [align-items:center] [gap:9px] [font-size:10px] [font-weight:800] [letter-spacing:2px] [color:#8c8679] [margin-bottom:23px]">
            WHERE&apos;S MY PLOP?
          </span>
          <h2>
            Your parcel called.
            <br />
            It&apos;s on an adventure.
          </h2>
          <p>Pop in your tracking number and see where it&apos;s up to.</p>

          <form
            className="tracking-form [display:flex] [align-items:center] [background:white] [padding:8px_8px_8px_18px] [border-radius:50px] [margin-top:35px] [color:#77746c] [gap:12px]"
            onSubmit={handleTracking}
          >
            <MapPin size={20} />
            <input
              value={tracking}
              onChange={(e) => {
                setTracking(e.target.value);
                setTrackingResult(false);
              }}
              placeholder="Enter your tracking number"
              aria-label="Tracking number"
              required
            />
            <button type="submit">
              Track parcel <ArrowRight size={18} />
            </button>
          </form>

          {trackingResult && (
            <div className="tracking-result [display:flex] [align-items:center] [justify-content:center] [gap:8px] [margin-top:18px] [font-size:12px] [color:#bde5b3]">
              <CheckCircle2 size={19} />
              Prototype only: tracking lookup for {tracking} will be connected
              to your backend.
            </div>
          )}
        </div>
      </section>

      {/* WHY PLOP */}
      <section
        className="why-section section-pad [background:var(--cream)] [padding:120px_9%]"
        id="about"
      >
        <div className="section-heading [margin-bottom:55px]">
          <span className="eyebrow [display:inline-flex] [align-items:center] [gap:9px] [font-size:10px] [font-weight:800] [letter-spacing:2px] [color:#8c8679] [margin-bottom:23px]">
            WHY THE PLOP?
          </span>
          <h2>
            Good things
            <br />
            shouldn&apos;t be complicated.
          </h2>
        </div>

        <div className="benefit-grid [display:grid] [grid-template-columns:repeat(3,_1fr)] [gap:40px]">
          <div className="benefit">
            <div className="benefit-icon [width:58px] [height:58px] [border-radius:18px] [background:#ffe5d2] [color:#dc8048] [display:grid] [place-items:center] [margin-bottom:20px]">
              <Clock3 />
            </div>
            <h3>Right on time</h3>
            <p>We believe your parcels deserve punctuality.</p>
          </div>
          <div className="benefit">
            <div className="benefit-icon [width:58px] [height:58px] [border-radius:18px] [background:#ffe5d2] [color:#dc8048] [display:grid] [place-items:center] [margin-bottom:20px]">
              <ShieldCheck />
            </div>
            <h3>Safe & sound</h3>
            <p>Every parcel deserves a little extra care.</p>
          </div>
          <div className="benefit">
            <div className="benefit-icon [width:58px] [height:58px] [border-radius:18px] [background:#ffe5d2] [color:#dc8048] [display:grid] [place-items:center] [margin-bottom:20px]">
              <PackageCheck />
            </div>
            <h3>Easy peasy</h3>
            <p>Simple sending and tracking, minus the fuss.</p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer [background:#f0e9dd] [padding:65px_9%_25px]">
        <div className="footer-main [display:flex] [justify-content:space-between] [gap:50px] [padding-bottom:55px]">
          <div>
            <a
              href="#"
              className="logo footer-logo [font-family:Fredoka,sans-serif] [font-size:37px] [font-weight:700] [letter-spacing:-2px]"
            >
              plop<span>.</span>
            </a>
            <p>Little boxes. Big adventures.</p>
          </div>

          <div className="footer-links [display:flex] [gap:90px]">
            <div>
              <strong>Explore</strong>
              <a href="#services">Services</a>
              <a href="#tracking">Track parcel</a>
              <a href="#about">About us</a>
            </div>
            <div>
              <strong>Say hello</strong>
              <a href="mailto:hello@plop.example">Email us</a>
              <a href="#about">Contact</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom [padding-top:22px] [border-top:1px_solid_#ded6c9] [display:flex] [justify-content:space-between] [font-size:11px] [color:#898477]">
          <span>© 2026 PLOP. Made for the journey.</span>
          <span>Handle with care ♡</span>
        </div>
      </footer>

      <style jsx global>{`
        /* Residual CSS: global rules, responsive overrides, pseudo-selectors and animation keyframes.
           Component layout/appearance declarations have been moved to Tailwind arbitrary utilities in JSX. */
        @import url("https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Fredoka:wght@400;500;600;700&display=swap");
        :root {
          --cream: #fff9ef;
          --orange: #ff914d;
          --dark: #292923;
          --muted: #77746c;
          --blue: #b7e1f5;
          --green: #dce9ce;
        }
        * {
          box-sizing: border-box;
        }
        html {
          scroll-behavior: smooth;
        }
        body {
          margin: 0;
          background: var(--cream);
          color: var(--dark);
          font-family: "DM Sans", sans-serif;
          overflow-x: hidden;
        }
        .homepage {
          background: var(--dark);
        }
        a {
          text-decoration: none;
          color: inherit;
        }
        button,
        input {
          font: inherit;
        }
        button {
          cursor: pointer;
        }
        .logo span {
          color: var(--orange);
        }
        .hero-section,
        .packing-section {
          --floating-parcel-top: 3%;
          --floating-parcel-left: 5%;
          --floating-parcel-b-top: 8%;
          --floating-parcel-b-left: 46%;
          --floating-parcel-c-top: 68%;
          --floating-parcel-c-left: 3%;
          --floating-parcel-d-top: 73%;
          --floating-parcel-d-left: 56%;
          --floating-parcel-e-top: 12%;
          --floating-parcel-e-right: 8%;
          --hero-parcel-top: 18%;
          --hero-parcel-right: clamp(24px, 6vw, 90px);
        }
        .hero-section {
          height: calc(100vh - 82px);
          height: clamp(480px, calc(100svh - 82px), 860px);
        }
        .story-section {
          height: min(100vh, 900px);
          height: min(100svh, 900px);
          min-height: 620px;
        }
        .float-a {
          top: var(--floating-parcel-top);
          left: var(--floating-parcel-left);
          pointer-events: auto;
          touch-action: none;
          cursor: grab;
        }
        .float-a:active {
          cursor: grabbing;
        }
        .decorative-parcel {
          position: absolute;
          z-index: 1;
          pointer-events: none;
        }
        .float-b {
          top: var(--floating-parcel-b-top);
          left: var(--floating-parcel-b-left);
          width: 88px;
          height: 88px;
        }
        .float-c {
          top: var(--floating-parcel-c-top);
          left: var(--floating-parcel-c-left);
          width: 68px;
          height: 68px;
        }
        .float-d {
          top: var(--floating-parcel-d-top);
          left: var(--floating-parcel-d-left);
          width: 78px;
          height: 78px;
        }
        .float-e {
          top: var(--floating-parcel-e-top);
          right: var(--floating-parcel-e-right);
          width: 60px;
          height: 60px;
        }
        .hero-box-container {
          top: var(--hero-parcel-top);
          right: var(--hero-parcel-right);
        }
        .nav-links {
          display: flex;
          align-items: center;
          gap: 32px;
          color: var(--muted);
          font-size: 13px;
          font-weight: 600;
        }
        .nav-links a:hover {
          color: var(--orange);
        }
        .nav-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .nav-cta {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 13px 20px;
          border: 1.5px solid transparent;
          border-radius: 30px;
          font-size: 13px;
          font-weight: 700;
          white-space: nowrap;
          transition:
            background 0.2s,
            color 0.2s,
            border-color 0.2s;
        }
        .nav-sign-in {
          border-color: #e4dfd5;
        }
        .nav-get-started {
          background: var(--dark);
          color: white;
        }
        .nav-get-started:hover {
          background: #171717;
        }
        .hero-copy h1,
        .scene-copy h2,
        .section-heading h2,
        .tracking-content h2 {
          font-family: "Fredoka", sans-serif;
          font-weight: 600;
          letter-spacing: -2px;
          line-height: 1.08;
          font-size: clamp(46px, 6vw, 82px);
          margin: 0 0 22px;
        }
        .hero-copy h1 span,
        .scene-copy h2 span {
          color: var(--orange);
        }
        .scene-copy p {
          color: var(--muted);
          line-height: 1.8;
          font-size: 15px;
        }
        .hero-copy p {
          color: var(--muted);
          line-height: 1.8;
          font-size: 15px;
          margin-bottom: 30px;
        }
        .button-primary,
        .button-secondary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 16px 23px;
          border-radius: 30px;
          font-size: 13px;
          font-weight: 700;
          transition: 0.2s;
        }
        .button-primary:hover {
          transform: translateY(-3px);
        }
        .float-a canvas {
          pointer-events: none;
        }
        .hero-box-canvas-wrapper:active {
          cursor: grabbing;
        }
        .drop-panel {
          height: min(100vh, 900px);
          height: min(100svh, 900px);
          min-height: 620px;
          position: relative;
          overflow: hidden;
          color: var(--cream);
          background:
            radial-gradient(ellipse at 76% 48%, #51463b 0%, transparent 42%),
            var(--dark);
          isolation: isolate;
        }
        .drop-panel-inner {
          width: min(1440px, 100%);
          height: 100%;
          margin: 0 auto;
          padding: 48px 9%;
          display: grid;
          grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
          align-items: center;
        }
        .drop-panel-copy {
          position: relative;
          z-index: 2;
          max-width: 470px;
          opacity: 0;
          transform: translateY(28px);
        }
        .drop-panel-eyebrow {
          color: #ffc49b;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 2px;
        }
        .drop-panel-copy h2 {
          margin: 16px 0 20px;
          color: var(--cream);
          font-family: "Fredoka", sans-serif;
          font-size: clamp(48px, 6vw, 78px);
          font-weight: 600;
          letter-spacing: -2px;
          line-height: 1.04;
        }
        .drop-panel-copy p {
          max-width: 390px;
          color: #d5d0c8;
          font-size: 15px;
          line-height: 1.8;
        }
        .drop-panel-hint {
          display: inline-block;
          margin-top: 20px;
          color: #ffc49b;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.6px;
        }
        .drop-panel-stage {
          position: relative;
          display: grid;
          height: 100%;
          min-height: 0;
          place-items: center;
        }
        .drop-panel-ground {
          position: absolute;
          bottom: 14%;
          width: 78%;
          height: 44px;
          border: 1px solid #ffbd8b55;
          border-radius: 50% 50% 12px 12px / 60% 60% 12px 12px;
          background:
            radial-gradient(ellipse at 50% 0%, #ff914d66 0%, #ff914d00 72%),
            linear-gradient(180deg, #59483c 0%, #332c26 100%);
          box-shadow: 0 16px 30px #00000035;
        }
        .drop-parcel {
          position: absolute;
          z-index: 1;
          width: min(460px, 40vw, 62svh);
          height: min(460px, 40vw, 62svh);
          bottom: calc(14% + 44px - 150px);
          left: 0;
          right: 0;
          margin-inline: auto;
          filter: drop-shadow(0 28px 20px #00000042);
          will-change: transform, opacity;
        }
        .parcel-illustration {
          position: absolute;
          width: 210px;
          height: 190px;
          transform-style: preserve-3d;
          filter: drop-shadow(0 25px 20px #6b462833);
        }
        .drop-opening-parcel {
          z-index: 3;
          bottom: calc(14% + 44px);
          left: 0;
          right: 0;
          margin-inline: auto;
          opacity: 0;
          will-change: transform, opacity;
        }
        .packaging-parcel {
          z-index: 3;
          top: 48%;
          left: 65%;
          margin-top: -95px;
          margin-left: -105px;
          opacity: 0;
          transform: scale(0.2) rotate(-15deg);
          will-change: transform, opacity;
        }
        .parcel-flap {
          position: absolute;
          z-index: 2;
          border: 2px solid #b98556;
          background: #e1b17f;
          transform-origin: bottom;
          backface-visibility: hidden;
        }
        .flap-left,
        .flap-right {
          top: -30%;
          width: 50%;
          height: 35%;
          transform: rotateX(90deg);
        }
        .flap-left {
          left: 0;
        }
        .flap-right {
          right: 0;
        }
        .flap-back {
          top: -22%;
          left: 0;
          width: 100%;
          height: 35%;
        }
        .parcel-face {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #ad794e;
          background: #c9915e;
        }
        .parcel-contents {
          position: absolute;
          inset: 0;
          z-index: 1;
        }
        .parcel-fill-item {
          position: absolute;
          bottom: 24px;
          width: 22px;
          height: 17px;
          border: 1px solid #95633f;
          border-radius: 3px;
          opacity: 0;
          transform: translateY(-38px) scale(0.55);
          box-shadow: inset 0 3px 0 #ffffff66;
        }
        .fill-item-one {
          left: 28%;
          background: #e8c996;
        }
        .fill-item-two {
          left: 43%;
          background: #a9c2a0;
        }
        .fill-item-three {
          left: 58%;
          background: #edac77;
        }
        .tape-strip {
          position: absolute;
          z-index: 2;
          left: 42%;
          width: 38px;
          height: 100%;
          background: var(--orange);
          transform: scaleX(0);
          transform-origin: left;
        }
        .shipping-label {
          position: absolute;
          z-index: 3;
          display: flex;
          width: 95px;
          height: 78px;
          flex-direction: column;
          gap: 5px;
          padding: 9px;
          background: #fff9e9;
          color: #39332c;
          font-size: 8px;
          transform: scale(0);
        }
        .barcode {
          font-size: 13px;
          letter-spacing: 2px;
        }
        .parcel-mark {
          position: absolute;
          bottom: 13px;
          left: 12px;
          color: #f9e5ca;
          font-size: 8px;
          letter-spacing: 1px;
        }
        .gather-copy,
        .seal-copy,
        .truck-copy,
        .plane-copy,
        .final-copy {
          opacity: 0;
          transform: translateY(50px);
          pointer-events: none;
        }
        .shipping-label strong {
          font-family: "Fredoka";
          font-size: 17px;
        }
        .airplane span {
          position: absolute;
          font-family: "Fredoka";
          font-weight: 700;
          font-size: 13px;
          color: white;
          top: 49px;
          left: 48px;
          transform: rotate(-10deg);
        }
        .home-door span {
          position: absolute;
          right: 10px;
          top: 65px;
          width: 7px;
          height: 7px;
          background: white;
          border-radius: 50%;
        }
        .final-copy .button-primary {
          margin-top: 20px;
          pointer-events: auto;
        }
        .scroll-chevron {
          color: var(--orange);
          font-size: 24px;
          line-height: 1;
        }
        .section-heading h2 {
          font-size: clamp(42px, 5vw, 65px);
        }
        .section-heading p {
          color: var(--muted);
          font-size: 14px;
        }
        .service-card h3 {
          font-family: "Fredoka";
          font-size: 27px;
          margin: 12px 0 8px;
        }
        .service-card p {
          color: #77746c;
          font-size: 13px;
          line-height: 1.7;
          max-width: 220px;
        }
        .service-card a {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 12px;
          font-weight: 800;
          margin-top: auto;
        }
        .tracking-content .eyebrow {
          color: #c9bfb1;
        }
        .tracking-content h2 {
          font-size: clamp(40px, 5vw, 65px);
        }
        .tracking-content p {
          color: #c6c2b9;
          font-size: 14px;
        }
        .tracking-form input {
          flex: 1;
          min-width: 0;
          border: none;
          outline: none;
          color: var(--dark);
          font-size: 13px;
          background: transparent;
        }
        .tracking-form button {
          border: none;
          border-radius: 40px;
          background: var(--orange);
          color: white;
          padding: 15px 21px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 700;
          white-space: nowrap;
        }
        .benefit h3 {
          font-family: "Fredoka";
          font-size: 23px;
          margin: 0 0 10px;
        }
        .benefit p {
          color: var(--muted);
          font-size: 13px;
          line-height: 1.8;
          max-width: 250px;
        }
        .footer-main p {
          color: var(--muted);
          font-size: 13px;
        }
        .footer-links div {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .footer-links strong {
          font-size: 12px;
          margin-bottom: 7px;
        }
        .footer-links a {
          font-size: 12px;
          color: var(--muted);
        }
        @media (max-width: 768px) {
          .navbar {
            height: 70px;
            padding: 0 6%;
          }
          .logo {
            font-size: 32px;
          }
          .nav-cta {
            padding: 11px 15px;
          }
          .nav-actions {
            margin-left: auto;
            margin-right: 12px;
          }
          .nav-sign-in {
            display: none;
          }
          .mobile-menu {
            display: block;
            border: none;
            background: transparent;
            padding: 6px;
          }
          .nav-links {
            display: none;
            position: absolute;
            top: 70px;
            left: 0;
            right: 0;
            padding: 25px;
            background: white;
            flex-direction: column;
            align-items: flex-start;
            gap: 22px;
            box-shadow: 0 12px 20px #29292312;
            z-index: 20;
          }
          .nav-links.open {
            display: flex;
          }
          .hero-section {
            height: calc(100vh - 70px);
            height: clamp(480px, calc(100svh - 70px), 860px);
          }
          .scene-copy {
            left: 7%;
            width: 86%;
            top: 29%;
          }
          .hero-copy {
            top: 34%;
          }
          .hero-copy h1 {
            font-size: clamp(43px, 12vw, 65px);
          }
          .hero-copy p {
            font-size: 13px;
          }
          .hero-actions {
            gap: 8px;
          }
          .button-primary,
          .button-secondary {
            padding: 14px 17px;
            font-size: 11px;
          }
          .float-a {
            right: auto;
            width: 72px;
            height: 72px;
          }
          .hero-section,
          .packing-section {
            --floating-parcel-top: 3%;
            --floating-parcel-left: 3%;
            --floating-parcel-b-top: 5%;
            --floating-parcel-b-left: 70%;
            --floating-parcel-c-top: 73%;
            --floating-parcel-c-left: 3%;
            --floating-parcel-d-top: 82%;
            --floating-parcel-d-left: 58%;
            --floating-parcel-e-top: 19%;
            --floating-parcel-e-right: 8%;
            --hero-parcel-top: 58%;
            --hero-parcel-right: 5%;
          }
          .hero-box-container {
            width: min(230px, 60vw);
            height: min(230px, 60vw);
            min-width: 0;
            min-height: 0;
          }
          .drop-panel-inner {
            grid-template-columns: minmax(0, 1fr);
            grid-template-rows: auto minmax(0, 1fr);
            padding: 5vh 7% 3vh;
          }
          .drop-panel-copy h2 {
            margin: 10px 0 12px;
            font-size: clamp(40px, 10vw, 58px);
          }
          .drop-panel-copy p {
            max-width: 540px;
            margin: 0;
            font-size: 13px;
            line-height: 1.55;
          }
          .drop-panel-hint {
            margin-top: 10px;
          }
          .drop-parcel {
            width: min(290px, 68vw, 42svh);
            height: min(290px, 68vw, 42svh);
            bottom: calc(12% + 32px - 90px);
          }
          .drop-panel-ground {
            bottom: 12%;
            width: 82%;
            height: 32px;
          }
          .drop-opening-parcel {
            width: 180px;
            height: 162px;
            bottom: calc(12% + 32px);
          }
          .packaging-parcel {
            top: 65%;
            left: 50%;
            width: 180px;
            height: 162px;
            margin-top: -81px;
            margin-left: -90px;
          }
          .truck-copy,
          .gather-copy,
          .seal-copy,
          .plane-copy {
            top: 20%;
          }
          .delivery-truck {
            left: 5%;
            transform: translateX(-500px) scale(0.8);
            transform-origin: bottom left;
          }
          .airplane {
            left: 15%;
          }
          .house {
            transform: translateX(-50%) scale(0.75);
            transform-origin: bottom center;
          }
          .home-parcel {
            left: calc(50% + 95px);
          }
          .final-copy {
            top: 27%;
            width: 90%;
            left: 5%;
          }
          .final-copy h2 {
            font-size: 48px;
          }
          .section-pad {
            padding: 80px 6%;
          }
          .service-grid {
            grid-template-columns: 1fr;
          }
          .service-card {
            min-height: 280px;
          }
          .benefit-grid {
            grid-template-columns: 1fr;
            gap: 28px;
          }
          .tracking-form {
            border-radius: 20px;
            flex-wrap: wrap;
            padding: 14px;
          }
          .tracking-form input {
            flex: 1;
          }
          .tracking-form button {
            width: 100%;
            justify-content: center;
          }
          .footer-main {
            flex-direction: column;
          }
          .footer-links {
            gap: 50px;
          }
          .footer-bottom {
            gap: 15px;
            flex-wrap: wrap;
          }
          .scroll-indicator {
            font-size: 8px;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>
    </main>
  );
}

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
  Truck,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import HeroParcel from "@/components/HeroParcel";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import gsap from "gsap";

gsap.registerPlugin(ScrollTrigger);

type BoxName = "floating" | "bouncing" | "droppable";
type RotationAxis = "x" | "y" | "z";
type BoxRotation = Record<RotationAxis, number>;
const ROTATION_LABELS: Record<RotationAxis, string> = {
  x: "X axis - pitch",
  y: "Y axis - yaw",
  z: "Z axis - roll",
};

const BOX_ROTATIONS: Record<BoxName, BoxRotation> = {
  floating: { x: 0, y: -90, z: 0 },
  bouncing: { x: 53, y: -71, z: 18 },
  droppable: { x: 0, y: -90, z: 0 },
} as const;

export default function Home() {
  const journeyRef = useRef<HTMLElement>(null);
  const bottomParcelRef = useRef<HTMLDivElement>(null);
  const bottomParcelDropTimer = useRef<number | null>(null);
  const hasDroppedBottomParcel = useRef(false);
  const parcelDragRef = useRef<{
    offsetX: number;
    offsetY: number;
    pointerId: number;
  } | null>(null);
  const [tracking, setTracking] = useState("");
  const [trackingResult, setTrackingResult] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [gravityBoxPos, setGravityBoxPos] = useState<{ x: number; y: number } | null>(null);
  const [isGravityDragging, setIsGravityDragging] = useState(false);
  const [boxRotations, setBoxRotations] = useState(BOX_ROTATIONS);
  const [activeRotationBox, setActiveRotationBox] = useState<BoxName>("floating");
  const gravityDragRef = useRef<{ offsetX: number; offsetY: number; pointerId: number } | null>(null);

  function updateBoxRotation(axis: RotationAxis, value: number) {
    const degrees = Math.max(-180, Math.min(180, value));
    setBoxRotations((current) => ({
      ...current,
      [activeRotationBox]: {
        ...current[activeRotationBox],
        [axis]: degrees,
      },
    }));
  }

  useEffect(() => {
    const section = journeyRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "+=5000",
          scrub: 1,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      // 1. Floating boxes gather together
      tl.to(
        ".float-a",
        {
          x: 180,
          y: 160,
          rotation: 0,
          scale: 0.8,
          duration: 2,
        },
        0,
      );


      tl.to(
        ".hero-copy",
        {
          y: -100,
          opacity: 0,
          duration: 1,
        },
        0,
      );

      tl.to(
        ".hero-box-container",
        {
          y: -80,
          opacity: 0,
          duration: 1,
        },
        0,
      );

      tl.to(
        ".scroll-indicator",
        {
          opacity: 0,
          y: -10,
          duration: 0.25,
        },
        0.15,
      );

      tl.to(
        ".gather-copy",
        {
          opacity: 1,
          y: 0,
          duration: 1,
        },
        1,
      );

      // 2. Assemble the parcel
      tl.to(
        ".floating-boxes",
        {
          opacity: 0,
          scale: 0.3,
          duration: 1,
        },
        2,
      );

      tl.to(
        ".assembled-parcel",
        {
          opacity: 1,
          scale: 1,
          rotation: 0,
          duration: 1.5,
        },
        2.2,
      );

      tl.to(
        ".parcel-flap",
        {
          rotateX: 0,
          duration: 1,
          stagger: 0.2,
        },
        3,
      );

      tl.to(
        ".gather-copy",
        {
          opacity: 0,
          y: -50,
        },
        3.5,
      );

      tl.to(
        ".seal-copy",
        {
          opacity: 1,
          y: 0,
        },
        3.7,
      );

      // 3. Tape seals the box
      tl.to(
        ".tape-strip",
        {
          scaleX: 1,
          duration: 1,
        },
        4,
      );

      tl.to(
        ".shipping-label",
        {
          scale: 1,
          rotation: -4,
          duration: 0.6,
        },
        4.5,
      );

      tl.to(
        ".assembled-parcel",
        {
          y: -60,
          scale: 0.7,
          duration: 1,
        },
        5,
      );

      tl.to(
        ".seal-copy",
        {
          opacity: 0,
        },
        5.2,
      );

      // 4. Truck enters
      tl.to(
        ".truck-scene",
        {
          opacity: 1,
          duration: 0.5,
        },
        5.5,
      );

      tl.to(
        ".delivery-truck",
        {
          x: 0,
          duration: 1.5,
          ease: "power2.out",
        },
        5.5,
      );

      tl.to(
        ".assembled-parcel",
        {
          x: 0,
          y: 80,
          scale: 0.35,
          duration: 1,
        },
        6,
      );

      tl.to(
        ".assembled-parcel",
        {
          x: 0,
          y: 180,
          scale: 0.2,
          opacity: 0,
          duration: 0.8,
        },
        7,
      );

      tl.to(
        ".truck-copy",
        {
          opacity: 1,
          y: 0,
        },
        6.5,
      );

      tl.to(
        ".delivery-truck",
        {
          x: 1200,
          duration: 2,
          ease: "power2.in",
        },
        7.5,
      );

      tl.to(
        ".truck-scene",
        {
          opacity: 0,
          duration: 0.5,
        },
        9,
      );

      tl.to(
        ".truck-copy",
        {
          opacity: 0,
        },
        9,
      );

      // 5. Airplane takes over
      tl.to(
        ".sky-scene",
        {
          opacity: 1,
          duration: 1,
        },
        9,
      );

      tl.fromTo(
        ".airplane",
        { x: -500, y: 100, rotation: -8 },
        {
          x: 0,
          y: 0,
          rotation: 0,
          duration: 2,
        },
        9.5,
      );

      tl.to(
        ".cloud-one",
        {
          x: 500,
          duration: 3,
        },
        10,
      );

      tl.to(
        ".cloud-two",
        {
          x: -400,
          duration: 3,
        },
        10,
      );

      tl.to(
        ".plane-copy",
        {
          opacity: 1,
          y: 0,
        },
        10.5,
      );

      tl.to(
        ".airplane",
        {
          x: 1300,
          y: -250,
          rotation: -10,
          duration: 2,
        },
        12,
      );

      tl.to(
        ".sky-scene",
        {
          opacity: 0,
          duration: 0.8,
        },
        13.5,
      );

      tl.to(
        ".plane-copy",
        {
          opacity: 0,
        },
        13.5,
      );

      // 6. Arrive at the house
      tl.to(
        ".home-scene",
        {
          opacity: 1,
          duration: 1,
        },
        14,
      );

      tl.fromTo(
        ".home-parcel",
        { y: -350, rotation: -15, scale: 0.5 },
        {
          y: 0,
          rotation: 0,
          scale: 1,
          duration: 2,
          ease: "bounce.out",
        },
        15,
      );

      tl.to(
        ".home-door",
        {
          rotationY: -90,
          duration: 1,
        },
        16.5,
      );

      tl.to(
        ".final-copy",
        {
          opacity: 1,
          y: 0,
          duration: 1,
        },
        17,
      );
    }, section);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const parcel = bottomParcelRef.current;
    if (!parcel) return;

    const triggerDrop = () => {
      if (hasDroppedBottomParcel.current) return;

      bottomParcelDropTimer.current = window.setTimeout(() => {
        hasDroppedBottomParcel.current = true;

        const tl = gsap.timeline();
        tl.to(parcel, {
          y: 0,
          duration: 0.72,
          ease: "bounce.out",
        }).fromTo(
          ".drop-particle",
          { opacity: 0.9, scale: 0.25, y: 0 },
          {
            opacity: 0,
            scale: 1.45,
            y: (index: number) => -22 - index * 9,
            x: (index: number) => (index - 3) * 17,
            duration: 0.58,
            stagger: 0.035,
            ease: "power2.out",
          },
          "-=0.15",
        );
      }, 650);
    };

    const handleScroll = () => {
      if (window.scrollY < 8 || hasDroppedBottomParcel.current) return;

      if (bottomParcelDropTimer.current) {
        window.clearTimeout(bottomParcelDropTimer.current);
      }

      // Keep the top-view parcel still while the page is moving, then let it land.
      gsap.killTweensOf(parcel);
      gsap.set(parcel, { y: -150, rotation: 0 });
      gsap.set(".drop-particle", { opacity: 0, x: 0, y: 0, scale: 0.25 });
      triggerDrop();
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (bottomParcelDropTimer.current) {
        window.clearTimeout(bottomParcelDropTimer.current);
      }
    };
  }, []);

  function handleTracking(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (tracking.trim()) setTrackingResult(true);
  }

  function handleParcelDragStart(e: React.PointerEvent<HTMLDivElement>) {
    const section = journeyRef.current;
    if (!section) return;

    const parcelBounds = e.currentTarget.getBoundingClientRect();
    parcelDragRef.current = {
      offsetX: e.clientX - parcelBounds.left,
      offsetY: e.clientY - parcelBounds.top,
      pointerId: e.pointerId,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handleParcelDragMove(e: React.PointerEvent<HTMLDivElement>) {
    const drag = parcelDragRef.current;
    const section = journeyRef.current;
    if (!drag || drag.pointerId !== e.pointerId || !section) return;

    const sectionBounds = section.getBoundingClientRect();
    const parcelBounds = e.currentTarget.getBoundingClientRect();
    const left = Math.min(
      Math.max(0, e.clientX - sectionBounds.left - drag.offsetX),
      sectionBounds.width - parcelBounds.width,
    );
    const top = Math.min(
      Math.max(0, e.clientY - sectionBounds.top - drag.offsetY),
      sectionBounds.height - parcelBounds.height,
    );

    e.currentTarget.style.left = `${(left / sectionBounds.width) * 100}%`;
    e.currentTarget.style.top = `${(top / sectionBounds.height) * 100}%`;
  }

  function handleParcelDragEnd(e: React.PointerEvent<HTMLDivElement>) {
    if (parcelDragRef.current?.pointerId !== e.pointerId) return;

    parcelDragRef.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  }

  function handleGravityBoxDragStart(e: React.PointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    const box = e.currentTarget;
    const bounds = box.getBoundingClientRect();
    gravityDragRef.current = {
      offsetX: e.clientX - bounds.left,
      offsetY: e.clientY - bounds.top,
      pointerId: e.pointerId,
    };
    try {
      box.setPointerCapture(e.pointerId);
    } catch {}
    setIsGravityDragging(true);

    if (!gravityBoxPos) {
      setGravityBoxPos({ x: bounds.left, y: bounds.top });
    }

    if (bottomParcelRef.current) {
      gsap.killTweensOf(bottomParcelRef.current);
      gsap.set(bottomParcelRef.current, { y: 0 });
    }
  }

  function handleGravityBoxDragMove(e: React.PointerEvent<HTMLDivElement>) {
    const drag = gravityDragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;

    const overlayW = 154;
    const overlayH = 154;
    const x = Math.min(
      Math.max(10, e.clientX - drag.offsetX),
      window.innerWidth - overlayW - 10,
    );
    const y = Math.min(
      Math.max(10, e.clientY - drag.offsetY),
      window.innerHeight - overlayH - 10,
    );
    setGravityBoxPos({ x, y });
    if (bottomParcelRef.current) {
      gsap.set(bottomParcelRef.current, { y: 0 });
    }
  }

  function handleGravityBoxDragEnd(e: React.PointerEvent<HTMLDivElement>) {
    if (gravityDragRef.current?.pointerId !== e.pointerId) return;
    gravityDragRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    setIsGravityDragging(false);

    // True gravity drop from current position all the way down to the bottom floor
    const overlayH = 154;
    const floorY = window.innerHeight - overlayH - 18;
    const currentY = gravityBoxPos ? gravityBoxPos.y : floorY;
    const currentX = gravityBoxPos ? gravityBoxPos.x : (window.innerWidth - 170);

    if (currentY < floorY) {
      const dropDistance = floorY - currentY;
      const duration = Math.min(0.85, Math.max(0.42, Math.sqrt(dropDistance / 500) * 0.7));
      const animObj = { y: currentY };

      gsap.to(animObj, {
        y: floorY,
        duration: duration,
        ease: "bounce.out",
        onUpdate: () => {
          setGravityBoxPos({ x: currentX, y: animObj.y });
        },
        onComplete: () => {
          setGravityBoxPos({ x: currentX, y: floorY });
          gsap.fromTo(
            ".drop-particle",
            { opacity: 0.9, scale: 0.25, y: 0, x: 0 },
            {
              opacity: 0,
              scale: 1.45,
              y: (index: number) => -22 - index * 9,
              x: (index: number) => (index - 3) * 17,
              duration: 0.58,
              stagger: 0.035,
              ease: "power2.out",
            }
          );
        },
      });
    }
  }

  return (
    <main>
      {/* NAVIGATION */}
      <nav className="navbar [height:82px] [padding:0_7%] [display:flex] [align-items:center] [justify-content:space-between] [background:var(--cream)] [position:relative] [z-index:50]">
        <a
          href="#"
          className="logo [font-family:Fredoka,sans-serif] [font-size:37px] [font-weight:700] [letter-spacing:-2px]"
        >
          plop<span>.</span>
        </a>

        <div className={`nav-links ${menuOpen ? "open" : ""}`}>
          <a href="#services" onClick={() => setMenuOpen(false)}>
            Services
          </a>
          <a href="#tracking" onClick={() => setMenuOpen(false)}>
            Track parcel
          </a>
          <a href="#about" onClick={() => setMenuOpen(false)}>
            About us
          </a>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <a
            href="/login"
            className="nav-cta [background:var(--dark)] [color:white] [padding:13px_20px] [border-radius:30px] [font-size:13px] [display:flex] [align-items:center] [gap:10px]"
            style={{
              background: "transparent",
              color: "var(--dark)",
              border: "1.5px solid #e4dfd5",
            }}
          >
            Sign in
          </a>
          <a
            href="/register"
            className="nav-cta [background:var(--dark)] [color:white] [padding:13px_20px] [border-radius:30px] [font-size:13px] [display:flex] [align-items:center] [gap:10px]"
          >
            Register <ArrowUpRight size={17} />
          </a>
        </div>

        <button
          className="mobile-menu [display:none]"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation"
        >
          <Menu />
        </button>
      </nav>

      {/* HERO AND SCROLL JOURNEY */}
      <section
        className="journey [height:calc(100vh_-_82px)] [min-height:650px] [position:relative] [overflow:hidden] [background:var(--cream)] [isolation:isolate]"
        ref={journeyRef}
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
              href="#tracking"
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

        {/* FLOATING PARCELS */}
        <div className="floating-boxes [position:absolute] [width:100%] [height:100%] [top:0] [left:0] [perspective:1000px] [pointer-events:none] [z-index:6]">
          <div
            className="float-box float-a [position:absolute] [width:190px] [height:190px] [transform-style:preserve-3d] [will-change:transform] [overflow:visible] [top:15%] [left:5%] [z-index:1] [cursor:grab] [pointer-events:auto] [touch-action:none]"
            onPointerDown={handleParcelDragStart}
            onPointerMove={handleParcelDragMove}
            onPointerUp={handleParcelDragEnd}
            onPointerCancel={handleParcelDragEnd}
          >
            <HeroParcel
              motionSpeed={0.2}
              motion="logo-tour"
              rotationXDegrees={boxRotations.floating.x}
              rotationYDegrees={boxRotations.floating.y}
              rotationZDegrees={boxRotations.floating.z}
            />
          </div>
        </div>

        {/* HERO MAIN PARCEL (3D & PANNABLE) */}
        <div className="hero-box-container [position:absolute] [top:18%] [right:clamp(24px,_6vw,_90px)] [width:min(440px,_35vw)] [height:min(440px,_35vw)] [min-width:260px] [min-height:260px] [pointer-events:auto] [z-index:10] [user-select:none]">
          <div className="hero-box-layout [width:100%] [height:100%] [display:flex] [flex-direction:column] [align-items:center] [justify-content:center]">
            <div className="hero-box-canvas-wrapper [width:100%] [height:90%] [pointer-events:auto] [user-select:none] [cursor:grab]">
              <HeroParcel
                interactive
                motion="bob"
                quarterView
                rotationXDegrees={boxRotations.bouncing.x}
                rotationYDegrees={boxRotations.bouncing.y}
                rotationZDegrees={boxRotations.bouncing.z}
              />
            </div>
            <div className="hero-box-shadow [width:58%] [height:20px] [border-radius:50%] [background:radial-gradient(ellipse_at_center,_rgba(60,_25,_5,_0.28)_0%,_rgba(60,_25,_5,_0)_72%)] [margin-top:-12px] [opacity:0.35]" />
          </div>
        </div>

        {/* GATHERING TEXT */}
        <div className="gather-copy scene-copy [position:absolute] [left:10%] [top:50%] [transform:translateY(-50%)] [z-index:5] [width:42%]">
          <span className="eyebrow [display:inline-flex] [align-items:center] [gap:9px] [font-size:10px] [font-weight:800] [letter-spacing:2px] [color:#8c8679] [margin-bottom:23px]">
            IT ALL STARTS SOMEWHERE
          </span>
          <h2>
            Let&apos;s get
            <br />
            things moving.
          </h2>
          <p>Every great delivery starts with a little box.</p>
        </div>

        {/* ASSEMBLED PARCEL */}
        <div className="assembled-parcel [position:absolute] [width:210px] [height:190px] [top:48%] [left:65%] [opacity:0] [transform:translate(-50%,_-50%)_scale(0.2)_rotate(-15deg)] [transform-style:preserve-3d] [z-index:3] [filter:drop-shadow(0_25px_20px_#6b462833)]">
          <div className="parcel-flap flap-left [position:absolute] [width:50%] [height:35%] [top:-30%] [background:#e1b17f] [border:2px_solid_#b98556] [z-index:2] [transform-origin:bottom] [left:0] [transform:rotateX(90deg)]" />
          <div className="parcel-flap flap-right [position:absolute] [width:50%] [height:35%] [top:-30%] [background:#e1b17f] [border:2px_solid_#b98556] [z-index:2] [transform-origin:bottom] [right:0] [transform:rotateX(90deg)]" />
          <div className="parcel-flap flap-back [position:absolute] [width:100%] [height:35%] [background:#e1b17f] [border:2px_solid_#b98556] [z-index:2] [transform-origin:bottom] [left:0] [top:-22%]" />
          <div className="parcel-face [position:absolute] [inset:0] [background:#c9915e] [border:2px_solid_#ad794e] [display:flex] [align-items:center] [justify-content:center]">
            <div className="tape-strip [position:absolute] [width:38px] [height:100%] [left:42%] [background:#ff914d] [transform:scaleX(0)] [transform-origin:left] [z-index:2]" />
            <div className="shipping-label [position:absolute] [width:95px] [height:78px] [padding:9px] [background:#fff9e9] [color:#39332c] [z-index:3] [transform:scale(0)] [display:flex] [flex-direction:column] [gap:5px] [font-size:8px]">
              <strong>PLOP.</strong>
              <span>TO: SOMEWHERE NICE</span>
              <div className="barcode [letter-spacing:2px] [font-size:13px]">
                |||| ||| || ||||
              </div>
            </div>
            <span className="parcel-mark [position:absolute] [bottom:13px] [left:12px] [font-size:8px] [letter-spacing:1px] [color:#f9e5ca]">
              HANDLE WITH CARE ♡
            </span>
          </div>
        </div>

        {/* SEAL TEXT */}
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

        {/* TRUCK SCENE */}
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
          <h2>
            Off we <span>go!</span>
          </h2>
          <p>Your parcel is hitting the road.</p>
        </div>

        {/* AIRPLANE SCENE */}
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
          <h2>
            Taking the
            <br />
            <span>scenic route.</span>
          </h2>
          <p>Some parcels just need to spread their wings.</p>
        </div>

        {/* HOUSE SCENE */}
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
          <h2>
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

        <div className="scroll-indicator [position:absolute] [bottom:16px] [left:50%] [transform:translateX(-50%)] [z-index:20] [opacity:1] [visibility:visible] [display:flex] [flex-direction:column] [align-items:center] [gap:10px] [padding:9px_14px_7px] [border:1px_solid_#e5dacc] [border-radius:16px] [background:#fff9efeb] [box-shadow:0_8px_24px_#8d684514] [font-size:9px] [letter-spacing:2px] [color:#898477] [pointer-events:none]">
          <span>SCROLL TO FOLLOW THE JOURNEY</span>
          <div className="scroll-line [height:30px] [width:1px] [background:var(--orange)] [animation:scrollPulse_1.5s_infinite]" />
        </div>
      </section>

      <div
        className="bottom-parcel-overlay"
        aria-label="Draggable gravity parcel"
        title="Click and drag me, then release to drop with gravity!"
        style={
          gravityBoxPos
            ? {
                right: "auto",
                bottom: "auto",
                left: gravityBoxPos.x,
                top: gravityBoxPos.y,
                pointerEvents: "auto",
                cursor: isGravityDragging ? "grabbing" : "grab",
                touchAction: "none",
              }
            : { pointerEvents: "auto", cursor: "grab", touchAction: "none" }
        }
        onPointerDown={handleGravityBoxDragStart}
        onPointerMove={handleGravityBoxDragMove}
        onPointerUp={handleGravityBoxDragEnd}
        onPointerCancel={handleGravityBoxDragEnd}
      >
        <div className="bottom-parcel" ref={bottomParcelRef}>
          <HeroParcel
            motion="still"
            quarterView
            rotationXDegrees={boxRotations.droppable.x}
            rotationYDegrees={boxRotations.droppable.y}
            rotationZDegrees={boxRotations.droppable.z}
          />
        </div>
        <div className="drop-particles [position:absolute] [left:50%] [bottom:8px] [width:1px] [height:1px]">
          {Array.from({ length: 7 }, (_, index) => (
            <span
              className="drop-particle [position:absolute] [width:9px] [height:3px] [border-radius:999px] [background:#ff914d] [opacity:0] [transform:translate(-50%,_-50%)] [box-shadow:0_0_9px_#ff914d80]"
              key={index}
            />
          ))}
        </div>
      </div>

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
        .nav-links a:hover {
          color: var(--orange);
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
        .float-a:active {
          cursor: grabbing;
        }
        .float-a canvas {
          pointer-events: none;
        }
        .hero-box-canvas-wrapper:active {
          cursor: grabbing;
        }
        .bottom-parcel-overlay {
          position: fixed;
          right: clamp(18px, 7vw, 120px);
          bottom: 18px;
          width: 154px;
          height: 154px;
          pointer-events: auto !important;
          touch-action: none !important;
          z-index: 50;
          overflow: visible;
          cursor: grab;
          user-select: none;
        }
        .bottom-parcel-overlay:active {
          cursor: grabbing;
        }
        .bottom-parcel-overlay canvas {
          pointer-events: none !important;
        }
        .bottom-parcel {
          width: 100%;
          height: 100%;
          transform: translateY(-150px);
          will-change: transform;
          filter: drop-shadow(0 15px 11px #5c351e30);
          pointer-events: none !important;
        }
        .gather-copy,
        .seal-copy,
        .truck-copy,
        .plane-copy,
        .final-copy {
          opacity: 0;
          transform: translateY(50px);
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
        }
        @keyframes scrollPulse {
          0%,
          100% {
            transform: scaleY(0.4);
            transform-origin: top;
          }
          50% {
            transform: scaleY(1);
            transform-origin: top;
          }
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
            margin-left: auto;
            margin-right: 15px;
            padding: 11px 15px;
          }
          .mobile-menu {
            display: block;
            border: none;
            background: transparent;
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
            gap: 22px;
          }
          .nav-links.open {
            display: flex;
          }
          .journey {
            height: calc(100vh - 70px);
            min-height: 650px;
          }
          .scene-copy {
            left: 7%;
            width: 86%;
            top: 29%;
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
            top: 11%;
            left: 3%;
            right: auto;
          }
          .hero-box-container {
            top: 52%;
            right: 5%;
            width: 220px;
            height: 220px;
            min-width: 0;
            min-height: 0;
          }
          .bottom-parcel-overlay {
            right: 14px;
            bottom: 10px;
            width: 116px;
            height: 116px;
          }
          .bottom-parcel {
            transform: translateY(-115px);
          }
          .assembled-parcel {
            left: 50%;
            top: 65%;
            transform: translate(-50%, -50%) scale(0.2);
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
            left: 50%;
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
      {process.env.NODE_ENV === "development" && (
        <details
          style={{
            position: "fixed",
            bottom: 16,
            left: 16,
            width: "min(340px, calc(100vw - 32px))",
            zIndex: 1000,
            color: "#292923",
            fontFamily: "Arial, sans-serif",
          }}
        >
          <summary
            style={{
              width: "fit-content",
              padding: "10px 14px",
              borderRadius: 8,
              background: "#292923",
              color: "white",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            Rotation tuner
          </summary>
          <div
            style={{
              display: "grid",
              gap: 12,
              marginTop: 8,
              padding: 14,
              border: "1px solid #ded6c9",
              borderRadius: 10,
              background: "#fff9ef",
              boxShadow: "0 8px 24px #29292325",
            }}
          >
            <label style={{ display: "grid", gap: 5, fontSize: 12 }}>
              Box
              <select
                value={activeRotationBox}
                onChange={(event) => {
                  const value = event.currentTarget.value;
                  if (value === "floating" || value === "bouncing" || value === "droppable") {
                    setActiveRotationBox(value);
                  }
                }}
                style={{ padding: 7 }}
              >
                <option value="floating">Floating</option>
                <option value="bouncing">Bouncing</option>
                <option value="droppable">Droppable</option>
              </select>
            </label>
            {(["x", "y", "z"] as const).map((axis) => (
              <label
                key={axis}
                htmlFor={`rotation-${activeRotationBox}-${axis}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 72px",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {ROTATION_LABELS[axis]}
                <input
                  id={`rotation-${activeRotationBox}-${axis}`}
                  type="number"
                  min={-180}
                  max={180}
                  step={1}
                  value={boxRotations[activeRotationBox][axis]}
                  onChange={(event) => updateBoxRotation(axis, Number(event.currentTarget.value))}
                  style={{ width: "100%", padding: 5 }}
                />
                <input
                  type="range"
                  min={-180}
                  max={180}
                  step={1}
                  value={boxRotations[activeRotationBox][axis]}
                  aria-label={`${activeRotationBox} ${axis.toUpperCase()} rotation`}
                  onChange={(event) => updateBoxRotation(axis, Number(event.currentTarget.value))}
                  style={{ gridColumn: "1 / -1", width: "100%" }}
                />
              </label>
            ))}
            <code style={{ fontSize: 11 }}>
              {JSON.stringify(boxRotations[activeRotationBox])}
            </code>
            <button
              type="button"
              onClick={() => setBoxRotations(BOX_ROTATIONS)}
              style={{
                justifySelf: "start",
                padding: "6px 9px",
                border: "1px solid #ded6c9",
                borderRadius: 6,
                background: "white",
                cursor: "pointer",
                fontSize: 12,
              }}
            >
              Reset rotations
            </button>
            <small style={{ fontSize: 11 }}>
              Copy the shown values into BOX_ROTATIONS to keep them.
            </small>
          </div>
        </details>
      )}
    </main>
  );
}

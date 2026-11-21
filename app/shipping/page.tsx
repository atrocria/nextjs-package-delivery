"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Bounds } from "@react-three/drei";
import { Suspense } from "react";
import { ParcelScene } from "@/components/HeroParcel";
import { ArrowDown, MapPin, Package, Clock, ChevronRight } from "lucide-react";

// ─── OpenStreetMap pannable tile renderer ─────────────────────────────────────
function PannableMapTiles({
  zoom = 12,
  panOffset,
}: {
  zoom?: number;
  panOffset: { x: number; y: number };
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cacheRef = useRef<Map<string, HTMLImageElement>>(new Map());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const tileSize = 256;
    const width = canvas.width;
    const height = canvas.height;

    const baseLat = 3.139;
    const baseLng = 101.6869;

    const latRad = (baseLat * Math.PI) / 180;
    const n = Math.pow(2, zoom);
    const centerTileX = ((baseLng + 180) / 360) * n;
    const centerTileY = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;

    // Pixel coordinates at center of canvas including pan
    const centerPixelX = centerTileX * tileSize - panOffset.x;
    const centerPixelY = centerTileY * tileSize - panOffset.y;

    const minPixelX = centerPixelX - width / 2;
    const maxPixelX = centerPixelX + width / 2;
    const minPixelY = centerPixelY - height / 2;
    const maxPixelY = centerPixelY + height / 2;

    const minTileX = Math.floor(minPixelX / tileSize);
    const maxTileX = Math.floor(maxPixelX / tileSize);
    const minTileY = Math.floor(minPixelY / tileSize);
    const maxTileY = Math.floor(maxPixelY / tileSize);

    ctx.clearRect(0, 0, width, height);

    for (let tx = minTileX; tx <= maxTileX; tx++) {
      for (let ty = minTileY; ty <= maxTileY; ty++) {
        const destX = tx * tileSize - minPixelX;
        const destY = ty * tileSize - minPixelY;
        const key = `${zoom}_${tx}_${ty}`;

        let img = cacheRef.current.get(key);
        if (!img) {
          img = new Image();
          img.crossOrigin = "anonymous";
          img.src = `https://tile.openstreetmap.org/${zoom}/${tx}/${ty}.png`;
          const currentImg = img;
          currentImg.onload = () => {
            if (canvasRef.current) {
              const currentCtx = canvasRef.current.getContext("2d");
              if (currentCtx) {
                currentCtx.drawImage(currentImg, destX, destY, tileSize, tileSize);
              }
            }
          };
          cacheRef.current.set(key, img);
        }

        if (img.complete && img.naturalWidth !== 0) {
          ctx.drawImage(img, destX, destY, tileSize, tileSize);
        } else {
          ctx.fillStyle = "#e8e0d8";
          ctx.fillRect(destX, destY, tileSize, tileSize);
          ctx.strokeStyle = "#ded5cb";
          ctx.strokeRect(destX, destY, tileSize, tileSize);
        }
      }
    }
  }, [panOffset.x, panOffset.y, zoom]);

  return (
    <canvas
      ref={canvasRef}
      width={1200}
      height={600}
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
}

// ─── 3D Parcel cursor overlay ─────────────────────────────────────────────────
function ParcelCursor({
  x,
  y,
  visible,
  isPanning = false,
}: {
  x: number;
  y: number;
  visible: boolean;
  isPanning?: boolean;
}) {
  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        left: x - 44,
        top: y - 70,
        width: 88,
        height: 88,
        pointerEvents: "none",
        zIndex: 9999,
        filter: "drop-shadow(0 8px 16px rgba(80,40,10,0.35))",
      }}
    >
      <Canvas
        camera={{ position: [3.8, 3.0, 5.4], fov: 34 }}
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: true, premultipliedAlpha: false }}
        onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
        style={{ background: "transparent", width: "100%", height: "100%" }}
      >
        <ParcelScene
          speed={isPanning ? 0 : 0.00012}
          phase={0}
          motion={isPanning ? "still" : "bob"}
          isPanning={isPanning}
        />
      </Canvas>
      {/* Downward arrow below the box - freezes when panning */}
      <div
        style={{
          position: "absolute",
          bottom: -28,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
          animation: isPanning ? "none" : "cursorArrowBounce 0.9s ease-in-out infinite",
        }}
      >
        <ArrowDown size={18} color="#ff914d" strokeWidth={2.5} />
      </div>
    </div>
  );
}

// ─── Interactive map area (Pannable + click to drop pin) ─────────────────────
function DeliveryMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [isCursorInMap, setIsCursorInMap] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [pin, setPin] = useState<{ x: number; y: number; label: string } | null>(null);

  const dragStartRef = useRef<{ clientX: number; clientY: number; startPanX: number; startPanY: number; moved: boolean } | null>(null);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      startPanX: panOffset.x,
      startPanY: panOffset.y,
      moved: false,
    };
    setIsPanning(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {}
  }, [panOffset]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    setCursorPos({ x: e.clientX, y: e.clientY });
    if (!dragStartRef.current) return;

    const deltaX = e.clientX - dragStartRef.current.clientX;
    const deltaY = e.clientY - dragStartRef.current.clientY;

    if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
      dragStartRef.current.moved = true;
    }

    setPanOffset({
      x: dragStartRef.current.startPanX + deltaX,
      y: dragStartRef.current.startPanY + deltaY,
    });
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStartRef.current) return;
    const wasMoved = dragStartRef.current.moved;
    dragStartRef.current = null;
    setIsPanning(false);

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (_) {}

    // If it was a click (not a drag pan), drop a pin
    if (!wasMoved && mapRef.current) {
      const rect = mapRef.current.getBoundingClientRect();
      setPin({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        label: "Drop point",
      });
    }
  }, []);

  return (
    <div
      ref={mapRef}
      style={{
        position: "relative",
        width: "100%",
        height: 480,
        borderRadius: 24,
        overflow: "hidden",
        cursor: isPanning ? "grabbing" : "none",
        background: "#e8e0d8",
        border: "1px solid #e4dfd5",
        boxShadow: "0 4px 24px rgba(80,40,10,0.08)",
        userSelect: "none",
        touchAction: "none",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onMouseEnter={() => setIsCursorInMap(true)}
      onMouseLeave={() => {
        setIsCursorInMap(false);
        setIsPanning(false);
        dragStartRef.current = null;
      }}
    >
      <PannableMapTiles zoom={12} panOffset={panOffset} />

      {/* Map overlay gradient */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to bottom, transparent 70%, rgba(255,249,239,0.5) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Attribution */}
      <div
        style={{
          position: "absolute",
          bottom: 8,
          right: 10,
          fontSize: 10,
          color: "#666",
          background: "rgba(255,255,255,0.75)",
          borderRadius: 4,
          padding: "2px 6px",
          pointerEvents: "none",
        }}
      >
        © OpenStreetMap contributors
      </div>

      {/* Dropped pin */}
      {pin && (
        <div
          style={{
            position: "absolute",
            left: pin.x - 14,
            top: pin.y - 36,
            pointerEvents: "none",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div
            style={{
              background: "#ff914d",
              color: "white",
              borderRadius: 20,
              padding: "4px 10px",
              fontSize: 11,
              fontWeight: 700,
              whiteSpace: "nowrap",
              boxShadow: "0 4px 12px rgba(255,145,77,0.4)",
              fontFamily: "DM Sans, sans-serif",
              marginBottom: 4,
            }}
          >
            📦 {pin.label}
          </div>
          <div style={{ width: 2, height: 10, background: "#ff914d" }} />
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "#ff914d",
              boxShadow: "0 0 0 4px rgba(255,145,77,0.25)",
            }}
          />
        </div>
      )}

      {/* Hint text */}
      {!pin && (
        <div
          style={{
            position: "absolute",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(255,249,239,0.9)",
            border: "1px solid #e4dfd5",
            borderRadius: 20,
            padding: "8px 16px",
            fontSize: 12,
            color: "#77746c",
            fontFamily: "DM Sans, sans-serif",
            fontWeight: 600,
            pointerEvents: "none",
            whiteSpace: "nowrap",
          }}
        >
          Drag to pan the map · Click to drop a delivery point
        </div>
      )}

      <ParcelCursor x={cursorPos.x} y={cursorPos.y} visible={isCursorInMap} isPanning={isPanning} />
    </div>
  );
}

// ─── Delivery estimates ───────────────────────────────────────────────────────
const zones = [
  { area: "Within Klang Valley", time: "1–2 business days", width: "42%", color: "#3b82f6" },
  { area: "West Malaysia", time: "2–4 business days", width: "65%", color: "#10b981" },
  { area: "East Malaysia", time: "4–6 business days", width: "82%", color: "#f59e0b" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DeliveryPage() {
  return (
    <>
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Fredoka:wght@400;500;600;700&display=swap");
        @keyframes cursorArrowBounce {
          0%, 100% { transform: translateX(-50%) translateY(0px); }
          50% { transform: translateX(-50%) translateY(5px); }
        }
        .delivery-page {
          min-height: 100vh;
          background: #f5f0e8;
          font-family: "DM Sans", sans-serif;
          padding: 32px 5%;
        }
        .delivery-header {
          margin-bottom: 32px;
        }
        .delivery-eyebrow {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 2px;
          color: #ff914d;
          margin-bottom: 10px;
          text-transform: uppercase;
        }
        .delivery-title {
          font-family: "Fredoka", sans-serif;
          font-size: clamp(32px, 5vw, 54px);
          font-weight: 600;
          letter-spacing: -2px;
          color: #292923;
          margin: 0 0 10px;
          line-height: 1.1;
        }
        .delivery-title span { color: #ff914d; }
        .delivery-subtitle {
          color: #77746c;
          font-size: 14px;
          margin: 0;
        }
        .delivery-layout {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 24px;
          align-items: start;
        }
        @media (max-width: 900px) {
          .delivery-layout { grid-template-columns: 1fr; }
        }
        .delivery-panel {
          background: white;
          border-radius: 24px;
          padding: 28px;
          border: 1px solid #e4dfd5;
          box-shadow: 0 4px 24px rgba(80,40,10,0.06);
        }
        .panel-title {
          font-family: "Fredoka", sans-serif;
          font-size: 20px;
          font-weight: 600;
          color: #292923;
          margin: 0 0 6px;
        }
        .panel-subtitle {
          font-size: 13px;
          color: #77746c;
          margin: 0 0 20px;
        }
        .zone-row {
          margin-bottom: 20px;
        }
        .zone-row:last-child { margin-bottom: 0; }
        .zone-label-row {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          margin-bottom: 8px;
        }
        .zone-label { font-weight: 600; color: #292923; }
        .zone-time { color: #77746c; }
        .zone-track {
          height: 10px;
          background: #f0ebe3;
          border-radius: 999px;
          overflow: hidden;
        }
        .zone-fill {
          height: 100%;
          border-radius: 999px;
          transition: width 0.6s ease;
        }
        .delivery-steps {
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        .step {
          display: flex;
          gap: 14px;
          position: relative;
          padding-bottom: 20px;
        }
        .step:last-child { padding-bottom: 0; }
        .step-dot-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0;
        }
        .step-dot {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-size: 15px;
        }
        .step-line {
          width: 2px;
          flex: 1;
          background: #e4dfd5;
          margin: 4px 0;
          min-height: 24px;
        }
        .step-content { padding-top: 4px; }
        .step-label {
          font-size: 13px;
          font-weight: 700;
          color: #292923;
          margin-bottom: 2px;
        }
        .step-desc {
          font-size: 12px;
          color: #77746c;
          line-height: 1.5;
        }
        .cta-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 15px 20px;
          border-radius: 50px;
          background: #ff914d;
          color: white;
          font-size: 14px;
          font-weight: 700;
          border: none;
          cursor: pointer;
          margin-top: 20px;
          transition: transform 0.18s, box-shadow 0.18s;
          box-shadow: 0 8px 22px rgba(255,145,77,0.3);
          font-family: "DM Sans", sans-serif;
          text-decoration: none;
        }
        .cta-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 28px rgba(255,145,77,0.38);
        }
      `}</style>

      <div className="delivery-page">
        <div className="delivery-header">
          <p className="delivery-eyebrow">📍 Delivery Map</p>
          <h1 className="delivery-title">
            Drop it <span>anywhere.</span>
          </h1>
          <p className="delivery-subtitle">
            Hover over the map to place your delivery — your parcel will follow.
          </p>
        </div>

        <div className="delivery-layout">
          {/* Main map */}
          <div>
            <DeliveryMap />
          </div>

          {/* Side panel */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Estimates */}
            <div className="delivery-panel">
              <h2 className="panel-title">Delivery estimates</h2>
              <p className="panel-subtitle">Typical times from our Klang Valley hub.</p>
              {zones.map((z) => (
                <div className="zone-row" key={z.area}>
                  <div className="zone-label-row">
                    <span className="zone-label">{z.area}</span>
                    <span className="zone-time">{z.time}</span>
                  </div>
                  <div className="zone-track">
                    <div className="zone-fill" style={{ width: z.width, background: z.color }} />
                  </div>
                </div>
              ))}
            </div>

            {/* How it works */}
            <div className="delivery-panel">
              <h2 className="panel-title">How it works</h2>
              <p className="panel-subtitle">Three easy steps to plop your parcel.</p>

              <div className="delivery-steps">
                {[
                  { icon: "📦", color: "#fff4eb", label: "Package it up", desc: "Wrap and seal your parcel securely." },
                  { icon: "📍", color: "#fff4eb", label: "Pick a drop point", desc: "Click the map to choose your delivery location." },
                  { icon: "🚚", color: "#fff4eb", label: "We handle the rest", desc: "We collect, track and deliver — door to door." },
                ].map((step, i, arr) => (
                  <div className="step" key={step.label}>
                    <div className="step-dot-col">
                      <div className="step-dot" style={{ background: step.color }}>
                        {step.icon}
                      </div>
                      {i < arr.length - 1 && <div className="step-line" />}
                    </div>
                    <div className="step-content">
                      <p className="step-label">{step.label}</p>
                      <p className="step-desc">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <a href="/register" className="cta-button">
                Get started <ChevronRight size={16} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
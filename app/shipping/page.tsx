"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, ChevronDown, MapPin, Minus, Package, Plus } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { hasSupabaseConfig } from "@/utils/supabase/config";

type MapLocation = {
  latitude: number;
  longitude: number;
};

type ShippingDetails = {
  description: string;
  weight: string;
  recipientName: string;
  recipientPhone: string;
  pickupAddress: string;
  deliveryAddress: string;
  deliveryDate: string;
  deliveryTime: string;
  paymentMethod: string;
  mapPins: {
    from: MapLocation | null;
    to: MapLocation | null;
  };
};

type SavedDraft = {
  id: string;
  currentStep: number;
  details: ShippingDetails;
};

const STORAGE_KEY = "plop-shipping-draft";
const steps = ["What & where", "When", "Checks & pay"];
const initialDetails: ShippingDetails = {
  description: "",
  weight: "",
  recipientName: "",
  recipientPhone: "",
  pickupAddress: "",
  deliveryAddress: "",
  deliveryDate: "",
  deliveryTime: "",
  paymentMethod: "card",
  mapPins: { from: null, to: null },
};

function PannableMapTiles({
  panOffset,
  zoom,
}: {
  panOffset: { x: number; y: number };
  zoom: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const mapElement = canvas?.parentElement;
    if (!canvas || !mapElement) return;

    const measureMap = () => {
      const { width, height } = mapElement.getBoundingClientRect();
      setDimensions({
        width: Math.round(width),
        height: Math.round(height),
      });
    };

    const resizeObserver = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setDimensions({
        width: Math.round(width),
        height: Math.round(height),
      });
    });

    measureMap();
    resizeObserver.observe(mapElement);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || dimensions.width === 0 || dimensions.height === 0) return;

    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(dimensions.width * pixelRatio);
    canvas.height = Math.round(dimensions.height * pixelRatio);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const tileSize = 256;
    const baseLat = 3.139;
    const baseLng = 101.6869;
    const latRad = (baseLat * Math.PI) / 180;
    const worldTiles = 2 ** zoom;
    const centerTileX = ((baseLng + 180) / 360) * worldTiles;
    const centerTileY =
      ((1 -
        Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) /
        2) *
      worldTiles;
    const centerPixelX = centerTileX * tileSize - panOffset.x;
    const centerPixelY = centerTileY * tileSize - panOffset.y;
    const minPixelX = centerPixelX - dimensions.width / 2;
    const minPixelY = centerPixelY - dimensions.height / 2;
    const minTileX = Math.floor(minPixelX / tileSize);
    const maxTileX = Math.floor((minPixelX + dimensions.width) / tileSize);
    const minTileY = Math.floor(minPixelY / tileSize);
    const maxTileY = Math.floor((minPixelY + dimensions.height) / tileSize);

    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);

    for (let tileX = minTileX; tileX <= maxTileX; tileX += 1) {
      for (let tileY = minTileY; tileY <= maxTileY; tileY += 1) {
        const x = tileX * tileSize - minPixelX;
        const y = tileY * tileSize - minPixelY;
        const key = `${zoom}_${tileX}_${tileY}`;
        let image = cacheRef.current.get(key);

        if (!image) {
          image = new Image();
          image.crossOrigin = "anonymous";
          image.src = `https://tile.openstreetmap.org/${zoom}/${tileX}/${tileY}.png`;
          image.onload = () => {
            const currentCanvas = canvasRef.current;
            const currentContext = currentCanvas?.getContext("2d");
            if (currentCanvas && currentContext) {
              currentContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
              currentContext.drawImage(image!, x, y, tileSize, tileSize);
            }
          };
          cacheRef.current.set(key, image);
        }

        if (image.complete && image.naturalWidth > 0) {
          ctx.drawImage(image, x, y, tileSize, tileSize);
        } else {
          ctx.fillStyle = "#e8e0d8";
          ctx.fillRect(x, y, tileSize, tileSize);
          ctx.strokeStyle = "#ded5cb";
          ctx.strokeRect(x, y, tileSize, tileSize);
        }
      }
    }
  }, [dimensions, panOffset.x, panOffset.y, zoom]);

  return <canvas ref={canvasRef} className="shipping-map-canvas" aria-hidden="true" />;
}

function ParcelCursor({
  x,
  y,
  visible,
}: {
  x: number;
  y: number;
  visible: boolean;
}) {
  if (!visible) return null;

  return (
    <div className="parcel-cursor" style={{ left: x - 22, top: y - 48 }} aria-hidden="true">
      <span className="parcel-cursor-box">📦</span>
      <span className="parcel-cursor-arrow">˯</span>
    </div>
  );
}

function DeliveryMap({
  mapPins,
  onMapPinChange,
}: {
  mapPins: ShippingDetails["mapPins"];
  onMapPinChange: (
    location: MapLocation,
    focusedAddress: "pickupAddress" | "deliveryAddress" | null,
  ) => void;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{
    clientX: number;
    clientY: number;
    startPanX: number;
    startPanY: number;
    moved: boolean;
    focusedAddress: "pickupAddress" | "deliveryAddress" | null;
  } | null>(null);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [cursorVisible, setCursorVisible] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [mapSize, setMapSize] = useState({ width: 0, height: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [zoom, setZoom] = useState(12);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const observer = new ResizeObserver(([entry]) => {
      setMapSize({
        width: Math.round(entry.contentRect.width),
        height: Math.round(entry.contentRect.height),
      });
    });
    observer.observe(map);
    return () => observer.disconnect();
  }, []);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) return;
      const activeElementId = document.activeElement?.id;
      dragStartRef.current = {
        clientX: event.clientX,
        clientY: event.clientY,
        startPanX: panOffset.x,
        startPanY: panOffset.y,
        moved: false,
        focusedAddress:
          activeElementId === "from-address"
            ? "pickupAddress"
            : activeElementId === "to-address"
              ? "deliveryAddress"
              : null,
      };
      setIsPanning(true);
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [panOffset],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      setCursorPos({ x: event.clientX, y: event.clientY });
      if (!dragStartRef.current) return;

      const deltaX = event.clientX - dragStartRef.current.clientX;
      const deltaY = event.clientY - dragStartRef.current.clientY;
      if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
        dragStartRef.current.moved = true;
      }
      setPanOffset({
        x: dragStartRef.current.startPanX + deltaX,
        y: dragStartRef.current.startPanY + deltaY,
      });
    },
    [],
  );

  const handlePointerUp = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStartRef.current) return;
    const { moved, focusedAddress } = dragStartRef.current;
    dragStartRef.current = null;
    setIsPanning(false);
    event.currentTarget.releasePointerCapture(event.pointerId);

    const map = mapRef.current;
    if (!moved && map) {
      const rect = map.getBoundingClientRect();
      const worldSize = 256 * 2 ** zoom;
      const baseLatitudeRadians = (3.139 * Math.PI) / 180;
      const centerWorldX = ((101.6869 + 180) / 360) * worldSize - panOffset.x;
      const centerWorldY =
        ((1 -
          Math.log(
            Math.tan(baseLatitudeRadians) + 1 / Math.cos(baseLatitudeRadians),
          ) /
            Math.PI) /
          2) *
          worldSize -
        panOffset.y;
      const worldX =
        centerWorldX + event.clientX - rect.left - rect.width / 2;
      const worldY =
        centerWorldY + event.clientY - rect.top - rect.height / 2;
      const boundedWorldY = Math.max(0, Math.min(worldSize, worldY));
      const rawLongitude = (worldX / worldSize) * 360 - 180;
      const longitude = (((rawLongitude + 180) % 360) + 360) % 360 - 180;
      const latitude =
        (Math.atan(
          Math.sinh(Math.PI * (1 - (2 * boundedWorldY) / worldSize)),
        ) *
          180) /
        Math.PI;

      onMapPinChange({ latitude, longitude }, focusedAddress);
    }
  }, [onMapPinChange, panOffset, zoom]);

  const projectLocation = (location: MapLocation) => {
    const worldSize = 256 * 2 ** zoom;
    const baseLatitudeRadians = (3.139 * Math.PI) / 180;
    const centerWorldX = ((101.6869 + 180) / 360) * worldSize - panOffset.x;
    const centerWorldY =
      ((1 -
        Math.log(
          Math.tan(baseLatitudeRadians) + 1 / Math.cos(baseLatitudeRadians),
        ) /
          Math.PI) /
        2) *
        worldSize -
      panOffset.y;
    const locationLatitudeRadians = (location.latitude * Math.PI) / 180;
    const locationWorldX = ((location.longitude + 180) / 360) * worldSize;
    const locationWorldY =
      ((1 -
        Math.log(
          Math.tan(locationLatitudeRadians) + 1 / Math.cos(locationLatitudeRadians),
        ) /
          Math.PI) /
        2) *
      worldSize;

    return {
      left: `${((locationWorldX - centerWorldX + mapSize.width / 2) / mapSize.width) * 100}%`,
      top: `${((locationWorldY - centerWorldY + mapSize.height / 2) / mapSize.height) * 100}%`,
    };
  };

  return (
    <div
      ref={mapRef}
      className={`shipping-map${isPanning ? " is-panning" : ""}`}
      data-zoom={zoom}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onWheel={(event) => {
        setZoom((currentZoom) =>
          Math.max(10, Math.min(18, currentZoom + (event.deltaY < 0 ? 1 : -1))),
        );
      }}
      onPointerEnter={(event) => {
        setCursorPos({ x: event.clientX, y: event.clientY });
        setCursorVisible(true);
      }}
      onPointerLeave={() => {
        setCursorVisible(false);
        setIsPanning(false);
        dragStartRef.current = null;
      }}
      aria-label="Interactive map; drag to pan and click to mark a location"
    >
      <PannableMapTiles panOffset={panOffset} zoom={zoom} />
      <div className="map-gradient" />
      {(["from", "to"] as const).map((label) => {
        const location = mapPins[label];
        if (!location || mapSize.width === 0 || mapSize.height === 0) return null;
        return (
          <div
            key={label}
            className="map-pin"
            style={projectLocation(location)}
            aria-label={`${label === "from" ? "From" : "To"} point on map`}
          >
            <span><MapPin size={17} /> {label === "from" ? "From" : "To"}</span>
            <i />
          </div>
        );
      })}
      <div className="map-hint">
        <span>Drag to pan · Click to set From and To</span>
        <small>Map marks are coordinates; add street details in each field.</small>
      </div>
      <div className="map-attribution">
        <a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noreferrer"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
        >
          © OpenStreetMap contributors
        </a>
      </div>
      <div
        className="map-zoom-controls"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Zoom in"
          disabled={zoom >= 18}
          onClick={() => setZoom((currentZoom) => Math.min(18, currentZoom + 1))}
        >
          <Plus size={17} />
        </button>
        <button
          type="button"
          aria-label="Zoom out"
          disabled={zoom <= 10}
          onClick={() => setZoom((currentZoom) => Math.max(10, currentZoom - 1))}
        >
          <Minus size={17} />
        </button>
      </div>
      <ParcelCursor
        x={cursorPos.x}
        y={cursorPos.y}
        visible={cursorVisible}
      />
    </div>
  );
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = true,
  min,
  inputId,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  min?: string;
  inputId?: string;
}) {
  const id = inputId ?? label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return (
    <label className="shipping-field" htmlFor={id}>
      <span>{label}</span>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        min={min}
      />
    </label>
  );
}

export default function DeliveryPage() {
  const router = useRouter();
  const [details, setDetails] = useState(initialDetails);
  const [draftId, setDraftId] = useState("");
  const [currentStep, setCurrentStep] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isBrandMenuOpen, setIsBrandMenuOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const updateDetail = useCallback(
    <K extends keyof ShippingDetails>(field: K, value: ShippingDetails[K]) => {
      setDetails((current) => ({ ...current, [field]: value }));
    },
    [],
  );

  const handleMapSelection = useCallback(
    (
      location: MapLocation,
      focusedAddress: "pickupAddress" | "deliveryAddress" | null,
    ) => {
      setDetails((current) => {
        const selectedPoint =
          focusedAddress === "pickupAddress"
            ? "from"
            : focusedAddress === "deliveryAddress"
              ? "to"
              : current.mapPins.from || current.mapPins.to
                ? "to"
                : "from";
        const addressField =
          selectedPoint === "from" ? "pickupAddress" : "deliveryAddress";

        return {
          ...current,
          [addressField]: `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`,
          mapPins: { ...current.mapPins, [selectedPoint]: location },
        };
      });
    },
    [],
  );

  useEffect(() => {
    let active = true;

    async function restoreDraft() {
      try {
        const storedDraft = sessionStorage.getItem(STORAGE_KEY);
        if (storedDraft) {
          const parsed = JSON.parse(storedDraft) as SavedDraft;
          if (parsed.details && typeof parsed.currentStep === "number") {
            if (active) {
              setDetails({ ...initialDetails, ...parsed.details });
              setDraftId(parsed.id || "");
              setCurrentStep(Math.min(Math.max(parsed.currentStep, 0), 2));
            }
          }
        } else if (hasSupabaseConfig()) {
          const supabase = createClient();
          const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
          if (sessionError) throw sessionError;

          if (sessionData.session) {
            const { data: userData, error: userError } = await supabase.auth.getUser();
            if (userError) throw userError;
            if (!userData.user) {
              if (active) setIsReady(true);
              return;
            }
            const { data, error } = await supabase
              .from("shipping_drafts")
              .select("id, draft_data, current_step")
              .eq("user_id", userData.user.id)
              .lt("current_step", 3)
              .order("updated_at", { ascending: false })
              .limit(1)
              .maybeSingle();

            if (error) throw error;
            if (data && active) {
              setDetails({ ...initialDetails, ...(data.draft_data as ShippingDetails) });
              setDraftId(data.id);
              setCurrentStep(Math.min(Math.max(data.current_step, 0), 2));
            }
          }
        }
      } catch (error) {
        if (active) {
          setErrorMessage(
            error instanceof Error ? error.message : "Unable to restore your saved shipment.",
          );
        }
      } finally {
        if (active) setIsReady(true);
      }
    }

    void restoreDraft();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isReady) return;
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ id: draftId, currentStep, details } satisfies SavedDraft),
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to keep this shipment in the current session.",
      );
    }
  }, [currentStep, details, draftId, isReady]);

  async function saveAndContinue() {
    setErrorMessage("");
    if (
      currentStep === 0 &&
      [
        details.description,
        details.weight,
        details.recipientName,
        details.recipientPhone,
        details.pickupAddress,
        details.deliveryAddress,
      ].some((value) => !value.trim())
    ) {
      setErrorMessage("Complete the parcel, recipient, pickup, and delivery details to continue.");
      return;
    }

    if (currentStep === 0 && Number(details.weight) <= 0) {
      setErrorMessage("Enter a parcel weight greater than zero.");
      return;
    }

    if (currentStep === 1 && (!details.deliveryDate || !details.deliveryTime)) {
      setErrorMessage("Choose a preferred delivery date and time window to continue.");
      return;
    }
    if (currentStep === 1 && details.deliveryDate < minimumDate) {
      setErrorMessage("Choose today or a future date.");
      return;
    }

    setIsSaving(true);

    try {
      const supabase = createClient();
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      if (!sessionData.session) {
        sessionStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ id: draftId, currentStep, details } satisfies SavedDraft),
        );
        router.push("/login?next=%2Fshipping");
        return;
      }

      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!authData.user) {
        router.push("/login?next=%2Fshipping");
        return;
      }

      const id = draftId || crypto.randomUUID();
      const nextStep = currentStep + 1;
      const { error } = await supabase.from("shipping_drafts").upsert(
        {
          id,
          user_id: authData.user.id,
          current_step: nextStep,
          draft_data: details,
        },
        { onConflict: "id" },
      );

      if (error) throw error;
      setDraftId(id);
      setCurrentStep(nextStep);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to save your shipment. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function saveDraft() {
    setErrorMessage("");
    setIsSaving(true);
    try {
      const supabase = createClient();
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!sessionData.session) {
        sessionStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ id: draftId, currentStep, details } satisfies SavedDraft),
        );
        router.push("/login?next=%2Fshipping");
        return;
      }

      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!authData.user) {
        router.push("/login?next=%2Fshipping");
        return;
      }

      const { error } = await supabase.from("shipping_drafts").upsert(
        {
          id: draftId || crypto.randomUUID(),
          user_id: authData.user.id,
          current_step: 3,
          draft_data: details,
        },
        { onConflict: "id" },
      );
      if (error) throw error;
      sessionStorage.removeItem(STORAGE_KEY);
      router.push("/dashboard");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to save your shipment draft.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function goBack() {
    setErrorMessage("");
    if (currentStep === 0) return;
    setIsSaving(true);

    try {
      const supabase = createClient();
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      const previousStep = currentStep - 1;

      if (sessionData.session && draftId) {
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        if (!authData.user) throw new Error("Please sign in again to update your saved shipment.");
        const { error } = await supabase
          .from("shipping_drafts")
          .update({ current_step: previousStep, draft_data: details })
          .eq("id", draftId);
        if (error) throw error;
      }
      setCurrentStep(previousStep);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to update your saved shipment.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  const minimumDate = new Date(Date.now() - new Date().getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 10);

  return (
    <>
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Fredoka:wght@400;500;600;700&display=swap");
        .shipping-page {
          --ship-orange: #ff914d;
          --ship-dark: #292923;
          --ship-muted: #77746c;
          box-sizing: border-box;
          width: 100%;
          height: 100dvh;
          overflow: hidden;
          padding: 14px clamp(14px, 3vw, 44px);
          background:
            radial-gradient(ellipse at 50% 0%, rgba(255,145,77,.08), transparent 46%),
            #f5f0e8;
          color: var(--ship-dark);
          font-family: "DM Sans", sans-serif;
        }
        .shipping-wrap {
          width: min(1440px, 100%);
          height: 100%;
          min-height: 0;
          margin: 0 auto;
          display: grid;
          grid-template-rows: 60px minmax(0, 1fr);
          gap: 12px;
        }
        .shipping-topbar {
          display: grid; grid-template-columns: minmax(0, 1fr) minmax(360px, 650px) minmax(0, 1fr);
          align-items: center; gap: 18px;
        }
        .shipping-glass-pill {
          display: inline-flex; align-items: center; justify-content: center;
          height: 42px; box-sizing: border-box; border: 0;
          border-radius: 13px; padding: 0 14px;
          background: linear-gradient(145deg, rgba(224,225,225,.72), rgba(190,193,194,.38));
          box-shadow: 0 3px 12px rgba(74,54,34,.045), inset 0 1px 0 rgba(255,255,255,.72);
          backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
          text-decoration: none;
        }
        .shipping-brand-menu { position: relative; z-index: 20; justify-self: start; }
        .shipping-brand-pill {
          display: flex; align-items: center; justify-content: center; gap: 7px;
          width: 168px; height: 46px; box-sizing: border-box;
          padding: 0 10px; border: 0; border-radius: 14px;
          background: linear-gradient(145deg, rgba(224,225,225,.72), rgba(190,193,194,.38));
          box-shadow: 0 3px 12px rgba(74,54,34,.045), inset 0 1px 0 rgba(255,255,255,.72);
          backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
        }
        .shipping-brand {
          display: flex; flex: 0 0 auto; align-items: center; gap: 6px; height: 100%;
          color: var(--ship-dark); font: 700 25px/1 "Fredoka", sans-serif;
          letter-spacing: -1.3px;
          text-decoration: none;
        }
        .shipping-brand span { color: var(--ship-orange); }
        .shipping-brand-mark { flex: 0 0 auto; color: #665f56; }
        .shipping-brand-toggle {
          display: grid; place-items: center; width: 28px; height: 28px; padding: 0;
          border: 0; border-radius: 8px; background: transparent; color: #706b62; cursor: pointer;
        }
        .shipping-brand-toggle:hover { color: #3e3a34; }
        .shipping-brand-menu-panel {
          position: absolute; top: calc(100% + 8px); left: 0; display: grid; gap: 3px;
          width: 174px; padding: 7px; border: 1px solid rgba(255,255,255,.72); border-radius: 14px;
          background: linear-gradient(145deg, rgba(232,233,233,.94), rgba(206,208,208,.88));
          box-shadow: 0 12px 26px rgba(47,45,40,.12), inset 0 1px 0 rgba(255,255,255,.8);
          backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
        }
        .shipping-brand-menu-panel a {
          padding: 10px 11px; border-radius: 9px; color: #514e48; font-size: 12px;
          font-weight: 650; text-decoration: none;
        }
        .shipping-brand-menu-panel a:hover { background: rgba(255,255,255,.55); }
        .shipping-signin {
          justify-self: end; color: #71695e; font-size: 12px; font-weight: 700;
          transition: background .18s, color .18s, box-shadow .18s;
        }
        .shipping-signin:hover {
          background: rgba(218,244,227,.84); color: #47735a;
          box-shadow: 0 4px 14px rgba(131,190,149,.14), inset 0 1px 0 rgba(255,255,255,.8);
        }
        .shipping-progress {
          position: relative; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr));
          align-items: start; width: 100%; height: 60px; isolation: isolate;
        }
        .shipping-progress-track {
          position: absolute; z-index: -1; left: 16.666%; right: 16.666%; top: 17px;
          height: 2px; background: #ded8ce;
        }
        .shipping-progress-fill { height: 100%; background: var(--ship-orange); transition: width .35s ease; }
        .shipping-step {
          display: flex; min-width: 0; align-items: center; flex-direction: column; gap: 4px;
          color: #999287; font-size: 10px; font-weight: 600; text-align: center;
          transition: color .2s;
        }
        .shipping-step.active, .shipping-step.complete { color: var(--ship-dark); }
        .shipping-step-number {
          display: grid; place-items: center; width: 36px; height: 36px; box-sizing: border-box;
          border: 2px solid #ded8ce; border-radius: 50%; background: #f5f0e8;
          color: #918a7f; font-size: 12px; font-weight: 700;
          transition: background .25s, border-color .25s, color .25s, transform .25s;
        }
        .shipping-step.active .shipping-step-number,
        .shipping-step.complete .shipping-step-number {
          border-color: var(--ship-orange); background: var(--ship-orange); color: white;
        }
        .shipping-step.active .shipping-step-number { box-shadow: 0 0 0 4px rgba(255,145,77,.14); transform: scale(1.03); }
        .shipping-card {
          display: flex; flex-direction: column; min-height: 0; overflow: hidden;
          padding: clamp(28px, 3.5vh, 38px) clamp(16px, 2vw, 28px); border: 1px solid rgba(228,223,213,.92);
          border-radius: 24px; background: rgba(239,238,235,.96);
          box-shadow: 0 12px 38px rgba(80,40,10,.07), inset 0 1px 0 rgba(255,255,255,.72);
        }
        .shipping-what-where {
          display: grid; grid-template-columns: minmax(0, 1.08fr) minmax(390px, .92fr);
          gap: clamp(18px, 2.4vw, 34px); flex: 1; min-height: 0;
        }
        .shipping-map-panel, .shipping-input-panel { display: flex; flex-direction: column; min-height: 0; padding-block: 4px; }
        .shipping-map {
          position: relative; flex: 1; min-height: 0; width: 100%;
          border: 1px solid #e4dfd5; border-radius: 18px; overflow: hidden;
          background: #e8e0d8; cursor: none; touch-action: none; user-select: none;
        }
        .shipping-map.is-panning { cursor: grabbing; }
        .shipping-map-canvas { display: block; width: 100%; height: 100%; }
        .map-gradient { position: absolute; inset: 0; pointer-events: none; background: linear-gradient(transparent 65%, rgba(255,249,239,.5)); }
        .map-attribution { position: absolute; right: 9px; bottom: 8px; padding: 3px 6px; border-radius: 4px; background: rgba(232,232,229,.9); color: #666; font-size: 10px; }
        .map-attribution a { color: inherit; text-decoration: none; }
        .map-attribution a:hover { text-decoration: underline; }
        .map-hint { position: absolute; left: 50%; bottom: 32px; transform: translateX(-50%); display: grid; gap: 2px; max-width: calc(100% - 84px); background: rgba(236,235,231,.94); border: 1px solid #d9d7d1; border-radius: 12px; padding: 7px 11px; color: #77746c; font-size: 11px; line-height: 1.3; font-weight: 600; text-align: center; pointer-events: none; }
        .map-hint small { font-size: 9px; font-weight: 500; }
        .map-pin { position: absolute; transform: translate(-50%, -100%); color: #ff914d; display: flex; flex-direction: column; align-items: center; pointer-events: none; }
        .map-pin span { display: flex; align-items: center; gap: 4px; background: #ff914d; border-radius: 18px; padding: 6px 10px; color: white; font-size: 11px; font-weight: 700; white-space: nowrap; box-shadow: 0 4px 12px #ff914d55; }
        .map-pin i { width: 2px; height: 12px; background: #ff914d; }
        .parcel-cursor { position: fixed; width: 44px; height: 48px; pointer-events: none; z-index: 9999; filter: drop-shadow(0 3px 4px rgba(80,40,10,.24)); }
        .parcel-cursor-box { position: absolute; top: 0; left: 50%; transform: translateX(-50%); font-size: 32px; line-height: 34px; }
        .parcel-cursor-arrow { position: absolute; left: 50%; bottom: 0; color: #ff914d; transform: translateX(-50%); font: 700 30px/24px "DM Sans", sans-serif; }
        .map-zoom-controls { position: absolute; z-index: 5; top: 12px; right: 12px; display: grid; gap: 6px; }
        .map-zoom-controls button {
          display: grid; place-items: center; width: 34px; height: 34px; padding: 0;
          border: 0; border-radius: 10px; background: rgba(225,226,224,.9); color: #55524b;
          box-shadow: 0 2px 8px rgba(50,45,38,.12); cursor: pointer;
        }
        .map-zoom-controls button:hover:not(:disabled) { background: rgba(242,243,240,.98); }
        .map-zoom-controls button:disabled { opacity: .48; cursor: not-allowed; }
        .shipping-card-heading { margin: 0 0 16px; }
        .shipping-card-heading h2 { font: 600 clamp(21px, 2vw, 26px)/1.15 "Fredoka", sans-serif; margin: 0 0 5px; }
        .shipping-card-heading p { color: var(--ship-muted); font-size: 12px; margin: 0; }
        .shipping-route-fields { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-bottom: 18px; }
        .shipping-route-fields .shipping-field { gap: 6px; font: 600 19px/1.1 "Fredoka", sans-serif; color: #292923; }
        .shipping-route-fields .shipping-field input { height: 48px; border-radius: 13px; padding: 11px 12px; font: 500 13px "DM Sans", sans-serif; }
        .shipping-fields { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px 14px; }
        .shipping-field { display: flex; min-width: 0; flex-direction: column; gap: 5px; color: #655f55; font-size: 11px; font-weight: 700; }
        .shipping-field input, .shipping-field textarea, .shipping-field select {
          width: 100%; height: 42px; box-sizing: border-box; border: 1px solid #e8e2d9;
          border-radius: 11px; padding: 9px 11px; color: #292923; background: #f7f6f3;
          font: 500 13px "DM Sans", sans-serif; outline: none;
          transition: border-color .2s, box-shadow .2s;
        }
        .shipping-field input:focus, .shipping-field textarea:focus, .shipping-field select:focus {
          border-color: #ff914d; box-shadow: 0 0 0 3px rgba(255,145,77,.12);
        }
        .shipping-field input::placeholder { color: #aaa59b; }
        .shipping-note { color: var(--ship-muted); font-size: 11px; line-height: 1.5; margin: auto 0 0; padding-top: 16px; }
        .shipping-payment-label { margin: 12px 0 0; color: #716b61; font-size: 11px; font-weight: 700; }
        .shipping-stage-content { flex: 1; min-height: 0; }
        .shipping-actions { display: flex; flex: 0 0 auto; justify-content: space-between; gap: 12px; margin-top: 14px; }
        .shipping-button {
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          min-height: 42px; border: 0; border-radius: 999px; padding: 0 19px;
          background: #ff914d; color: #fff; font: 700 13px "DM Sans", sans-serif;
          cursor: pointer; box-shadow: 0 6px 18px rgba(255,145,77,.22);
        }
        .shipping-button.secondary { color: #55524b; background: #f4f0e9; box-shadow: none; }
        .shipping-button:disabled { opacity: .6; cursor: wait; }
        .shipping-button-square { width: 100%; min-height: 46px; border-radius: 12px; }
        .shipping-input-actions { display: flex; flex: 0 0 auto; flex-direction: column; gap: 8px; margin-top: auto; padding-top: 14px; }
        .shipping-error-slot { display: flex; flex: 0 0 48px; align-items: center; }
        .shipping-error { width: 100%; flex: 0 0 auto; border: 1px solid #f3c8c0; border-radius: 12px; background: #fff0ee; padding: 8px 11px; color: #a93226; font-size: 12px; line-height: 1.25; margin: 0; }
        .shipping-payment-options { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin: 12px 0 16px; }
        .shipping-payment-option { display: flex; align-items: center; gap: 10px; padding: 12px; border: 1px solid #dbd9d3; border-radius: 13px; background: #f7f6f3; cursor: pointer; font-size: 12px; font-weight: 700; }
        .shipping-payment-option.selected { border-color: #ff914d; background: #f3eee8; }
        .shipping-review { display: grid; gap: 8px; margin: 14px 0; }
        .shipping-review-row { display: flex; justify-content: space-between; gap: 20px; border-bottom: 1px solid #f0ebe3; padding-bottom: 8px; font-size: 12px; }
        .shipping-review-row span:first-child { color: #77746c; }
        .shipping-review-row span:last-child { text-align: right; font-weight: 700; overflow-wrap: anywhere; }
        .shipping-estimate { display: flex; align-items: center; justify-content: space-between; border-radius: 14px; background: #fff4eb; padding: 12px 14px; font-size: 12px; }
        .shipping-estimate strong { color: #b75b21; font-size: 18px; }
        .shipping-estimate small { color: #8d7d6e; font-size: 10px; }
        @keyframes cursorArrowBounce { 0%,100% { transform: translate(-50%, 0); } 50% { transform: translate(-50%, 5px); } }
        @media (max-width: 820px) {
          .shipping-topbar { grid-template-columns: minmax(0, 1fr) minmax(320px, 520px) minmax(0, 1fr); gap: 10px; }
          .shipping-what-where { grid-template-columns: minmax(0, .9fr) minmax(0, 1.1fr); gap: 14px; }
          .shipping-route-fields { gap: 9px; margin-bottom: 14px; }
          .shipping-route-fields .shipping-field input { height: 44px; }
          .shipping-card { padding: 14px; }
          .shipping-fields { gap: 14px 9px; }
          .shipping-field input, .shipping-field select { height: 39px; padding: 8px; font-size: 12px; }
        }
        @media (max-width: 640px) {
          .shipping-page { padding: 9px 10px; }
          .shipping-wrap { grid-template-rows: 56px minmax(0, 1fr); gap: 7px; }
          .shipping-topbar { grid-template-columns: auto minmax(0, 1fr) auto; gap: 6px; }
          .shipping-brand-pill { width: 136px; height: 40px; border-radius: 12px; padding: 0 7px 0 11px; }
          .shipping-brand-toggle { width: 25px; height: 25px; }
          .shipping-glass-pill { height: 38px; border-radius: 11px; padding: 0 11px; }
          .shipping-brand { font-size: 22px; }
          .shipping-progress { height: 54px; }
          .shipping-progress-track { top: 14px; }
          .shipping-step { gap: 3px; font-size: 9px; line-height: 1.05; }
          .shipping-step-number { width: 30px; height: 30px; }
          .shipping-card { padding: 11px; border-radius: 18px; }
          .shipping-what-where { grid-template-columns: minmax(0, 1fr); grid-template-rows: minmax(130px, .72fr) minmax(0, 1.28fr); gap: 10px; }
          .shipping-map { border-radius: 13px; }
          .map-hint { bottom: 30px; max-width: calc(100% - 76px); padding: 5px 7px; font-size: 9px; }
          .map-hint small { font-size: 8px; }
          .shipping-route-fields { gap: 8px; margin-bottom: 10px; }
          .shipping-route-fields .shipping-field { gap: 4px; font-size: 16px; }
          .shipping-route-fields .shipping-field input { height: 39px; padding: 7px; font-size: 11px; }
          .shipping-card-heading { margin-bottom: 9px; }
          .shipping-card-heading h2 { font-size: 20px; }
          .shipping-card-heading p { font-size: 11px; }
          .shipping-fields { gap: 10px 9px; }
          .shipping-field { gap: 3px; font-size: 10px; }
          .shipping-field input, .shipping-field select { height: 35px; border-radius: 9px; padding: 6px 8px; font-size: 11px; }
          .shipping-note { margin-top: 0; padding-top: 7px; font-size: 10px; }
          .shipping-actions { margin-top: 8px; }
          .shipping-button { min-height: 37px; padding: 0 13px; font-size: 12px; }
          .shipping-input-actions { padding-top: 9px; }
          .shipping-error-slot { flex-basis: 52px; }
          .shipping-error { padding: 6px 8px; font-size: 10px; }
          .shipping-button-square { min-height: 38px; }
          .shipping-payment-options { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 7px; margin: 8px 0; }
          .shipping-payment-option { gap: 6px; padding: 9px; font-size: 10px; }
          .shipping-review { gap: 6px; margin: 8px 0; }
          .shipping-review-row { gap: 8px; padding-bottom: 5px; font-size: 10px; }
          .shipping-estimate { padding: 9px 11px; font-size: 10px; }
          .shipping-estimate strong { font-size: 16px; }
          .parcel-cursor { display: none; }
        }
        @media (max-height: 700px) {
          .shipping-page { padding-top: 7px; padding-bottom: 7px; }
          .shipping-wrap { grid-template-rows: 52px minmax(0, 1fr); gap: 6px; }
          .shipping-progress { height: 50px; }
          .shipping-progress-track { top: 13px; }
          .shipping-step-number { width: 30px; height: 30px; }
          .shipping-step { gap: 3px; font-size: 9px; }
          .shipping-card { padding: 12px 16px; }
          .shipping-what-where { gap: 14px; }
          .shipping-card-heading { margin-bottom: 9px; }
          .shipping-fields { gap: 9px 10px; }
          .shipping-field input, .shipping-field select { height: 36px; }
          .shipping-note { padding-top: 6px; }
          .shipping-actions { margin-top: 8px; }
        }
        @media (max-width: 640px) and (max-height: 740px) {
          .shipping-wrap { grid-template-rows: 56px minmax(0, 1fr); gap: 4px; }
          .shipping-progress { height: 54px; }
          .shipping-card { padding: 8px; }
          .shipping-what-where { grid-template-rows: minmax(105px, .65fr) minmax(0, 1.35fr); gap: 7px; }
          .shipping-card-heading { margin-bottom: 6px; }
          .shipping-card-heading h2 { font-size: 18px; }
          .shipping-fields { gap: 7px 7px; }
          .shipping-field input, .shipping-field select { height: 31px; }
          .shipping-note { padding-top: 4px; }
          .shipping-actions { margin-top: 5px; }
          .shipping-input-actions { padding-top: 6px; }
          .shipping-route-fields .shipping-field input { height: 36px; }
          .shipping-button { min-height: 33px; }
          .shipping-button-square { min-height: 36px; }
        }
      `}</style>

      <div className="shipping-page">
        <div className="shipping-wrap">
          <header className="shipping-topbar">
            <div className="shipping-brand-menu">
              <div className="shipping-brand-pill">
                <Link href="/" className="shipping-brand" aria-label="Plop home">
                  <Package className="shipping-brand-mark" size={17} aria-hidden="true" />
                  plop<span>.</span>
                </Link>
                <button
                  type="button"
                  className="shipping-brand-toggle"
                  aria-label="Open dashboard and services menu"
                  aria-expanded={isBrandMenuOpen}
                  onClick={() => setIsBrandMenuOpen((isOpen) => !isOpen)}
                >
                  <ChevronDown size={17} />
                </button>
              </div>
              {isBrandMenuOpen && (
                <div className="shipping-brand-menu-panel">
                  <Link href="/dashboard" onClick={() => setIsBrandMenuOpen(false)}>Dashboard</Link>
                  <Link href="/#services" onClick={() => setIsBrandMenuOpen(false)}>Services</Link>
                </div>
              )}
            </div>

            <nav className="shipping-progress" aria-label="Shipping steps">
              <div className="shipping-progress-track">
                <div className="shipping-progress-fill" style={{ width: `${currentStep * 50}%` }} />
              </div>
              {steps.map((step, index) => (
                <div
                  key={step}
                  className={`shipping-step${index === currentStep ? " active" : ""}${index < currentStep ? " complete" : ""}`}
                  aria-current={index === currentStep ? "step" : undefined}
                >
                  <span className="shipping-step-number">
                    {index < currentStep ? <Check size={14} /> : index + 1}
                  </span>
                  <span>{step}</span>
                </div>
              ))}
            </nav>

            <Link href="/login?next=%2Fshipping" className="shipping-glass-pill shipping-signin">
              Sign in
            </Link>
          </header>

          <section className="shipping-card">
            {currentStep === 0 && (
              <div className="shipping-what-where">
                <div className="shipping-map-panel">
                  <DeliveryMap
                    mapPins={details.mapPins}
                    onMapPinChange={handleMapSelection}
                  />
                </div>
                <div className="shipping-input-panel">
                  <div className="shipping-route-fields">
                    <FormField
                      label="From"
                      inputId="from-address"
                      value={details.pickupAddress}
                      onChange={(value) => updateDetail("pickupAddress", value)}
                      placeholder="Pickup address"
                    />
                    <FormField
                      label="To"
                      inputId="to-address"
                      value={details.deliveryAddress}
                      onChange={(value) => updateDetail("deliveryAddress", value)}
                      placeholder="Delivery address"
                    />
                  </div>
                  <div className="shipping-fields">
                    <FormField
                      label="Parcel contents"
                      value={details.description}
                      onChange={(value) => updateDetail("description", value)}
                      placeholder="e.g. Books, clothes"
                    />
                    <FormField
                      label="Weight (kg)"
                      type="number"
                      min="0.1"
                      value={details.weight}
                      onChange={(value) => updateDetail("weight", value)}
                      placeholder="e.g. 2"
                    />
                    <FormField
                      label="Recipient name"
                      value={details.recipientName}
                      onChange={(value) => updateDetail("recipientName", value)}
                      placeholder="Full name"
                    />
                    <FormField
                      label="Recipient phone"
                      type="tel"
                      value={details.recipientPhone}
                      onChange={(value) => updateDetail("recipientPhone", value)}
                      placeholder="+60"
                    />
                  </div>
                  <div className="shipping-input-actions">
                    <div className="shipping-error-slot">
                      {errorMessage && <p className="shipping-error" role="alert">{errorMessage}</p>}
                    </div>
                    <button
                      className="shipping-button shipping-button-square"
                      type="button"
                      onClick={saveAndContinue}
                      disabled={!isReady || isSaving}
                    >
                      {isSaving ? "Saving…" : "Save & continue"}
                      <ArrowRight size={17} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="shipping-stage-content">
                <div className="shipping-card-heading">
                  <h2>When should we deliver?</h2>
                  <p>Choose a preferred delivery date and time window.</p>
                </div>
                <div className="shipping-fields">
                  <FormField
                    label="Preferred date"
                    type="date"
                    min={minimumDate}
                    value={details.deliveryDate}
                    onChange={(value) => updateDetail("deliveryDate", value)}
                  />
                  <label className="shipping-field" htmlFor="delivery-time">
                    <span>Preferred time</span>
                    <select
                      id="delivery-time"
                      required
                      value={details.deliveryTime}
                      onChange={(event) => updateDetail("deliveryTime", event.target.value)}
                    >
                      <option value="" disabled>Select a time window</option>
                      <option value="9am-12pm">9:00 AM – 12:00 PM</option>
                      <option value="12pm-3pm">12:00 PM – 3:00 PM</option>
                      <option value="3pm-6pm">3:00 PM – 6:00 PM</option>
                    </select>
                  </label>
                </div>
                <p className="shipping-note">Your preference will be confirmed when the parcel is booked.</p>
              </div>
            )}

            {currentStep === 2 && (
              <div className="shipping-stage-content">
                <div className="shipping-card-heading">
                  <h2>Check &amp; pay</h2>
                  <p>Review your shipment details before continuing.</p>
                </div>
                <div className="shipping-review">
                  {[
                    ["Parcel", `${details.description} · ${details.weight} kg`],
                    ["Recipient", `${details.recipientName} · ${details.recipientPhone}`],
                    ["Pickup", details.pickupAddress],
                    ["Delivery", details.deliveryAddress],
                    ["Preferred time", `${details.deliveryDate} · ${details.deliveryTime}`],
                  ].map(([label, value]) => (
                    <div className="shipping-review-row" key={label}>
                      <span>{label}</span><span>{value}</span>
                    </div>
                  ))}
                </div>
                <div className="shipping-estimate">
                  <span>Estimated delivery fee<br /><small>Final price confirmed after parcel assessment</small></span>
                  <strong>RM 12.00</strong>
                </div>
                <p className="shipping-payment-label">Choose a payment preference</p>
                <div className="shipping-payment-options">
                  {[
                    ["card", "Credit or debit card"],
                    ["cash", "Cash on pickup"],
                  ].map(([value, label]) => (
                    <label
                      key={value}
                      className={`shipping-payment-option${details.paymentMethod === value ? " selected" : ""}`}
                    >
                      <input
                        type="radio"
                        name="payment-method"
                        value={value}
                        checked={details.paymentMethod === value}
                        onChange={() => updateDetail("paymentMethod", value)}
                      />
                      {label}
                    </label>
                  ))}
                </div>
                <p className="shipping-note">This saves your shipment as a draft. No payment is collected in this setup.</p>
              </div>
            )}

            {currentStep > 0 && (
              <div className="shipping-error-slot">
                {errorMessage && <p className="shipping-error" role="alert">{errorMessage}</p>}
              </div>
            )}

            {currentStep > 0 && <div className="shipping-actions">
              {currentStep > 0 ? (
                <button className="shipping-button secondary" type="button" onClick={goBack} disabled={isSaving}>
                  <ArrowLeft size={17} /> Back
                </button>
              ) : <span />}
              {currentStep < 2 ? (
                <button
                  className="shipping-button"
                  type="button"
                  onClick={saveAndContinue}
                  disabled={!isReady || isSaving}
                >
                  {isSaving ? "Saving…" : currentStep === 0 ? "Save & continue" : "Review shipment"}
                  <ArrowRight size={17} />
                </button>
              ) : (
                <button
                  className="shipping-button"
                  type="button"
                  onClick={saveDraft}
                  disabled={isSaving}
                >
                  <Package size={17} /> {isSaving ? "Saving…" : "Save draft"}
                </button>
              )}
            </div>}
          </section>
        </div>
      </div>
    </>
  );
}

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type PanInfo,
} from "motion/react";
import { ChevronUp, Gauge, Heart, MapPin, SearchX, X } from "lucide-react";
import { toast } from "sonner";
import { VehicleImage } from "@/components/VehicleImage";
import { useSaveFavorite } from "@/components/FavoriteButton";
import { useCurrency } from "@/contexts/CurrencyContext";

interface SwipeCar {
  id: string;
  title: string;
  year: number;
  price: number;
  currency: string;
  location_display?: string | null;
  country?: string;
  mileage?: number | null;
  mileage_unit?: string | null;
  transmission?: string | null;
  fuel_type?: string | null;
  image_url?: string;
  is_sample?: boolean;
}

interface SwipeBrowseModeProps {
  cars: SwipeCar[];
  onExit: () => void;
}

const SWIPE_DISTANCE = 110;
const SWIPE_VELOCITY = 600;
const UP_DISTANCE = 120;

/**
 * Tinder-style browsing: drag the top card right to save it to favourites, left to pass,
 * up for full details. Buttons and arrow keys do the same (← pass, → save, ↑/Enter details,
 * Esc exits).
 */
export function SwipeBrowseMode({ cars, onExit }: SwipeBrowseModeProps) {
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();
  const { save, goToLogin } = useSaveFavorite();
  const reduceMotion = useReducedMotion();

  // `step` only ever grows so every decision mounts a fresh top card, even with one car.
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [showHint, setShowHint] = useState(true);

  const total = cars.length;
  const index = total ? step % total : 0;
  const current = total ? cars[index] : undefined;
  const behind = [1, 2]
    .filter((offset) => total > offset)
    .map((offset) => ({ offset, car: cars[(index + offset) % total] }));

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-320, 0, 320], [-18, 0, 18]);
  const saveOpacity = useTransform(x, [20, SWIPE_DISTANCE], [0, 1]);
  const passOpacity = useTransform(x, [-SWIPE_DISTANCE, -20], [1, 0]);
  const detailsOpacity = useTransform(y, [-UP_DISTANCE, -30], [1, 0]);
  const nextScale = useTransform(x, [-220, 0, 220], [1, 0.95, 1]);
  const nextLift = useTransform(x, [-220, 0, 220], [0, 14, 0]);

  // Reset the drag position before paint whenever a new card reaches the top.
  useLayoutEffect(() => {
    x.set(0);
    y.set(0);
  }, [step, x, y]);

  // Lock page scroll while the full-screen deck is open.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const saveCar = useCallback(
    async (car: SwipeCar) => {
      try {
        const result = await save(car.id);
        if (result === "auth") {
          toast("Sign in to save cars", {
            description: "Cars you like are kept in your favourites once you sign in.",
            action: { label: "Sign in", onClick: () => void goToLogin() },
          });
        } else if (result === "already") {
          toast.success("Already in your favourites", { description: car.title });
        } else {
          toast.success("Saved to favourites", {
            description: `${car.title} added to your saved cars.`,
          });
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not save this car");
      }
    },
    [save, goToLogin],
  );

  const advance = useCallback(() => {
    if (total && (step + 1) % total === 0) {
      toast.info("You've viewed all vehicles in this stack!", {
        description: "Looping back to the beginning.",
      });
    }
    setStep((s) => s + 1);
  }, [step, total]);

  const decide = useCallback(
    async (direction: "save" | "pass") => {
      if (!current || busy) return;
      setBusy(true);
      setShowHint(false);
      if (direction === "save") void saveCar(current);
      const width = typeof window !== "undefined" ? window.innerWidth : 800;
      await animate(
        x,
        (direction === "save" ? 1 : -1) * (width + 320),
        reduceMotion ? { duration: 0 } : { type: "tween", duration: 0.32, ease: "easeOut" },
      );
      advance();
      setBusy(false);
    },
    [current, busy, saveCar, x, reduceMotion, advance],
  );

  const openDetails = useCallback(async () => {
    if (!current || busy) return;
    setBusy(true);
    const height = typeof window !== "undefined" ? window.innerHeight : 800;
    await animate(
      y,
      -height,
      reduceMotion ? { duration: 0 } : { type: "tween", duration: 0.25, ease: "easeIn" },
    );
    void navigate({ to: "/cars/$id", params: { id: current.id } });
  }, [current, busy, y, reduceMotion, navigate]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const { offset, velocity } = info;
    if (offset.y < -UP_DISTANCE && Math.abs(offset.y) > Math.abs(offset.x)) {
      void openDetails();
    } else if (offset.x > SWIPE_DISTANCE || velocity.x > SWIPE_VELOCITY) {
      void decide("save");
    } else if (offset.x < -SWIPE_DISTANCE || velocity.x < -SWIPE_VELOCITY) {
      void decide("pass");
    } else {
      const spring = { type: "spring", stiffness: 520, damping: 32 } as const;
      void animate(x, 0, spring);
      void animate(y, 0, spring);
    }
  };

  // Keyboard: ← pass, → save, ↑ / Enter details, Esc exit.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        void decide("pass");
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        void decide("save");
      } else if (e.key === "ArrowUp" || (e.key === "Enter" && target?.tagName !== "BUTTON")) {
        e.preventDefault();
        void openDetails();
      } else if (e.key === "Escape") {
        onExit();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [decide, openDetails, onExit]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Swipe mode"
      className="fixed inset-0 z-50 flex select-none flex-col bg-ac-ink text-white"
    >
      {/* Header */}
      <div className="mx-auto flex w-full max-w-md items-center justify-between gap-3 px-4 pt-[max(env(safe-area-inset-top),12px)]">
        <div className="min-w-0">
          <p className="brand-kicker text-ac-accent">Swipe mode</p>
          <p className="mt-0.5 text-sm font-semibold text-white/80" aria-live="polite">
            {total ? `${index + 1} of ${total} cars` : "No cars yet"}
          </p>
        </div>
        <button
          type="button"
          onClick={onExit}
          className="inline-flex h-11 items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-4 text-sm font-bold text-white transition hover:bg-white/20"
        >
          <X className="h-4 w-4" /> Exit
        </button>
      </div>

      {!current ? (
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-3xl bg-white/10 text-ac-accent">
            <SearchX className="h-7 w-7" />
          </span>
          <h2 className="font-brand mt-5 text-3xl">Nothing to swipe yet.</h2>
          <p className="mt-3 text-sm leading-6 text-white/70">
            There are no listings in this search right now. Widen your filters or try another
            search, then come back to swipe.
          </p>
          <button
            type="button"
            onClick={onExit}
            className="mt-6 inline-flex h-12 items-center rounded-full bg-ac-accent px-6 text-sm font-extrabold text-ac-ink"
          >
            Back to listings
          </button>
        </div>
      ) : (
        <>
          {/* Deck */}
          <div className="relative mx-auto my-4 w-full max-w-md flex-1 px-4">
            <div className="relative h-full min-h-[320px] w-full">
              {/* Cards behind (furthest first) */}
              {[...behind].reverse().map(({ offset, car }) => (
                <motion.div
                  key={`behind-${step + offset}`}
                  aria-hidden
                  className="absolute inset-0 overflow-hidden rounded-[28px] border border-white/10 bg-ac-ink-soft shadow-2xl"
                  style={
                    offset === 1
                      ? { scale: nextScale, y: nextLift }
                      : { scale: 0.9, y: 28, opacity: 0.6 }
                  }
                >
                  <VehicleImage src={car.image_url} alt="" make={car.title} year={car.year} />
                  <div className="absolute inset-0 bg-ac-ink/30" />
                </motion.div>
              ))}

              {/* Top card */}
              <motion.div
                key={`top-${step}`}
                drag={!busy}
                dragMomentum={false}
                onDragStart={() => setShowHint(false)}
                onDragEnd={handleDragEnd}
                style={{ x, y, rotate, touchAction: "none" }}
                initial={reduceMotion ? false : { scale: 0.96, opacity: 0.6 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.2 }}
                whileDrag={{ cursor: "grabbing" }}
                className="absolute inset-0 cursor-grab overflow-hidden rounded-[28px] border border-white/10 bg-ac-ink-soft shadow-2xl"
              >
                <div className="pointer-events-none absolute inset-0">
                  <VehicleImage
                    src={current.image_url}
                    alt={current.title}
                    make={current.title}
                    year={current.year}
                    loading="eager"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ac-ink via-ac-ink/25 to-transparent" />
                </div>

                {/* Stamps */}
                <motion.div
                  style={{ opacity: saveOpacity }}
                  className="pointer-events-none absolute left-5 top-6 -rotate-12 rounded-xl border-4 border-emerald-400 px-3 py-1 text-3xl font-black tracking-wider text-emerald-400"
                >
                  SAVE
                </motion.div>
                <motion.div
                  style={{ opacity: passOpacity }}
                  className="pointer-events-none absolute right-5 top-6 rotate-12 rounded-xl border-4 border-rose-400 px-3 py-1 text-3xl font-black tracking-wider text-rose-400"
                >
                  PASS
                </motion.div>
                <motion.div
                  style={{ opacity: detailsOpacity }}
                  className="pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2 rounded-xl border-4 border-ac-accent px-3 py-1 text-2xl font-black tracking-wider text-ac-accent"
                >
                  DETAILS
                </motion.div>

                {/* Info */}
                <div className="absolute inset-x-0 bottom-0 space-y-2 p-5">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-white/80">
                    <span className="rounded-full bg-ac-accent px-2.5 py-0.5 font-bold text-ac-ink">
                      {current.year}
                    </span>
                    {current.is_sample && (
                      <span className="rounded-full border border-white/30 bg-white/15 px-2.5 py-0.5 font-bold text-white backdrop-blur">
                        Sample listing
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-ac-accent" />
                      {current.location_display || current.country || "Location on request"}
                    </span>
                  </div>
                  <h3 className="font-brand text-2xl leading-tight text-white">{current.title}</h3>
                  <p className="text-2xl font-extrabold tabular-nums text-white">
                    {formatPrice(current.price || 0)}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs capitalize text-white/75">
                    {current.mileage ? (
                      <span className="inline-flex items-center gap-1">
                        <Gauge className="h-3.5 w-3.5 text-ac-accent" />
                        {(current.mileage / 1000).toFixed(0)}k {current.mileage_unit || "km"}
                      </span>
                    ) : null}
                    {current.transmission && <span>{current.transmission}</span>}
                    {current.fuel_type && <span>{current.fuel_type}</span>}
                  </div>
                  <button
                    type="button"
                    onClick={() => void openDetails()}
                    className="mt-1 inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-full border border-white/20 bg-white/10 text-xs font-bold text-white backdrop-blur transition hover:bg-white/20"
                  >
                    <ChevronUp className="h-4 w-4 text-ac-accent" /> Swipe up for full specs
                  </button>
                </div>
              </motion.div>

              {showHint && (
                <div className="pointer-events-none absolute inset-x-6 top-1/2 z-10 -translate-y-1/2 rounded-2xl bg-ac-ink/80 p-4 text-center text-xs leading-5 text-white/85 backdrop-blur">
                  Drag right to <b className="text-emerald-300">save</b>, left to{" "}
                  <b className="text-rose-300">pass</b>, up for details.
                  <span className="hidden sm:inline"> Arrow keys work too.</span>
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="mx-auto flex w-full max-w-md items-start justify-center gap-6 px-4 pb-[max(env(safe-area-inset-bottom),16px)]">
            <ControlButton
              label="Pass"
              onClick={() => void decide("pass")}
              disabled={busy}
              className="h-16 w-16 text-rose-400"
            >
              <X className="h-7 w-7" />
            </ControlButton>
            <ControlButton
              label="Details"
              onClick={() => void openDetails()}
              disabled={busy}
              className="mt-2 h-12 w-12 text-white/80"
            >
              <ChevronUp className="h-6 w-6" />
            </ControlButton>
            <ControlButton
              label="Save"
              onClick={() => void decide("save")}
              disabled={busy}
              className="h-16 w-16 text-emerald-400"
            >
              <Heart className="h-7 w-7" />
            </ControlButton>
          </div>
        </>
      )}
    </div>
  );
}

function ControlButton({
  label,
  onClick,
  disabled,
  className,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        className={`grid place-items-center rounded-full border-2 border-white/15 bg-white/5 shadow-xl transition hover:scale-105 active:scale-95 disabled:opacity-60 ${className ?? ""}`}
      >
        {children}
      </button>
      <span className="text-[11px] font-semibold text-white/60">{label}</span>
    </div>
  );
}

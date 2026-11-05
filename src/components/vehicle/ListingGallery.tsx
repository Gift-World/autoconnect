import { useEffect, useRef, useState } from "react";
import { sizedImage } from "@/lib/image-url";
import { Box, ChevronLeft, ChevronRight, Grid3X3, RotateCcw, Video, X } from "lucide-react";
import { VehiclePlaceholder } from "@/components/VehicleImage";
import { cn } from "@/lib/utils";

type GalleryImage = { image_url: string };

/**
 * Photos-first gallery. Every photo sits in a fixed-aspect box with object-cover, so any
 * image ratio fits. Mobile: swipeable snap carousel. Desktop: Airbnb-style mosaic.
 * The lightbox shows each photo uncropped (object-contain).
 */
export function ListingGallery({
  images,
  title,
  has360,
  on360,
  onVideo,
  onAr,
}: {
  images: GalleryImage[];
  title: string;
  has360?: boolean;
  on360?: () => void;
  onVideo?: () => void;
  onAr?: () => void;
}) {
  const [active, setActive] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const open = (i: number) => {
    setLightboxIdx(i);
    setLightboxOpen(true);
  };
  const lbGo = (dir: 1 | -1) => setLightboxIdx((i) => (i + dir + images.length) % images.length);

  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowLeft") lbGo(-1);
      if (e.key === "ArrowRight") lbGo(1);
    };
    window.addEventListener("keydown", handleKeyDown);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previous;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightboxOpen, images.length]);

  const scrollTo = (i: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  const mediaButtons = (
    <>
      {has360 && on360 && (
        <MediaButton onClick={on360}>
          <RotateCcw className="h-4 w-4" /> 360° spin
        </MediaButton>
      )}
      {onVideo && (
        <MediaButton onClick={onVideo}>
          <Video className="h-4 w-4" /> Video
        </MediaButton>
      )}
      {onAr && (
        <MediaButton onClick={onAr}>
          <Box className="h-4 w-4" /> AR
        </MediaButton>
      )}
    </>
  );

  if (images.length === 0) {
    return (
      <div className="relative aspect-[4/3] overflow-hidden rounded-[28px] sm:aspect-[16/9] sm:rounded-[36px]">
        <VehiclePlaceholder
          make={title.split(" ")[0]}
          model={title.split(" ").slice(1).join(" ")}
          className="h-full w-full"
        />
        <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">{mediaButtons}</div>
      </div>
    );
  }

  // Desktop mosaic cell layout for the photos after the first one.
  const rest = images.slice(1, 5);
  const restClass = (i: number) => {
    if (rest.length === 1) return "col-span-2 row-span-2";
    if (rest.length === 2) return "col-span-2";
    if (rest.length === 3) return i === 2 ? "col-span-2" : "";
    return "";
  };

  return (
    <div>
      {/* Mobile carousel */}
      <div className="relative md:hidden">
        <div
          ref={scrollerRef}
          onScroll={(e) => {
            const el = e.currentTarget;
            setActive(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)));
          }}
          className="no-scrollbar -mx-4 flex snap-x snap-mandatory overflow-x-auto sm:mx-0 sm:rounded-[28px]"
        >
          {images.map((img, i) => (
            <button
              key={`${img.image_url}-${i}`}
              type="button"
              onClick={() => open(i)}
              className="relative aspect-[4/3] w-full shrink-0 snap-center bg-muted"
              aria-label={`Open photo ${i + 1} of ${images.length}`}
            >
              <img
                src={sizedImage(img.image_url, 960)}
                alt={i === 0 ? title : `${title} photo ${i + 1}`}
                loading={i === 0 ? "eager" : "lazy"}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
        <div className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-black/65 px-3 py-1 text-xs font-semibold text-white">
          {Math.min(active + 1, images.length)} / {images.length}
        </div>
        <div className="absolute bottom-3 left-0 flex flex-wrap gap-2 sm:left-3">{mediaButtons}</div>
      </div>

      {/* Desktop mosaic */}
      <div className="relative hidden md:block">
        <div
          className={cn(
            "grid aspect-[2/1] gap-2 overflow-hidden rounded-[36px]",
            images.length === 1 ? "grid-cols-1" : "grid-cols-4 grid-rows-2",
          )}
        >
          <button
            type="button"
            onClick={() => open(0)}
            className={cn(
              "group relative overflow-hidden bg-muted",
              images.length > 1 && "col-span-2 row-span-2",
            )}
            aria-label="Open photo 1"
          >
            <img
              src={sizedImage(images[0].image_url, 1280)}
              alt={title}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            />
          </button>
          {rest.map((img, i) => (
            <button
              key={`${img.image_url}-${i}`}
              type="button"
              onClick={() => open(i + 1)}
              className={cn("group relative overflow-hidden bg-muted", restClass(i))}
              aria-label={`Open photo ${i + 2}`}
            >
              <img
                src={sizedImage(img.image_url, 500)}
                alt={`${title} photo ${i + 2}`}
                loading="lazy"
                className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
              />
            </button>
          ))}
        </div>
        <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">{mediaButtons}</div>
        <button
          type="button"
          onClick={() => open(0)}
          className="absolute bottom-4 right-4 inline-flex h-11 items-center gap-2 rounded-full border border-ac-ink/10 bg-white px-4 text-sm font-bold text-ac-ink shadow-lg transition hover:scale-[1.02]"
        >
          <Grid3X3 className="h-4 w-4" /> Show all {images.length} photos
        </button>
      </div>

      {/* Mobile dots for quick jumps */}
      {images.length > 1 && (
        <div className="mt-3 flex justify-center gap-1.5 md:hidden">
          {images.slice(0, 8).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => scrollTo(i)}
              aria-label={`Go to photo ${i + 1}`}
              className="grid h-6 w-6 place-items-center"
            >
              <span
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === active ? "w-4 bg-foreground" : "w-1.5 bg-foreground/30",
                )}
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${title} photos`}
          className="fixed inset-0 z-50 flex flex-col bg-black/95"
          onClick={() => setLightboxOpen(false)}
        >
          <div className="flex items-center justify-between p-4">
            <span className="rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium text-white">
              {lightboxIdx + 1} / {images.length}
            </span>
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              className="grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              aria-label="Close photos"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div
            className="relative flex min-h-0 flex-1 items-center justify-center px-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={sizedImage(images[lightboxIdx]?.image_url, 1920)}
              alt={`${title} fullscreen`}
              className="max-h-full max-w-full object-contain"
            />
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => lbGo(-1)}
                  className="absolute left-2 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-black/50 text-white transition hover:bg-black/70"
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="h-8 w-8" />
                </button>
                <button
                  type="button"
                  onClick={() => lbGo(1)}
                  className="absolute right-2 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-black/50 text-white transition hover:bg-black/70"
                  aria-label="Next photo"
                >
                  <ChevronRight className="h-8 w-8" />
                </button>
              </>
            )}
          </div>

          {images.length > 1 && (
            <div
              className="no-scrollbar flex gap-2 overflow-x-auto p-4"
              onClick={(e) => e.stopPropagation()}
            >
              {images.map((img, i) => (
                <button
                  key={`${img.image_url}-thumb-${i}`}
                  type="button"
                  onClick={() => setLightboxIdx(i)}
                  className={cn(
                    "aspect-square w-16 shrink-0 overflow-hidden rounded-xl border-2 transition",
                    i === lightboxIdx ? "border-ac-accent" : "border-transparent opacity-60 hover:opacity-100",
                  )}
                  aria-label={`Show photo ${i + 1}`}
                >
                  <img src={sizedImage(img.image_url, 330)} alt="" loading="lazy" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MediaButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-11 items-center gap-1.5 rounded-full bg-white/95 px-4 text-sm font-bold text-ac-ink shadow-lg transition hover:scale-[1.02]"
    >
      {children}
    </button>
  );
}

import { useState } from "react";
import { sizedImage } from "@/lib/image-url";
import { Car as CarIcon, ShieldCheck } from "lucide-react";

interface VehicleImageProps {
  src?: string | null;
  /** Rough display width in CSS pixels × 2; used to request a right-sized copy. */
  width?: number;
  alt: string;
  make?: string | null;
  model?: string | null;
  year?: number | string | null;
  bodyType?: string | null;
  className?: string;
  aspectRatio?: string;
  loading?: "lazy" | "eager";
  badge?: string | null;
}

export function VehiclePlaceholder({
  make,
  model,
  year,
  bodyType,
  className = "",
}: {
  make?: string | null;
  model?: string | null;
  year?: number | string | null;
  bodyType?: string | null;
  className?: string;
}) {
  return (
    <div
      className={`relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-ac-cream p-6 text-center text-ac-ink ${className}`}
    >
      {/* Soft grid pattern */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(11,19,36,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(11,19,36,0.06)_1px,transparent_1px)] bg-[size:28px_28px]" />
      <div className="pointer-events-none absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-ac-apricot/70 blur-2xl" />

      <div className="relative z-10 flex flex-col items-center">
        <div className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-ac-ink text-ac-accent shadow-sm">
          <CarIcon className="h-7 w-7" />
        </div>

        <div className="max-w-[240px] space-y-1">
          {year && (
            <span className="brand-kicker inline-block text-ac-ink/60">
              {year} · {bodyType || "Vehicle"}
            </span>
          )}
          <h4 className="line-clamp-1 text-sm font-bold text-ac-ink">
            {make ? `${make} ${model || ""}` : "Photo coming soon"}
          </h4>
          <p className="text-[11px] text-ac-ink/60">
            Photos not supplied yet. Review the listing details.
          </p>
        </div>

        <div className="mt-3 flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-semibold text-ac-ink/70">
          <ShieldCheck className="h-3 w-3 text-ac-ink" />
          <span>Evidence may be available</span>
        </div>
      </div>
    </div>
  );
}

export function VehicleImage({
  src,
  alt,
  make,
  model,
  year,
  bodyType,
  className = "",
  loading = "lazy",
  badge,
  width = 960,
}: VehicleImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  if (!src || hasError) {
    return (
      <VehiclePlaceholder
        make={make}
        model={model}
        year={year}
        bodyType={bodyType}
        className={className}
      />
    );
  }

  return (
    <div className={`relative h-full w-full overflow-hidden bg-muted ${className}`}>
      {!isLoaded && <div className="absolute inset-0 animate-pulse bg-muted" />}
      <img
        src={sizedImage(src, width)}
        alt={alt}
        loading={loading}
        draggable={false}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={`h-full w-full object-cover transition-opacity duration-300 ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
      />
      {badge && (
        <div className="absolute left-3 top-3 z-10">
          <span className="rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-md">
            {badge}
          </span>
        </div>
      )}
    </div>
  );
}

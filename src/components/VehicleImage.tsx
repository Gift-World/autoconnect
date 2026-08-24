import { useState } from "react";
import { Car as CarIcon, ShieldCheck, Sparkles, Fuel, Gauge } from "lucide-react";

interface VehicleImageProps {
  src?: string | null;
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
      className={`relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-white to-teal-50 p-6 text-center text-slate-900 ${className}`}
    >
      {/* Background architectural grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f766e10_1px,transparent_1px),linear-gradient(to_bottom,#0f766e10_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      
      {/* Ambient glow */}
      <div className="absolute h-32 w-32 rounded-full bg-teal-300/30 blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center">
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-teal-200 bg-white text-teal-600 shadow-sm">
          <CarIcon className="h-7 w-7" />
        </div>

        <div className="space-y-1 max-w-[240px]">
          {year && (
            <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-teal-700">
              {year} · {bodyType || "Verified Vehicle"}
            </span>
          )}
          <h4 className="text-sm font-bold text-slate-900 line-clamp-1">
            {make ? `${make} ${model || ""}` : "Verified Vehicle"}
          </h4>
          <p className="text-[11px] text-slate-500">
            Physical diagnostics & title verified
          </p>
        </div>

        <div className="mt-3 flex items-center gap-1 rounded-full border border-teal-200 bg-white/85 px-2.5 py-1 text-[10px] font-semibold text-slate-600 backdrop-blur-sm">
          <ShieldCheck className="h-3 w-3 text-teal-600" />
          <span>Inspection Cleared</span>
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
    <div className={`relative h-full w-full overflow-hidden bg-slate-100 ${className}`}>
      {!isLoaded && (
        <div className="absolute inset-0 animate-pulse bg-slate-200" />
      )}
      <img
        src={src}
        alt={alt}
        loading={loading}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={`h-full w-full object-cover transition-opacity duration-300 ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
      />
      {badge && (
        <div className="absolute top-3 left-3 z-10">
          <span className="rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-md">
            {badge}
          </span>
        </div>
      )}
    </div>
  );
}

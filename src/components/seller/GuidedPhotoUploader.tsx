import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ImagePlus, X, Loader2, Check, Star } from "lucide-react";
import { toast } from "sonner";
import {
  REQUIRED_PHOTO_KINDS,
  OPTIONAL_PHOTO_KINDS,
  PHOTO_LABELS,
  type PhotoKind,
} from "@/lib/listing-checklist";

export interface UploadedPhoto {
  url: string;
  path: string;
  isPrimary: boolean;
  kind: PhotoKind | "extra";
}

interface Props {
  userId: string;
  value: UploadedPhoto[];
  onChange: (next: UploadedPhoto[]) => void;
}

const BUCKET = "car-images";
const MAX_BYTES = 8 * 1024 * 1024;

export function GuidedPhotoUploader({ userId, value, onChange }: Props) {
  const [busyKind, setBusyKind] = useState<string | null>(null);
  const extraRef = useRef<HTMLInputElement>(null);

  async function uploadOne(file: File, kind: PhotoKind | "extra"): Promise<UploadedPhoto | null> {
    if (!file.type.startsWith("image/")) {
      toast.error(`${file.name}: not an image`);
      return null;
    }
    if (file.size > MAX_BYTES) {
      toast.error(`${file.name}: max 8MB`);
      return null;
    }
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { cacheControl: "3600", upsert: false });
    if (error) {
      toast.error(`Upload failed: ${error.message}`);
      return null;
    }
    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return { url: pub.publicUrl, path, isPrimary: false, kind };
  }

  async function pickForKind(files: FileList | null, kind: PhotoKind) {
    if (!files || files.length === 0) return;
    setBusyKind(kind);
    // Replace any existing photo of this kind
    const existing = value.find((p) => p.kind === kind);
    const uploaded = await uploadOne(files[0], kind);
    setBusyKind(null);
    if (!uploaded) return;
    let next = value.filter((p) => p.kind !== kind);
    if (existing) {
      await supabase.storage.from(BUCKET).remove([existing.path]);
    }
    // Preserve primary flag: if the replaced photo was primary, or nothing is primary yet
    const hadPrimary = value.some((p) => p.isPrimary);
    uploaded.isPrimary = existing?.isPrimary || !hadPrimary;
    next = next.map((p) => ({ ...p, isPrimary: uploaded.isPrimary ? false : p.isPrimary }));
    onChange([...next, uploaded]);
  }

  async function pickExtras(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusyKind("extra");
    const added: UploadedPhoto[] = [];
    for (const file of Array.from(files)) {
      const u = await uploadOne(file, "extra");
      if (u) added.push(u);
    }
    setBusyKind(null);
    if (extraRef.current) extraRef.current.value = "";
    const hadPrimary = value.some((p) => p.isPrimary);
    if (!hadPrimary && added[0]) added[0].isPrimary = true;
    onChange([...value, ...added]);
  }

  async function remove(p: UploadedPhoto) {
    const next = value.filter((x) => x.path !== p.path);
    if (p.isPrimary && next.length > 0) next[0].isPrimary = true;
    onChange(next);
    await supabase.storage.from(BUCKET).remove([p.path]);
  }

  function makePrimary(p: UploadedPhoto) {
    onChange(value.map((x) => ({ ...x, isPrimary: x.path === p.path })));
  }

  const requiredDone = REQUIRED_PHOTO_KINDS.filter((k) => value.some((p) => p.kind === k)).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-sm">
        <span className="font-medium">
          Required photos: {requiredDone} / {REQUIRED_PHOTO_KINDS.length}
        </span>
        <span className="text-xs text-muted-foreground">
          Click a slot below to upload that specific angle. Each slot holds one photo.
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {[...REQUIRED_PHOTO_KINDS, ...OPTIONAL_PHOTO_KINDS].map((kind) => {
          const photo = value.find((p) => p.kind === kind);
          const isOptional = OPTIONAL_PHOTO_KINDS.includes(kind);
          return (
            <PhotoSlot
              key={kind}
              label={PHOTO_LABELS[kind]}
              optional={isOptional}
              photo={photo ?? null}
              busy={busyKind === kind}
              onPick={(files) => pickForKind(files, kind)}
              onRemove={() => photo && remove(photo)}
              onMakePrimary={() => photo && makePrimary(photo)}
            />
          );
        })}
      </div>

      {/* Extra photos */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium">Extra photos (optional)</p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busyKind === "extra"}
            onClick={() => extraRef.current?.click()}
          >
            {busyKind === "extra" ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <ImagePlus className="mr-1 h-4 w-4" />
            )}
            Add more
          </Button>
          <input
            ref={extraRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => pickExtras(e.target.files)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {value
            .filter((p) => p.kind === "extra")
            .map((p) => (
              <div
                key={p.path}
                className="group relative aspect-square overflow-hidden rounded-lg border bg-muted"
              >
                <img src={p.url} alt="" className="h-full w-full object-cover" />
                {p.isPrimary && (
                  <span className="absolute left-1 top-1 rounded bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-accent-foreground">
                    PRIMARY
                  </span>
                )}
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition group-hover:opacity-100">
                  {!p.isPrimary && (
                    <Button size="icon" variant="secondary" type="button" onClick={() => makePrimary(p)}>
                      <Star className="h-4 w-4" />
                    </Button>
                  )}
                  <Button size="icon" variant="destructive" type="button" onClick={() => remove(p)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

function PhotoSlot({
  label,
  optional,
  photo,
  busy,
  onPick,
  onRemove,
  onMakePrimary,
}: {
  label: string;
  optional: boolean;
  photo: UploadedPhoto | null;
  busy: boolean;
  onPick: (files: FileList | null) => void;
  onRemove: () => void;
  onMakePrimary: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-1">
        <span className="text-xs font-medium">{label}</span>
        {optional ? (
          <span className="text-[10px] uppercase text-muted-foreground">Optional</span>
        ) : photo ? (
          <Check className="h-3.5 w-3.5 text-emerald-500" />
        ) : (
          <span className="text-[10px] uppercase text-muted-foreground">Required</span>
        )}
      </div>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        disabled={busy}
        className={`group relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg border-2 border-dashed transition ${
          photo
            ? "border-transparent bg-muted"
            : "border-border bg-muted/30 hover:border-primary hover:text-primary"
        } disabled:opacity-50`}
      >
        {photo ? (
          <>
            <img src={photo.url} alt={label} className="h-full w-full object-cover" />
            {photo.isPrimary && (
              <span className="absolute left-1 top-1 rounded bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-accent-foreground">
                PRIMARY
              </span>
            )}
            <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-xs font-medium text-white opacity-0 transition group-hover:opacity-100">
              Replace
            </span>
          </>
        ) : busy ? (
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        ) : (
          <ImagePlus className="h-6 w-6 text-muted-foreground" />
        )}
      </button>
      {photo && (
        <div className="flex items-center justify-between gap-1 text-[11px]">
          {!photo.isPrimary ? (
            <button
              type="button"
              onClick={onMakePrimary}
              className="text-muted-foreground hover:text-foreground"
            >
              Make primary
            </button>
          ) : (
            <span className="text-muted-foreground">Cover photo</span>
          )}
          <button
            type="button"
            onClick={onRemove}
            className="text-destructive hover:underline"
          >
            Remove
          </button>
        </div>
      )}
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          onPick(e.target.files);
          if (ref.current) ref.current.value = "";
        }}
      />
    </div>
  );
}

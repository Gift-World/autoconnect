import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ImagePlus, Star, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

export interface UploadedPhoto {
  url: string;
  path: string;
  isPrimary: boolean;
}

interface Props {
  userId: string;
  value: UploadedPhoto[];
  onChange: (next: UploadedPhoto[]) => void;
  max?: number;
}

const BUCKET = "car-images";
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

export function PhotoUploader({ userId, value, onChange, max = 12 }: Props) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const slots = max - value.length;
    const list = Array.from(files).slice(0, Math.max(0, slots));
    if (list.length === 0) {
      toast.error(`Maximum ${max} photos`);
      return;
    }
    setUploading(true);
    const added: UploadedPhoto[] = [];
    for (const file of list) {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name}: not an image`);
        continue;
      }
      if (file.size > MAX_BYTES) {
        toast.error(`${file.name}: max 8MB`);
        continue;
      }
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${userId}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (upErr) {
        toast.error(`Upload failed: ${upErr.message}`);
        continue;
      }
      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
      added.push({
        url: pub.publicUrl,
        path,
        isPrimary: value.length === 0 && added.length === 0,
      });
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
    onChange([...value, ...added]);
  }

  async function remove(idx: number) {
    const removed = value[idx];
    const next = value.filter((_, i) => i !== idx);
    if (removed.isPrimary && next.length > 0) next[0].isPrimary = true;
    onChange(next);
    await supabase.storage.from(BUCKET).remove([removed.path]);
  }

  function makePrimary(idx: number) {
    onChange(value.map((p, i) => ({ ...p, isPrimary: i === idx })));
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {value.map((p, i) => (
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
                <Button
                  size="icon"
                  variant="secondary"
                  type="button"
                  onClick={() => makePrimary(i)}
                  title="Set as primary"
                >
                  <Star className="h-4 w-4" />
                </Button>
              )}
              <Button
                size="icon"
                variant="destructive"
                type="button"
                onClick={() => remove(i)}
                title="Remove"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        {value.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border bg-muted/30 text-sm text-muted-foreground hover:border-primary hover:text-primary disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <ImagePlus className="h-6 w-6" />
            )}
            {uploading ? "Uploading…" : "Add photos"}
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <p className="text-xs text-muted-foreground">
        Up to {max} photos · 8 MB each · the first photo is the primary cover.
        Click a photo to remove or set as primary.
      </p>
    </div>
  );
}

import { useEffect, useState } from "react";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  REQUIRED_PHOTO_KINDS,
  REQUIRED_DOC_KINDS,
  PHOTO_LABELS,
  DOC_LABELS,
} from "@/lib/listing-checklist";

interface Props {
  carId: string;
  /** When true, headings are muted admin-facing wording */
  variant?: "seller" | "admin";
}

export function ListingChecklist({ carId, variant = "seller" }: Props) {
  const [loading, setLoading] = useState(true);
  const [photoKinds, setPhotoKinds] = useState<string[]>([]);
  const [docKinds, setDocKinds] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    void (async () => {
      setLoading(true);
      const [imgs, docs] = await Promise.all([
        supabase.from("car_images").select("photo_kind").eq("car_id", carId),
        supabase.from("car_documents").select("kind").eq("car_id", carId),
      ]);
      if (!active) return;
      setPhotoKinds(
        ((imgs.data ?? []).map((r) => r.photo_kind).filter(Boolean) as string[]),
      );
      setDocKinds(((docs.data ?? []).map((r) => r.kind) as string[]));
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [carId]);

  if (loading)
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading checklist…
      </div>
    );

  const photoDone = new Set(photoKinds);
  const docDone = new Set(docKinds);
  const photosMissing = REQUIRED_PHOTO_KINDS.filter((k) => !photoDone.has(k));
  const docsMissing = REQUIRED_DOC_KINDS.filter((k) => !docDone.has(k));
  const complete = photosMissing.length === 0 && docsMissing.length === 0;

  return (
    <div className="space-y-3 rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">
          {variant === "admin" ? "Submission checklist" : "What's missing"}
        </h3>
        <span
          className={`text-xs font-medium ${
            complete ? "text-emerald-600" : "text-amber-600"
          }`}
        >
          {complete
            ? "Complete"
            : `${photosMissing.length + docsMissing.length} item${
                photosMissing.length + docsMissing.length === 1 ? "" : "s"
              } missing`}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Section
          title={`Photos (${REQUIRED_PHOTO_KINDS.length - photosMissing.length}/${REQUIRED_PHOTO_KINDS.length})`}
          items={REQUIRED_PHOTO_KINDS.map((k) => ({
            label: PHOTO_LABELS[k],
            done: photoDone.has(k),
          }))}
        />
        <Section
          title={`Documents (${REQUIRED_DOC_KINDS.length - docsMissing.length}/${REQUIRED_DOC_KINDS.length})`}
          items={REQUIRED_DOC_KINDS.map((k) => ({
            label: DOC_LABELS[k] ?? k,
            done: docDone.has(k),
          }))}
        />
      </div>

      {variant === "seller" && !complete && (
        <p className="text-xs text-muted-foreground">
          Add the items above to help admin approve your listing faster. Uploaded documents
          count as received — they're marked verified after review.
        </p>
      )}
    </div>
  );
}

function Section({
  title,
  items,
}: {
  title: string;
  items: { label: string; done: boolean }[];
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <ul className="space-y-1">
        {items.map((it) => (
          <li key={it.label} className="flex items-center gap-2 text-sm">
            {it.done ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
            ) : (
              <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            <span className={it.done ? "text-foreground" : "text-muted-foreground"}>
              {it.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

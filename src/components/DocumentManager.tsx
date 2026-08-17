import { useEffect, useState } from "react";
import { Upload, FileText, CheckCircle2, Clock, XCircle, Trash2, Loader2, Download } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type DocKind =
  | "logbook"
  | "seller_id"
  | "insurance"
  | "inspection"
  | "title"
  | "registration"
  | "export_cert"
  | "customs"
  | "other";

const KIND_LABEL: Record<DocKind, string> = {
  logbook: "Logbook (required)",
  seller_id: "Seller ID (required)",
  insurance: "Insurance certificate (required)",
  inspection: "Inspection certificate (required)",
  title: "Title / Ownership",
  registration: "Registration",
  export_cert: "Export certificate",
  customs: "Customs / Duty",
  other: "Other",
};

interface DocRow {
  id: string;
  car_id: string;
  seller_id: string;
  kind: DocKind;
  label: string | null;
  file_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  status: "pending" | "verified" | "rejected";
  review_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
}

function statusPill(status: DocRow["status"]) {
  const map = {
    pending: { icon: <Clock className="h-3 w-3" />, cls: "bg-amber-500/10 text-amber-700 dark:text-amber-400", label: "Pending review" },
    verified: { icon: <CheckCircle2 className="h-3 w-3" />, cls: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400", label: "Verified" },
    rejected: { icon: <XCircle className="h-3 w-3" />, cls: "bg-destructive/10 text-destructive", label: "Rejected" },
  }[status];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium", map.cls)}>
      {map.icon}
      {map.label}
    </span>
  );
}

function humanSize(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function DocumentManager({ carId, sellerId }: { carId: string; sellerId: string }) {
  const { user } = useAuth();
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [kind, setKind] = useState<DocKind>("logbook");
  const [label, setLabel] = useState("");
  const canEdit = user?.id === sellerId;

  async function load() {
    const { data, error } = await supabase
      .from("car_documents")
      .select("id,car_id,seller_id,kind,label,file_path,mime_type,size_bytes,status,review_notes,reviewed_at,created_at")
      .eq("car_id", carId)
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setDocs((data as DocRow[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carId]);

  async function handleFile(file: File) {
    if (!user) return;
    if (file.size > 15 * 1024 * 1024) {
      toast.error("Max file size is 15 MB.");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "bin";
      const path = `${user.id}/${carId}/${Date.now()}-${kind}.${ext}`;
      const up = await supabase.storage.from("car-documents").upload(path, file, {
        contentType: file.type,
        upsert: false,
      });
      if (up.error) throw up.error;
      const ins = await supabase.from("car_documents").insert({
        car_id: carId,
        seller_id: user.id,
        kind,
        label: label.trim() || null,
        file_path: path,
        mime_type: file.type || null,
        size_bytes: file.size,
      });
      if (ins.error) throw ins.error;
      toast.success("Document uploaded — pending review.");
      setLabel("");
      await load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Upload failed";
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  }

  async function openDoc(d: DocRow) {
    const { data, error } = await supabase.storage
      .from("car-documents")
      .createSignedUrl(d.file_path, 60 * 10);
    if (error || !data?.signedUrl) {
      toast.error("Could not open document.");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  async function removeDoc(d: DocRow) {
    if (!canEdit) return;
    if (!confirm("Delete this document?")) return;
    await supabase.storage.from("car-documents").remove([d.file_path]);
    const { error } = await supabase.from("car_documents").delete().eq("id", d.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setDocs((cur) => cur.filter((x) => x.id !== d.id));
    toast.success("Removed.");
  }

  return (
    <div className="space-y-5">
      {canEdit && (
        <div className="rounded-xl border border-dashed border-border bg-secondary/30 p-4">
          <div className="grid gap-3 sm:grid-cols-[180px_1fr_auto]">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Document type</Label>
              <Select value={kind} onValueChange={(v) => setKind(v as DocKind)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(KIND_LABEL) as DocKind[]).map((k) => (
                    <SelectItem key={k} value={k}>
                      {KIND_LABEL[k]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Label (optional)</Label>
              <Input
                placeholder="e.g. Original title scan, page 2"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <label className="w-full">
                <input
                  type="file"
                  className="sr-only"
                  accept="application/pdf,image/*"
                  disabled={uploading}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void handleFile(f);
                    e.target.value = "";
                  }}
                />
                <span
                  className={cn(
                    "inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90",
                    uploading && "pointer-events-none opacity-70",
                  )}
                >
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {uploading ? "Uploading…" : "Upload"}
                </span>
              </label>
            </div>
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
            PDF or image, up to 15 MB. Documents are private — only you and our verification team can see
            them. Buyers see only a verified-document badge on your listing.
          </p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading documents…
        </div>
      ) : docs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
          No documents uploaded yet.
        </div>
      ) : (
        <ul className="space-y-2">
          {docs.map((d) => (
            <li
              key={d.id}
              className="flex items-start gap-3 rounded-xl border border-border bg-card p-3"
            >
              <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-secondary text-muted-foreground">
                <FileText className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {KIND_LABEL[d.kind] ?? d.kind}
                  </p>
                  {statusPill(d.status)}
                </div>
                {d.label && (
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{d.label}</p>
                )}
                <p className="mt-0.5 text-[11px] text-muted-foreground/80">
                  {new Date(d.created_at).toLocaleDateString()} · {humanSize(d.size_bytes)}
                </p>
                {d.status === "rejected" && d.review_notes && (
                  <p className="mt-1.5 rounded-md bg-destructive/10 px-2 py-1 text-[11px] text-destructive">
                    {d.review_notes}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button size="icon" variant="ghost" onClick={() => void openDoc(d)} title="Open">
                  <Download className="h-4 w-4" />
                </Button>
                {canEdit && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => void removeDoc(d)}
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Compact public trust badge — shown on car detail pages */
export function VerifiedDocsBadge({ carId }: { carId: string }) {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    let active = true;
    void supabase
      .from("car_documents")
      .select("id", { count: "exact", head: true })
      .eq("car_id", carId)
      .eq("status", "verified")
      .then(({ count }) => {
        if (active) setCount(count ?? 0);
      });
    return () => {
      active = false;
    };
  }, [carId]);
  if (count === null || count === 0) return null;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
      <CheckCircle2 className="h-3.5 w-3.5" />
      {count} verified document{count === 1 ? "" : "s"}
    </span>
  );
}

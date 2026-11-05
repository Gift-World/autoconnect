import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { FileCheck2, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyPanel, Panel } from "@/components/seller/SellerUI";

export const Route = createFileRoute("/_authenticated/seller/evidence")({ component: SellerEvidence });
const TYPES = ["inspection_report", "ownership_document", "service_record", "mileage_record", "recall_notice", "history_report", "other"];

function SellerEvidence() {
  const [cars, setCars] = useState<any[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [carId, setCarId] = useState("");
  const [type, setType] = useState("inspection_report");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const load = async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    const { data: seller } = await supabase.from("sellers").select("id").eq("profile_id", userData.user.id).maybeSingle();
    if (!seller) return;
    const { data: carRows } = await supabase.from("cars").select("id,title,year").eq("seller_id", seller.id).order("created_at", { ascending: false });
    setCars(carRows ?? []);
    const { data: evidence } = await supabase.from("vehicle_evidence").select("id,title,evidence_type,status,is_public,created_at,cars(title)").eq("submitted_by", userData.user.id).order("created_at", { ascending: false });
    setRows(evidence ?? []);
  };
  useEffect(() => {
    void load();
  }, []);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!carId || !title.trim()) return toast.error("Choose a vehicle and add a document title.");
    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from("vehicle_evidence").insert({ car_id: carId, submitted_by: userData.user!.id, evidence_type: type, title: title.trim(), source_url: url.trim() || null });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Evidence submitted for review");
    setTitle("");
    setUrl("");
    void load();
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        eyebrow="Vehicle evidence"
        title="Submit facts, not promises."
        description="Attach a document link for admin review. It is private until approved and explicitly made public."
      />

      <form onSubmit={submit} className="rounded-3xl border border-border bg-card p-4 sm:p-8">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-ac-accent text-ac-ink">
            <Plus className="h-5 w-5" />
          </span>
          <h2 className="font-brand text-xl sm:text-2xl">Submit evidence</h2>
        </div>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Vehicle</Label>
            <Select value={carId} onValueChange={setCarId}>
              <SelectTrigger className="h-12 rounded-xl">
                <SelectValue placeholder={cars.length ? "Choose a vehicle" : "No vehicles yet"} />
              </SelectTrigger>
              <SelectContent>
                {cars.map((car) => (
                  <SelectItem value={car.id} key={car.id}>
                    {car.year} {car.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Evidence type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="h-12 rounded-xl capitalize">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPES.map((item) => (
                  <SelectItem key={item} value={item} className="capitalize">
                    {item.replaceAll("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Document title</Label>
            <Input className="h-12 rounded-xl" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Independent inspection – 12 Sep 2026" />
          </div>
          <div className="space-y-2">
            <Label>Secure document URL (optional)</Label>
            <Input className="h-12 rounded-xl" type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
          </div>
        </div>
        <div className="mt-6 flex justify-end border-t border-border pt-5">
          <Button className="h-12 rounded-full bg-ac-accent px-6 text-ac-ink hover:bg-ac-accent/90" disabled={saving}>
            {saving ? "Submitting…" : "Submit for review"}
          </Button>
        </div>
      </form>

      <Panel kicker="History" title="Your submitted evidence">
        {rows.length ? (
          <ul className="divide-y divide-border rounded-2xl border border-border">
            {rows.map((row) => (
              <li className="flex items-center justify-between gap-3 p-4" key={row.id}>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{row.title}</p>
                  <p className="mt-1 text-xs capitalize text-muted-foreground">
                    {(Array.isArray(row.cars) ? row.cars[0] : row.cars)?.title || "Vehicle"} · {row.evidence_type.replaceAll("_", " ")}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-muted px-3 py-1 text-xs font-semibold capitalize">{row.status}</span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyPanel
            icon={<FileCheck2 />}
            title="No evidence submitted yet."
            description="Inspection reports, service records and ownership papers help buyers trust your listing."
            action={
              cars.length === 0 ? (
                <Button asChild className="h-11 rounded-full">
                  <Link to="/seller/listings/new" search={{ edit: undefined }}>
                    Create a listing first
                  </Link>
                </Button>
              ) : undefined
            }
          />
        )}
      </Panel>
    </div>
  );
}

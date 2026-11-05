import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, ArrowLeft, CheckCircle2, Wrench } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusPill } from "@/components/StatusPill";
import { AdminPage, AdminPanel, QueueEmpty, TAP } from "@/components/admin/AdminUI";

export const Route = createFileRoute("/_authenticated/admin/inspections/$id")({
  component: AdminInspectionDetail,
});

const SECTIONS: { key: string; label: string; items: { key: string; label: string }[] }[] = [
  {
    key: "mechanical",
    label: "Mechanical",
    items: [
      { key: "starts", label: "Starts cleanly" },
      { key: "road_tested", label: "Road tested" },
      { key: "gears_smooth", label: "Gears change smoothly" },
      { key: "steering_vibration", label: "Steering vibration" },
      { key: "turning_clunks", label: "Turning clunks/clicks" },
      { key: "braking_ok", label: "Braking OK" },
      { key: "handbrake_incline", label: "Handbrake holds on incline" },
      { key: "bumpy_road_knocks", label: "Bumpy road knocks" },
      { key: "leaks", label: "Fluid leaks" },
      { key: "unusual_engine_noise", label: "Unusual engine noise" },
    ],
  },
  {
    key: "electrical",
    label: "Electrical",
    items: [
      { key: "lights", label: "Headlights / full beam" },
      { key: "indicators", label: "Indicators" },
      { key: "hazards", label: "Hazards" },
      { key: "radio", label: "Radio" },
      { key: "windows", label: "Power windows" },
      { key: "ac_heater", label: "AC / heater" },
      { key: "central_locking", label: "Central locking" },
      { key: "interior_lights", label: "Interior lights" },
      { key: "mirrors", label: "Power mirrors" },
    ],
  },
  {
    key: "body",
    label: "Body",
    items: [
      { key: "exterior", label: "Exterior dents/scratches free" },
      { key: "interior", label: "Interior condition good" },
      { key: "roof", label: "Roof condition good" },
      { key: "dashboard", label: "Dashboard condition good" },
      { key: "seats", label: "Seats condition good" },
      { key: "boot", label: "Boot condition good" },
    ],
  },
  {
    key: "extras",
    label: "Extras",
    items: [
      { key: "jack", label: "Jack present" },
      { key: "wheel_spanner", label: "Wheel spanner present" },
      { key: "spare_key", label: "Spare key present" },
      { key: "reverse_camera", label: "Reverse camera" },
      { key: "mats", label: "Floor mats" },
    ],
  },
];

function AdminInspectionDetail() {
  const { id } = useParams({ from: "/_authenticated/admin/inspections/$id" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [insp, setInsp] = useState<any>(null);
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [tyres, setTyres] = useState({
    make: "",
    size: "",
    condition: "",
    spare_present: false,
    spare_condition: "",
  });
  const [verdict, setVerdict] = useState<string>("");
  const [score, setScore] = useState<string>("");
  const [buyerSummary, setBuyerSummary] = useState("");
  const [internalNotes, setInternalNotes] = useState("");

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("inspections")
      .select("*, cars(id,title)")
      .eq("id", id)
      .maybeSingle();
    setInsp(data);
    const cl = (data?.checklist as any) ?? {};
    setChecklist(cl.items ?? {});
    setTyres(
      cl.tyres ?? { make: "", size: "", condition: "", spare_present: false, spare_condition: "" },
    );
    setVerdict(data?.mechanic_verdict ?? "");
    setScore(data?.overall_condition_score?.toString() ?? "");
    setBuyerSummary(data?.buyer_summary ?? "");
    setInternalNotes(data?.mechanic_notes ?? "");
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, [id]);

  async function save(newStatus?: string) {
    setSaving(true);
    const payload: any = {
      checklist: { items: checklist, tyres },
      mechanic_verdict: verdict || null,
      overall_condition_score: score ? Number(score) : null,
      buyer_summary: buyerSummary || null,
      mechanic_notes: internalNotes || null,
    };
    if (newStatus) payload.status = newStatus;
    const { error } = await supabase.from("inspections").update(payload).eq("id", id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Saved");
    load();
  }

  async function approve() {
    setSaving(true);
    const { error } = await supabase
      .from("inspections")
      .update({
        admin_reviewed: true,
        admin_approved: true,
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (!error && insp?.cars?.id) {
      const carId = insp.cars.id;
      // 1. Update cars.inspection_verified and verification_level
      const { data: cData } = await supabase
        .from("cars")
        .select("verification_level")
        .eq("id", carId)
        .maybeSingle();
      const newLvl = Math.min((cData?.verification_level || 0) + 1, 4);
      await supabase
        .from("cars")
        .update({ inspection_verified: true, verification_level: newLvl })
        .eq("id", carId);

      // 2. Update car_verifications
      await supabase
        .from("car_verifications")
        .update({
          status: "verified",
          updated_at: new Date().toISOString(),
        })
        .eq("car_id", carId);

      // 3. Log event, handle missing table gracefully
      try {
        const ev = await supabase.from("vehicle_events").insert({
          car_id: carId,
          event_type: "INSPECTED",
          description: "Comprehensive 42-point inspection passed and approved.",
        });
        if (ev.error && ev.error.code !== "PGRST205") throw ev.error;
      } catch (e) {
        // Table might not exist yet
      }
    }
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Approved. Buyers will see the Inspection Done badge.");
    load();
  }

  if (loading)
    return (
      <AdminPage>
        <Skeleton className="h-9 w-24 rounded-full" />
        <Skeleton className="h-28 rounded-3xl" />
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-3xl" />
          ))}
        </div>
        <span className="sr-only" role="status">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading inspection
        </span>
      </AdminPage>
    );
  if (!insp)
    return (
      <AdminPage>
        <AdminPanel>
          <QueueEmpty
            icon={<Wrench />}
            title="Not found."
            description="This inspection does not exist or you no longer have access to it."
            action={
              <Button variant="outline" asChild className={TAP}>
                <Link to="/admin/inspections">
                  <ArrowLeft className="h-4 w-4" /> Back to inspections
                </Link>
              </Button>
            }
          />
        </AdminPanel>
      </AdminPage>
    );

  const checkedIn = (key: string) =>
    SECTIONS.find((s) => s.key === key)!.items.filter((it) => checklist[`${key}.${it.key}`]).length;

  return (
    <AdminPage>
      <Button variant="ghost" size="sm" asChild className={`${TAP} -ml-2`}>
        <Link to="/admin/inspections">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
      </Button>

      <PageHeader
        eyebrow="Inspection report"
        title={insp.cars?.title ?? "Inspection"}
        description={`Status: ${String(insp.status).replaceAll("_", " ")}${insp.admin_approved ? " · Approved" : ""}`}
        actions={
          !insp.admin_approved && (
            <Button
              onClick={approve}
              disabled={saving}
              className={`${TAP} bg-success text-success-foreground hover:bg-success/90`}
            >
              <CheckCircle2 className="h-4 w-4" /> Approve
            </Button>
          )
        }
      />

      <div className="flex flex-wrap gap-1.5">
        <StatusPill status={insp.status} />
        {verdict && <StatusPill status={verdict} />}
        {insp.admin_approved && <StatusPill status="approved" label="Approved" />}
      </div>

      <div className="grid min-w-0 gap-4 sm:gap-6 lg:grid-cols-2">
        {SECTIONS.map((s) => (
          <AdminPanel
            key={s.key}
            kicker={`${checkedIn(s.key)}/${s.items.length} checked`}
            title={s.label}
            bodyClassName="grid grid-cols-1 gap-2 p-4 sm:p-5"
          >
            {s.items.map((it) => (
              <label
                key={it.key}
                className="flex min-h-11 cursor-pointer items-center gap-3 rounded-2xl border border-border px-3 py-2 text-sm transition hover:bg-muted/40 has-[[data-state=checked]]:border-emerald-500/40 has-[[data-state=checked]]:bg-emerald-500/5"
              >
                <Checkbox
                  checked={!!checklist[`${s.key}.${it.key}`]}
                  onCheckedChange={(v) =>
                    setChecklist((c) => ({ ...c, [`${s.key}.${it.key}`]: !!v }))
                  }
                />
                {it.label}
              </label>
            ))}
          </AdminPanel>
        ))}
      </div>

      <AdminPanel
        kicker="Wheels"
        title="Tyres"
        bodyClassName="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 sm:p-5"
      >
        <div className="space-y-1.5">
          <Label htmlFor="tyre-make">Tyre make</Label>
          <Input
            id="tyre-make"
            value={tyres.make}
            onChange={(e) => setTyres({ ...tyres, make: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tyre-size">Tyre size</Label>
          <Input
            id="tyre-size"
            value={tyres.size}
            onChange={(e) => setTyres({ ...tyres, size: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tyre-condition">Tyre condition</Label>
          <Input
            id="tyre-condition"
            value={tyres.condition}
            onChange={(e) => setTyres({ ...tyres, condition: e.target.value })}
          />
        </div>
        <label className="flex min-h-11 items-center gap-3 self-end rounded-2xl border border-border px-3 text-sm">
          <Checkbox
            checked={tyres.spare_present}
            onCheckedChange={(v) => setTyres({ ...tyres, spare_present: !!v })}
          />
          Spare tyre present
        </label>
        {tyres.spare_present && (
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="spare-condition">Spare condition</Label>
            <Input
              id="spare-condition"
              value={tyres.spare_condition}
              onChange={(e) => setTyres({ ...tyres, spare_condition: e.target.value })}
            />
          </div>
        )}
      </AdminPanel>

      <AdminPanel kicker="Decision" title="Verdict & summary" bodyClassName="space-y-4 p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Verdict</Label>
            <Select value={verdict} onValueChange={setVerdict}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Choose" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pass">Pass</SelectItem>
                <SelectItem value="conditional_pass">Conditional Pass</SelectItem>
                <SelectItem value="fail">Fail</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="overall-score">Overall score (1–10)</Label>
            <Input
              id="overall-score"
              type="number"
              min="1"
              max="10"
              value={score}
              onChange={(e) => setScore(e.target.value)}
              className="h-11"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="buyer-summary">Buyer-safe summary</Label>
          <Textarea
            id="buyer-summary"
            value={buyerSummary}
            onChange={(e) => setBuyerSummary(e.target.value)}
            placeholder="Short summary shown to buyers."
            rows={3}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="internal-notes">Internal notes (admin only)</Label>
          <Textarea
            id="internal-notes"
            value={internalNotes}
            onChange={(e) => setInternalNotes(e.target.value)}
            rows={3}
          />
        </div>
      </AdminPanel>

      {/* Save bar (sticks to the bottom where the layout allows) */}
      <div className="sticky bottom-3 z-10 flex flex-col-reverse gap-2 rounded-3xl border border-border bg-card/95 p-3 shadow-lg backdrop-blur sm:flex-row sm:justify-end">
        <Button variant="outline" className={TAP} onClick={() => save()} disabled={saving}>
          Save draft
        </Button>
        <Button className={TAP} onClick={() => save("completed")} disabled={saving}>
          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Save & mark completed
        </Button>
      </div>
    </AdminPage>
  );
}

import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/inspections/$id")({
  component: AdminInspectionDetail,
});

const SECTIONS: { key: string; label: string; items: { key: string; label: string }[] }[] = [
  {
    key: "mechanical", label: "Mechanical", items: [
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
    key: "electrical", label: "Electrical", items: [
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
    key: "body", label: "Body", items: [
      { key: "exterior", label: "Exterior dents/scratches free" },
      { key: "interior", label: "Interior condition good" },
      { key: "roof", label: "Roof condition good" },
      { key: "dashboard", label: "Dashboard condition good" },
      { key: "seats", label: "Seats condition good" },
      { key: "boot", label: "Boot condition good" },
    ],
  },
  {
    key: "extras", label: "Extras", items: [
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
  const [tyres, setTyres] = useState({ make: "", size: "", condition: "", spare_present: false, spare_condition: "" });
  const [verdict, setVerdict] = useState<string>("");
  const [score, setScore] = useState<string>("");
  const [buyerSummary, setBuyerSummary] = useState("");
  const [internalNotes, setInternalNotes] = useState("");

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("inspections").select("*, cars(id,title)").eq("id", id).maybeSingle();
    setInsp(data);
    const cl = (data?.checklist as any) ?? {};
    setChecklist(cl.items ?? {});
    setTyres(cl.tyres ?? { make: "", size: "", condition: "", spare_present: false, spare_condition: "" });
    setVerdict(data?.mechanic_verdict ?? "");
    setScore(data?.overall_condition_score?.toString() ?? "");
    setBuyerSummary(data?.buyer_summary ?? "");
    setInternalNotes(data?.mechanic_notes ?? "");
    setLoading(false);
  }
  useEffect(() => { load(); }, [id]);

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
    if (error) { toast.error(error.message); return; }
    toast.success("Saved");
    load();
  }

  async function approve() {
    setSaving(true);
    const { error } = await supabase.from("inspections").update({
      admin_reviewed: true, admin_approved: true, status: "completed", completed_at: new Date().toISOString(),
    }).eq("id", id);
    if (!error && insp?.cars?.id) {
      await supabase.from("cars").update({ inspection_verified: true }).eq("id", insp.cars.id);
    }
    setSaving(false);
    if (error) toast.error(error.message); else toast.success("Approved. Buyers will see the Inspection Done badge.");
    load();
  }

  if (loading) return <div className="p-8 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></div>;
  if (!insp) return <p className="p-8 text-sm">Not found.</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2"><Link to="/admin/inspections"><ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back</Link></Button>
          <h1 className="text-2xl font-bold tracking-tight">{insp.cars?.title ?? "Inspection"}</h1>
          <p className="text-sm text-muted-foreground">Status: {insp.status}{insp.admin_approved && " · Approved"}</p>
        </div>
        {!insp.admin_approved && (
          <Button onClick={approve} disabled={saving} className="bg-success text-success-foreground hover:bg-success/90">
            <CheckCircle2 className="mr-1.5 h-4 w-4" /> Approve
          </Button>
        )}
      </div>

      {SECTIONS.map((s) => (
        <Card key={s.key}>
          <CardHeader><CardTitle className="text-base">{s.label}</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {s.items.map((it) => (
              <label key={it.key} className="flex items-center gap-2 rounded-md border p-2 text-sm">
                <Checkbox
                  checked={!!checklist[`${s.key}.${it.key}`]}
                  onCheckedChange={(v) => setChecklist((c) => ({ ...c, [`${s.key}.${it.key}`]: !!v }))}
                />
                {it.label}
              </label>
            ))}
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader><CardTitle className="text-base">Tyres</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div><Label>Tyre make</Label><Input value={tyres.make} onChange={(e) => setTyres({ ...tyres, make: e.target.value })} /></div>
          <div><Label>Tyre size</Label><Input value={tyres.size} onChange={(e) => setTyres({ ...tyres, size: e.target.value })} /></div>
          <div><Label>Tyre condition</Label><Input value={tyres.condition} onChange={(e) => setTyres({ ...tyres, condition: e.target.value })} /></div>
          <label className="flex items-center gap-2 pt-6 text-sm">
            <Checkbox checked={tyres.spare_present} onCheckedChange={(v) => setTyres({ ...tyres, spare_present: !!v })} /> Spare tyre present
          </label>
          {tyres.spare_present && (
            <div className="sm:col-span-2"><Label>Spare condition</Label><Input value={tyres.spare_condition} onChange={(e) => setTyres({ ...tyres, spare_condition: e.target.value })} /></div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Verdict & summary</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label>Verdict</Label>
              <Select value={verdict} onValueChange={setVerdict}>
                <SelectTrigger><SelectValue placeholder="Choose" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pass">Pass</SelectItem>
                  <SelectItem value="conditional_pass">Conditional Pass</SelectItem>
                  <SelectItem value="fail">Fail</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Overall score (1–10)</Label><Input type="number" min="1" max="10" value={score} onChange={(e) => setScore(e.target.value)} /></div>
          </div>
          <div>
            <Label>Buyer-safe summary</Label>
            <Textarea value={buyerSummary} onChange={(e) => setBuyerSummary(e.target.value)} placeholder="Short summary shown to buyers." rows={3} />
          </div>
          <div>
            <Label>Internal notes (admin only)</Label>
            <Textarea value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} rows={3} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => save()} disabled={saving}>Save draft</Button>
        <Button onClick={() => save("completed")} disabled={saving}>{saving && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />} Save & mark completed</Button>
      </div>
    </div>
  );
}

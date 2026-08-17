import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, RefreshCw, Trash2, Download, ChevronDown, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { getAllMakes, getModelsForMake } from "@/lib/nhtsa";

export const Route = createFileRoute("/_authenticated/admin/makes")({
  head: () => ({ meta: [{ title: "Makes & Models — Admin — AutoConnect" }] }),
  component: AdminMakesPage,
});

type MakeRow = {
  id: string;
  name: string;
  nhtsa_make_id: number | null;
  api_source: string;
};
type ModelRow = {
  id: string;
  name: string;
  make_id: string;
  nhtsa_model_id: number | null;
  api_source: string;
};

function AdminMakesPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [newMake, setNewMake] = useState("");
  const [syncOpen, setSyncOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState("");

  const makesQuery = useQuery({
    queryKey: ["admin-makes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("car_makes")
        .select("id, name, nhtsa_make_id, api_source")
        .order("name");
      if (error) throw error;
      return (data ?? []) as MakeRow[];
    },
  });

  const modelsQuery = useQuery({
    queryKey: ["admin-models"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("car_models")
        .select("id, name, make_id, nhtsa_model_id, api_source")
        .order("name");
      if (error) throw error;
      return (data ?? []) as ModelRow[];
    },
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin-makes"] });
    qc.invalidateQueries({ queryKey: ["admin-models"] });
  };

  async function addMake() {
    const name = newMake.trim();
    if (!name) return;
    const { error } = await supabase.from("car_makes").insert({ name, api_source: "manual" });
    if (error) return toast.error(error.message);
    toast.success("Make added");
    setNewMake("");
    refresh();
  }

  async function deleteMake(m: MakeRow) {
    if (!confirm(`Delete "${m.name}" and all its models?`)) return;
    const { error } = await supabase.from("car_makes").delete().eq("id", m.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    refresh();
  }

  async function deleteModel(m: ModelRow) {
    const { error } = await supabase.from("car_models").delete().eq("id", m.id);
    if (error) return toast.error(error.message);
    toast.success("Model removed");
    refresh();
  }

  async function syncModelsForMake(m: MakeRow) {
    toast.info(`Fetching models for ${m.name}…`);
    try {
      const models = await getModelsForMake(m.name);
      if (models.length === 0) {
        toast.warning("No models returned from NHTSA");
        return;
      }
      const rows = models.map((mod) => ({
        make_id: m.id,
        name: mod.Model_Name,
        nhtsa_model_id: mod.Model_ID,
        api_source: "nhtsa",
      }));
      const { error } = await supabase.from("car_models").upsert(rows, { onConflict: "make_id,name", ignoreDuplicates: true });
      if (error) throw error;
      toast.success(`Synced ${rows.length} models for ${m.name}`);
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Sync failed");
    }
  }

  async function syncAllMakesFromNhtsa() {
    setSyncing(true);
    setSyncProgress("Fetching make list from NHTSA…");
    try {
      const all = await getAllMakes();
      // Only insert top-50 by alphabetical popularity to avoid spamming 10k+ obscure makes.
      const top = all.slice(0, 200);
      setSyncProgress(`Upserting ${top.length} makes…`);
      const rows = top.map((m) => ({
        name: m.Make_Name,
        nhtsa_make_id: m.Make_ID,
        api_source: "nhtsa",
      }));
      const { error } = await supabase.from("car_makes").upsert(rows, { onConflict: "name", ignoreDuplicates: true });
      if (error) throw error;
      setSyncProgress("Done.");
      toast.success(`Synced ${rows.length} makes from NHTSA`);
      refresh();
      setSyncOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  const makes = makesQuery.data ?? [];
  const models = modelsQuery.data ?? [];
  const term = q.trim().toLowerCase();
  const filteredMakes = term ? makes.filter((m) => m.name.toLowerCase().includes(term)) : makes;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Makes &amp; models</h1>
          <p className="text-sm text-muted-foreground">
            Manage the vehicle catalog. Sync from NHTSA vPIC to bulk-import.
          </p>
        </div>
        <Dialog open={syncOpen} onOpenChange={setSyncOpen}>
          <DialogTrigger asChild>
            <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Sync from NHTSA</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Sync makes from NHTSA vPIC</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Imports up to 200 vehicle makes from the NHTSA public API. Existing makes are kept; duplicates are skipped.
            </p>
            {syncProgress && <p className="text-sm">{syncProgress}</p>}
            <DialogFooter>
              <Button variant="outline" onClick={() => setSyncOpen(false)} disabled={syncing}>Cancel</Button>
              <Button onClick={syncAllMakesFromNhtsa} disabled={syncing}>
                {syncing ? "Syncing…" : "Sync now"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <div className="flex flex-wrap gap-3">
        <Input placeholder="Search makes…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />
        <div className="flex gap-2">
          <Input placeholder="New make name" value={newMake} onChange={(e) => setNewMake(e.target.value)} className="w-56" />
          <Button onClick={addMake}><Plus className="mr-1 h-4 w-4" /> Add</Button>
        </div>
      </div>

      <div className="rounded-lg border bg-card shadow-sm">
        {makesQuery.isLoading ? (
          <div className="p-6 text-muted-foreground">Loading…</div>
        ) : filteredMakes.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">No makes.</div>
        ) : (
          <ul className="divide-y">
            {filteredMakes.map((m) => {
              const isOpen = !!expanded[m.id];
              const myModels = models.filter((mod) => mod.make_id === m.id);
              return (
                <li key={m.id}>
                  <div className="flex items-center justify-between gap-3 px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setExpanded((e) => ({ ...e, [m.id]: !e[m.id] }))}
                      className="flex flex-1 items-center gap-2 text-left hover:text-primary"
                    >
                      {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      <span className="font-medium">{m.name}</span>
                      <Badge variant="outline" className="text-xs">{m.api_source}</Badge>
                      <span className="text-xs text-muted-foreground">{myModels.length} models</span>
                    </button>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => syncModelsForMake(m)} title="Sync models from NHTSA">
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteMake(m)} title="Delete make">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  {isOpen && (
                    <div className="border-t bg-muted/30 px-6 py-3">
                      {myModels.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No models yet. Use the sync button to fetch from NHTSA.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {myModels.map((mod) => (
                            <span key={mod.id} className="group inline-flex items-center gap-1 rounded-full border bg-card px-3 py-1 text-xs">
                              {mod.name}
                              <button onClick={() => deleteModel(mod)} className="ml-1 opacity-0 transition-opacity group-hover:opacity-100">
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

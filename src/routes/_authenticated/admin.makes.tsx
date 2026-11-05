import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, RefreshCw, Trash2, Download, ChevronDown, ChevronRight, Tags } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { PageHeader } from "@/components/layout/PageHeader";
import {
  AdminPage,
  AdminPanel,
  AdminToolbar,
  QueueEmpty,
  QueueError,
  QueueSkeleton,
  StatTile,
  TAP,
  TAP_ICON,
} from "@/components/admin/AdminUI";

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
      const { error } = await supabase
        .from("car_models")
        .upsert(rows, { onConflict: "make_id,name", ignoreDuplicates: true });
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
      const { error } = await supabase
        .from("car_makes")
        .upsert(rows, { onConflict: "name", ignoreDuplicates: true });
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
    <AdminPage>
      <PageHeader
        eyebrow="Catalog"
        title="Makes & models"
        description="Manage the vehicle catalog. Sync from NHTSA vPIC to bulk-import."
        actions={
          <Dialog open={syncOpen} onOpenChange={setSyncOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className={TAP}>
                <Download className="h-4 w-4" /> Sync from NHTSA
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Sync makes from NHTSA vPIC</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                Imports up to 200 vehicle makes from the NHTSA public API. Existing makes are kept;
                duplicates are skipped.
              </p>
              {syncProgress && <p className="text-sm">{syncProgress}</p>}
              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  className={TAP}
                  onClick={() => setSyncOpen(false)}
                  disabled={syncing}
                >
                  Cancel
                </Button>
                <Button className={TAP} onClick={syncAllMakesFromNhtsa} disabled={syncing}>
                  {syncing ? "Syncing…" : "Sync now"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Makes" value={makes.length} loading={makesQuery.isLoading} />
        <StatTile label="Models" value={models.length} loading={modelsQuery.isLoading} />
      </div>

      <AdminToolbar
        filters={
          <form
            className="flex min-w-0 flex-col gap-2 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              void addMake();
            }}
          >
            <Input
              aria-label="New make name"
              placeholder="New make name"
              value={newMake}
              onChange={(e) => setNewMake(e.target.value)}
              className="h-11 w-full rounded-full sm:w-56 lg:h-9 lg:pointer-coarse:h-11"
            />
            <Button type="submit" className={TAP}>
              <Plus className="h-4 w-4" /> Add make
            </Button>
          </form>
        }
        search={q}
        onSearch={setQ}
        searchPlaceholder="Search makes…"
      />

      {makesQuery.isError && (
        <QueueError>The catalog could not load. This is not an empty result.</QueueError>
      )}

      <AdminPanel>
        {makesQuery.isLoading ? (
          <QueueSkeleton rows={6} />
        ) : filteredMakes.length === 0 ? (
          <QueueEmpty
            icon={<Tags />}
            title="No makes"
            description={
              term
                ? "No makes match your search."
                : "Add a make above or sync the catalog from NHTSA."
            }
          />
        ) : (
          <ul className="divide-y divide-border">
            {filteredMakes.map((m) => {
              const isOpen = !!expanded[m.id];
              const myModels = models.filter((mod) => mod.make_id === m.id);
              return (
                <li key={m.id}>
                  <div className="flex items-center justify-between gap-2 px-2 py-1 sm:px-4">
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() => setExpanded((e) => ({ ...e, [m.id]: !e[m.id] }))}
                      className="flex min-h-12 min-w-0 flex-1 flex-wrap items-center gap-2 rounded-2xl px-2 text-left transition hover:text-primary"
                    >
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4 shrink-0" />
                      ) : (
                        <ChevronRight className="h-4 w-4 shrink-0" />
                      )}
                      <span className="font-semibold">{m.name}</span>
                      <Badge variant="outline" className="rounded-full text-[10px] sm:text-xs">
                        {m.api_source}
                      </Badge>
                      <span className="whitespace-nowrap text-xs text-muted-foreground">
                        {myModels.length} models
                      </span>
                    </button>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className={TAP_ICON}
                        onClick={() => syncModelsForMake(m)}
                        title="Sync models from NHTSA"
                        aria-label={`Sync models for ${m.name} from NHTSA`}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className={TAP_ICON}
                        onClick={() => deleteMake(m)}
                        title="Delete make"
                        aria-label={`Delete ${m.name}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  {isOpen && (
                    <div className="border-t border-border bg-muted/30 px-4 py-4 sm:px-6">
                      {myModels.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No models yet. Use the sync button to fetch from NHTSA.
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {myModels.map((mod) => (
                            <span
                              key={mod.id}
                              className="group inline-flex items-center gap-1 rounded-full border border-border bg-card py-1 pl-3 pr-1 text-xs"
                            >
                              {mod.name}
                              <button
                                type="button"
                                onClick={() => deleteModel(mod)}
                                aria-label={`Remove ${mod.name}`}
                                title="Remove model"
                                className="grid h-7 w-7 place-items-center rounded-full opacity-70 transition hover:bg-destructive/10 focus-visible:opacity-100 group-hover:opacity-100 lg:opacity-0 lg:pointer-coarse:opacity-70"
                              >
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
      </AdminPanel>
    </AdminPage>
  );
}

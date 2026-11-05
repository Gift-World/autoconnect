import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { KINDS, type PostKind, uploadCommunityImage } from "./CommunityData";

const MAX_PHOTOS = 4;
const MAX_BYTES = 8 * 1024 * 1024;

/** Create a community post. Only rendered for signed-in members. */
export function PostComposer({ userId, onDone }: { userId: string; onDone: () => void }) {
  const qc = useQueryClient();
  const [kind, setKind] = useState<PostKind>("question");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [location, setLocation] = useState("");
  const [eventAt, setEventAt] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  const create = useMutation({
    mutationFn: async () => {
      const image_urls: string[] = [];
      for (const file of files) image_urls.push(await uploadCommunityImage(userId, file));
      const { error } = await supabase.from("community_posts").insert({
        author_id: userId,
        kind,
        title: title.trim(),
        body: body.trim(),
        image_urls,
        car_make: make.trim() || null,
        car_model: model.trim() || null,
        car_year: year ? Number(year) : null,
        location: location.trim() || null,
        event_at: kind === "meetup" && eventAt ? new Date(eventAt).toISOString() : null,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Posted to the community");
      qc.invalidateQueries({ queryKey: ["community-posts"] });
      onDone();
    },
    onError: (error: Error) => toast.error(error.message || "Could not post. Please try again."),
  });

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const next = [...files];
    for (const file of Array.from(list)) {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not an image.`);
        continue;
      }
      if (file.size > MAX_BYTES) {
        toast.error(`${file.name} is over 8 MB.`);
        continue;
      }
      if (next.length < MAX_PHOTOS) next.push(file);
    }
    setFiles(next);
  };

  const previews = useMemo(() => files.map((file) => URL.createObjectURL(file)), [files]);
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  const valid = title.trim().length >= 3 && (kind !== "meetup" || eventAt);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (valid) create.mutate();
      }}
      className="space-y-5"
    >
      <fieldset>
        <legend className="mb-2 text-sm font-bold">What are you sharing?</legend>
        <div className="flex flex-wrap gap-2">
          {KINDS.filter((k) => k.id !== "all").map((k) => (
            <button
              key={k.id}
              type="button"
              onClick={() => setKind(k.id as PostKind)}
              aria-pressed={kind === k.id}
              className={`min-h-11 rounded-full border px-4 text-sm font-semibold transition ${
                kind === k.id
                  ? "border-ac-ink bg-ac-ink text-white dark:border-ac-accent dark:bg-ac-accent dark:text-ac-ink"
                  : "border-border hover:border-foreground/40"
              }`}
            >
              {k.label}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="space-y-2">
        <Label htmlFor="community-title">Title</Label>
        <Input
          id="community-title"
          value={title}
          maxLength={140}
          onChange={(event) => setTitle(event.target.value)}
          placeholder={kind === "question" ? "Why does my Fielder idle rough when cold?" : "Give it a short title"}
          className="h-12"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="community-body">Details</Label>
        <Textarea
          id="community-body"
          value={body}
          maxLength={5000}
          onChange={(event) => setBody(event.target.value)}
          rows={5}
          placeholder="Share what happened, what you've tried, costs, tips…"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="community-make">Make</Label>
          <Input id="community-make" value={make} onChange={(e) => setMake(e.target.value)} placeholder="Toyota" className="h-11" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="community-model">Model</Label>
          <Input id="community-model" value={model} onChange={(e) => setModel(e.target.value)} placeholder="Land Cruiser Prado" className="h-11" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="community-year">Year</Label>
          <Input
            id="community-year"
            inputMode="numeric"
            value={year}
            onChange={(e) => setYear(e.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder="2018"
            className="h-11"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="community-location">Location</Label>
          <Input id="community-location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Nairobi" className="h-11" />
        </div>
        {kind === "meetup" && (
          <div className="space-y-2">
            <Label htmlFor="community-event">Date and time</Label>
            <Input id="community-event" type="datetime-local" value={eventAt} onChange={(e) => setEventAt(e.target.value)} className="h-11" />
          </div>
        )}
      </div>

      <div>
        <p className="mb-2 text-sm font-bold">Photos</p>
        <div className="grid grid-cols-4 gap-2">
          {files.map((file, index) => (
            <div key={`${file.name}-${index}`} className="relative aspect-square overflow-hidden rounded-xl bg-muted">
              <img src={previews[index]} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => setFiles(files.filter((_, i) => i !== index))}
                aria-label={`Remove ${file.name}`}
                className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-black/60 text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          {files.length < MAX_PHOTOS && (
            <label className="grid aspect-square cursor-pointer place-items-center rounded-xl border-2 border-dashed border-border text-muted-foreground transition hover:border-foreground/40 hover:text-foreground">
              <ImagePlus className="h-6 w-6" />
              <span className="sr-only">Add photos</span>
              <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => addFiles(e.target.files)} />
            </label>
          )}
        </div>
      </div>

      <Button type="submit" disabled={!valid || create.isPending} className="h-12 w-full rounded-full bg-ac-accent text-base font-extrabold text-ac-ink hover:bg-ac-accent/90">
        {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Post to the community
      </Button>
    </form>
  );
}

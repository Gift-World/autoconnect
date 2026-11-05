import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";

export type PostKind = "post" | "question" | "build" | "meetup" | "review";

export type CommunityPost = {
  id: string;
  author_id: string;
  author_name: string | null;
  author_avatar_url: string | null;
  kind: PostKind;
  title: string;
  body: string;
  image_urls: string[];
  car_make: string | null;
  car_model: string | null;
  car_year: number | null;
  location: string | null;
  event_at: string | null;
  like_count: number;
  comment_count: number;
  created_at: string;
};

export type CommunityComment = {
  id: string;
  post_id: string;
  author_id: string;
  author_name: string | null;
  author_avatar_url: string | null;
  body: string;
  created_at: string;
};

export const KINDS: { id: PostKind | "all"; label: string; blurb: string }[] = [
  { id: "all", label: "Everything", blurb: "The latest from car people near you." },
  { id: "question", label: "Questions", blurb: "Ask owners who have been there." },
  { id: "build", label: "Builds", blurb: "Restorations, upgrades and garage projects." },
  { id: "review", label: "Owner reviews", blurb: "Real ownership, real costs." },
  { id: "meetup", label: "Meetups", blurb: "Drives, shows and track days." },
  { id: "post", label: "Stories", blurb: "Road trips, buying stories and everything else." },
];

export const KIND_LABEL: Record<PostKind, string> = {
  post: "Story",
  question: "Question",
  build: "Build",
  review: "Owner review",
  meetup: "Meetup",
};

/** Postgres "relation does not exist" from PostgREST — the migration has not been run yet. */
export class CommunityNotReady extends Error {}

function guard(error: { code?: string; message: string } | null) {
  if (!error) return;
  if (error.code === "PGRST205" || error.code === "42P01") throw new CommunityNotReady(error.message);
  throw new Error(error.message);
}

export async function fetchPosts(kind: PostKind | "all"): Promise<CommunityPost[]> {
  if (!isSupabaseConfigured) throw new CommunityNotReady("Supabase is not configured");
  let query = supabase
    .from("community_posts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(60);
  if (kind !== "all") query = query.eq("kind", kind);
  const { data, error } = await query;
  guard(error);
  return (data ?? []) as CommunityPost[];
}

export async function fetchComments(postId: string): Promise<CommunityComment[]> {
  const { data, error } = await supabase
    .from("community_comments")
    .select("*")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });
  guard(error);
  return (data ?? []) as CommunityComment[];
}

export async function fetchMyLikes(userId: string): Promise<Set<string>> {
  const { data, error } = await supabase.from("community_likes").select("post_id").eq("user_id", userId);
  guard(error);
  return new Set((data ?? []).map((row: { post_id: string }) => row.post_id));
}

export async function uploadCommunityImage(userId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("community-images").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
  });
  if (error) throw new Error(error.message);
  return supabase.storage.from("community-images").getPublicUrl(path).data.publicUrl;
}

export function carLabel(post: Pick<CommunityPost, "car_make" | "car_model" | "car_year">) {
  return [post.car_year, post.car_make, post.car_model].filter(Boolean).join(" ");
}

export function timeAgo(iso: string) {
  const seconds = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  const steps: [number, string][] = [
    [60, "s"],
    [60, "m"],
    [24, "h"],
    [7, "d"],
    [4.35, "w"],
    [12, "mo"],
  ];
  let value = seconds;
  for (const [size, unit] of steps) {
    if (value < size) return `${Math.floor(value)}${unit} ago`;
    value /= size;
  }
  return `${Math.floor(value)}y ago`;
}

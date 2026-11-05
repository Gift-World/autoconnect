import { useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, MessageCircleQuestion, PenLine, Sparkles, Users, Wrench } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { RevealText } from "@/components/motion/RevealText";
import { PostCard } from "@/components/community/PostCard";
import { PostComposer } from "@/components/community/PostComposer";
import { PostThread } from "@/components/community/PostThread";
import {
  CommunityNotReady,
  fetchMyLikes,
  fetchPosts,
  KINDS,
  type CommunityPost,
  type PostKind,
} from "@/components/community/CommunityData";

export const Route = createFileRoute("/community")({
  head: () => ({
    meta: [
      { title: "Car Community — AutoConnect" },
      {
        name: "description",
        content: "Ask owners, share builds, read real ownership reviews and join drives and meetups with car people near you.",
      },
      { property: "og:title", content: "Car Community — AutoConnect" },
    ],
  }),
  component: CommunityPage,
});

const PILLARS = [
  { Icon: MessageCircleQuestion, title: "Ask owners", body: "Real answers from people who drive the same car — plus an instant AI first answer." },
  { Icon: Wrench, title: "Share builds", body: "Restorations, upgrades and fixes, with photos and costs." },
  { Icon: CalendarDays, title: "Meet up", body: "Drives, shows and track days near you." },
];

function CommunityPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [kind, setKind] = useState<PostKind | "all">("all");
  const [open, setOpen] = useState<CommunityPost | null>(null);
  const [composing, setComposing] = useState(false);

  const posts = useQuery({
    queryKey: ["community-posts", kind],
    queryFn: () => fetchPosts(kind),
    retry: (count, error) => !(error instanceof CommunityNotReady) && count < 2,
  });

  const likes = useQuery({
    queryKey: ["community-likes", user?.id],
    enabled: !!user && !posts.error,
    queryFn: () => fetchMyLikes(user!.id),
  });

  const like = useMutation({
    mutationFn: async (post: CommunityPost) => {
      if (!user) throw new Error("auth");
      const liked = likes.data?.has(post.id);
      const { error } = liked
        ? await supabase.from("community_likes").delete().eq("post_id", post.id).eq("user_id", user.id)
        : await supabase.from("community_likes").insert({ post_id: post.id, user_id: user.id });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["community-likes"] });
      qc.invalidateQueries({ queryKey: ["community-posts"] });
    },
    onError: (error: Error) => {
      if (error.message === "auth") toast("Log in to like posts", { action: { label: "Log in", onClick: () => navigate({ to: "/login" }) } });
      else toast.error("Could not update your like.");
    },
  });

  const active = KINDS.find((k) => k.id === kind)!;
  const notReady = posts.error instanceof CommunityNotReady;
  const stats = useMemo(() => {
    const list = posts.data ?? [];
    return {
      posts: list.length,
      members: new Set(list.map((p) => p.author_id)).size,
      replies: list.reduce((sum, p) => sum + p.comment_count, 0),
    };
  }, [posts.data]);

  const startPost = () => {
    if (!user) {
      toast("Join the community to post", { action: { label: "Log in", onClick: () => navigate({ to: "/login" }) } });
      return;
    }
    setComposing(true);
  };

  return (
    <div className="bg-background text-foreground">
      {/* Hero */}
      <section className="px-3 pt-3 sm:px-5 sm:pt-5">
        <div className="relative isolate overflow-hidden rounded-[28px] bg-ac-ink text-white sm:rounded-[36px]">
          <img
            src="/images/providers/nairobi-garage-workshop.jpg"
            alt=""
            className="absolute inset-0 -z-10 h-full w-full object-cover opacity-40"
          />
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(100deg,rgba(11,19,36,.95),rgba(11,19,36,.55))]" />
          <div className="grid gap-10 p-6 sm:p-10 lg:grid-cols-[1.3fr_.7fr] lg:items-end lg:p-14">
            <div>
              <p className="brand-kicker text-ac-accent">AutoConnect community</p>
              <h1 className="font-brand mt-5 text-5xl sm:text-7xl">
                Where car people <span className="text-ac-accent">meet.</span>
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-white/75 sm:text-lg">
                Ask owners, share builds, read real ownership reviews and join drives near you.
              </p>
              <button
                type="button"
                onClick={startPost}
                className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-full bg-ac-accent px-6 text-sm font-extrabold text-ac-ink transition hover:brightness-110"
              >
                <PenLine className="h-4 w-4" /> Start a post
              </button>
            </div>
            <dl className="grid grid-cols-3 gap-3">
              {[
                ["Posts", stats.posts],
                ["Members", stats.members],
                ["Replies", stats.replies],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/[.06] p-4 backdrop-blur">
                  <dt className="text-xs font-semibold text-white/60">{label}</dt>
                  <dd className="font-brand mt-1 text-3xl sm:text-4xl">{posts.isLoading ? "–" : value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* Feed */}
      <section className="mx-auto max-w-[1360px] px-4 py-10 sm:px-6 sm:py-14">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-brand text-3xl sm:text-5xl">{active.label}</h2>
            <p className="mt-2 text-muted-foreground">{active.blurb}</p>
          </div>
          <button
            type="button"
            onClick={startPost}
            className="inline-flex min-h-11 w-fit items-center gap-2 rounded-full bg-ac-ink px-5 text-sm font-bold text-white dark:bg-white dark:text-ac-ink"
          >
            <PenLine className="h-4 w-4" /> Post
          </button>
        </div>
        <div className="-mx-4 mt-6 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:px-0" role="tablist" aria-label="Filter posts">
          {KINDS.map((k) => (
            <button
              key={k.id}
              type="button"
              role="tab"
              aria-selected={kind === k.id}
              onClick={() => setKind(k.id)}
              className={`min-h-11 shrink-0 rounded-full border px-4 text-sm font-semibold transition ${
                kind === k.id ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground/40"
              }`}
            >
              {k.label}
            </button>
          ))}
        </div>

        <div className="mt-8">
          {posts.isLoading && (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-72 animate-pulse rounded-3xl bg-muted" />
              ))}
            </div>
          )}

          {notReady && (
            <div className="rounded-3xl border border-dashed border-border p-8 text-center sm:p-12">
              <Users className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-4 text-lg font-extrabold">The community is almost ready.</p>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                The community tables haven't been set up on this environment yet. Once they are, posts appear here.
              </p>
            </div>
          )}

          {posts.error && !notReady && (
            <div className="rounded-3xl border border-border p-8 text-center">
              <p className="font-bold">We couldn't load the community right now.</p>
              <button type="button" onClick={() => posts.refetch()} className="mt-4 min-h-11 rounded-full bg-foreground px-5 text-sm font-bold text-background">
                Try again
              </button>
            </div>
          )}

          {posts.data && posts.data.length === 0 && (
            <div className="rounded-3xl bg-ac-cream p-8 text-ac-ink sm:p-12">
              <Sparkles className="h-7 w-7" />
              <p className="font-brand mt-4 text-3xl">Be the first voice here.</p>
              <p className="mt-2 max-w-md text-ac-ink/75">Ask a question about your car, show off a build, or plan a weekend drive.</p>
              <button type="button" onClick={startPost} className="mt-6 min-h-12 rounded-full bg-ac-ink px-6 text-sm font-extrabold text-white">
                Start a post
              </button>
            </div>
          )}

          {posts.data && posts.data.length > 0 && (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {posts.data.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  liked={!!likes.data?.has(post.id)}
                  onOpen={() => setOpen(post)}
                  onLike={() => like.mutate(post)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Why */}
      <section className="px-4 pb-16 sm:px-6 sm:pb-24">
        <div className="mx-auto max-w-[1360px]">
          <RevealText
            className="font-brand max-w-4xl text-3xl leading-[1.08] sm:text-5xl"
            text="The best advice about a car comes from the people who already own one. This is where they share it."
          />
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {PILLARS.map(({ Icon, title, body }) => (
              <div key={title} className="rounded-3xl border border-border bg-card p-6">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-ac-accent text-ac-ink">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 text-xl font-extrabold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-sm text-muted-foreground">
            Looking for a car instead? <Link to="/cars" className="font-bold text-foreground underline underline-offset-4">Browse vehicles</Link>
          </p>
        </div>
      </section>


      <Sheet open={!!open} onOpenChange={(next) => !next && setOpen(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader className="sr-only">
            <SheetTitle>{open?.title ?? "Post"}</SheetTitle>
          </SheetHeader>
          {open && <PostThread post={open} userId={user?.id ?? null} />}
        </SheetContent>
      </Sheet>

      <Sheet open={composing} onOpenChange={setComposing}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle className="font-brand text-3xl">New post</SheetTitle>
          </SheetHeader>
          {user && (
            <div className="mt-6">
              <PostComposer userId={user.id} onDone={() => setComposing(false)} />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { aiCommunityAssist, type CommunityAiAnswer } from "@/lib/community.functions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar } from "./PostCard";
import { carLabel, fetchComments, KIND_LABEL, timeAgo, type CommunityPost } from "./CommunityData";

/** Full post, its photos, replies, and the AI helper. Lives inside a sheet. */
export function PostThread({ post, userId }: { post: CommunityPost; userId: string | null }) {
  const qc = useQueryClient();
  const [reply, setReply] = useState("");
  const [ai, setAi] = useState<CommunityAiAnswer | null>(null);
  const assist = useServerFn(aiCommunityAssist);
  const car = carLabel(post);

  const comments = useQuery({ queryKey: ["community-comments", post.id], queryFn: () => fetchComments(post.id) });

  const send = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("community_comments")
        .insert({ post_id: post.id, author_id: userId, body: reply.trim() });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      setReply("");
      qc.invalidateQueries({ queryKey: ["community-comments", post.id] });
      qc.invalidateQueries({ queryKey: ["community-posts"] });
    },
    onError: (error: Error) => toast.error(error.message || "Could not send your reply."),
  });

  const mode = post.kind === "question" && (comments.data?.length ?? 0) < 3 ? "answer" : "summarise";
  const askAi = useMutation({
    mutationFn: () =>
      assist({
        data: {
          mode,
          title: post.title,
          body: post.body,
          car: car || undefined,
          comments: (comments.data ?? []).map((c) => c.body).slice(-40),
        },
      }),
    onSuccess: setAi,
    onError: (error: Error) => toast.error(error.message || "AI is unavailable right now."),
  });

  const canUseAi = post.kind === "question" || (comments.data?.length ?? 0) >= 3;

  return (
    <div className="space-y-6">
      <header>
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-muted-foreground">
          <span className="rounded-full bg-muted px-2.5 py-1 font-extrabold text-foreground">{KIND_LABEL[post.kind]}</span>
          {car && <span>{car}</span>}
          {post.location && <span>· {post.location}</span>}
        </div>
        <h2 className="font-brand mt-3 text-3xl sm:text-4xl">{post.title}</h2>
        <div className="mt-3 flex items-center gap-2 text-sm">
          <Avatar name={post.author_name} url={post.author_avatar_url} size={32} />
          <span className="font-semibold">{post.author_name || "AutoConnect member"}</span>
          <span className="text-muted-foreground">· {timeAgo(post.created_at)}</span>
        </div>
      </header>

      {post.image_urls.length > 0 && (
        <div className={`grid gap-2 ${post.image_urls.length > 1 ? "grid-cols-2" : ""}`}>
          {post.image_urls.map((url) => (
            <div key={url} className="aspect-[4/3] overflow-hidden rounded-2xl bg-muted">
              <img src={url} alt="" loading="lazy" className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
      )}

      {post.body && <p className="whitespace-pre-line text-base leading-7">{post.body}</p>}

      {canUseAi && (
        <section className="rounded-3xl bg-ac-ink p-5 text-white">
          <div className="flex items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-sm font-extrabold">
              <Sparkles className="h-4 w-4 text-ac-accent" />
              {mode === "answer" ? "AI first answer" : "AI thread summary"}
            </p>
            {!ai && (
              <Button
                size="sm"
                onClick={() => askAi.mutate()}
                disabled={askAi.isPending}
                className="min-h-10 rounded-full bg-ac-accent font-bold text-ac-ink hover:bg-ac-accent/90"
              >
                {askAi.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {mode === "answer" ? "Get an answer" : "Summarise"}
              </Button>
            )}
          </div>
          {ai ? (
            <div className="mt-4 space-y-3 text-sm leading-6 text-white/85">
              <p>{ai.answer}</p>
              {ai.checks.length > 0 && (
                <ul className="space-y-1.5">
                  {ai.checks.map((check) => (
                    <li key={check} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ac-accent" />
                      {check}
                    </li>
                  ))}
                </ul>
              )}
              {ai.askAProWhen && <p className="text-white/70">See a mechanic if: {ai.askAProWhen}</p>}
              <p className="text-xs text-white/50">AI guidance, not a diagnosis. Check with a qualified mechanic before acting.</p>
            </div>
          ) : (
            <p className="mt-2 text-sm text-white/60">
              {mode === "answer"
                ? "Get an instant first answer while owners reply."
                : "Catch up on the thread in a few lines."}
            </p>
          )}
        </section>
      )}

      <section aria-labelledby="replies-heading">
        <h3 id="replies-heading" className="text-lg font-extrabold">
          Replies {comments.data ? `(${comments.data.length})` : ""}
        </h3>
        <div className="mt-4 space-y-4">
          {comments.isLoading && <div className="h-16 animate-pulse rounded-2xl bg-muted" />}
          {comments.data?.length === 0 && <p className="text-sm text-muted-foreground">No replies yet. Be the first to help.</p>}
          {comments.data?.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <Avatar name={comment.author_name} url={comment.author_avatar_url} size={32} />
              <div className="min-w-0 flex-1 rounded-2xl bg-muted px-4 py-3">
                <p className="text-xs font-semibold">
                  {comment.author_name || "AutoConnect member"}
                  <span className="font-normal text-muted-foreground"> · {timeAgo(comment.created_at)}</span>
                </p>
                <p className="mt-1 whitespace-pre-line text-sm leading-6">{comment.body}</p>
              </div>
            </div>
          ))}
        </div>

        {userId ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (reply.trim()) send.mutate();
            }}
            className="mt-5 flex items-end gap-2"
          >
            <Textarea
              value={reply}
              onChange={(event) => setReply(event.target.value)}
              maxLength={2000}
              rows={2}
              placeholder="Write a helpful reply…"
              aria-label="Your reply"
              className="min-h-12 flex-1"
            />
            <Button type="submit" size="icon" disabled={!reply.trim() || send.isPending} aria-label="Send reply" className="h-12 w-12 shrink-0 rounded-full">
              {send.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        ) : (
          <Link to="/login" className="mt-5 inline-flex min-h-11 items-center rounded-full bg-ac-ink px-5 text-sm font-bold text-white">
            Log in to reply
          </Link>
        )}
      </section>
    </div>
  );
}

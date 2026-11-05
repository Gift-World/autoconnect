import { CalendarDays, Heart, MapPin, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { carLabel, KIND_LABEL, timeAgo, type CommunityPost } from "./CommunityData";

const KIND_TONE: Record<CommunityPost["kind"], string> = {
  question: "bg-ac-powder text-ac-ink",
  build: "bg-ac-apricot text-ac-ink",
  review: "bg-ac-cream text-ac-ink",
  meetup: "bg-ac-accent text-ac-ink",
  post: "bg-ac-stone text-ac-ink",
};

export function Avatar({ name, url, size = 36 }: { name: string | null; url: string | null; size?: number }) {
  const initials = (name || "AutoConnect member")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return url ? (
    <img src={url} alt="" width={size} height={size} className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />
  ) : (
    <span
      aria-hidden
      className="grid shrink-0 place-items-center rounded-full bg-ac-ink text-[11px] font-bold text-ac-accent"
      style={{ width: size, height: size }}
    >
      {initials}
    </span>
  );
}

export function PostCard({
  post,
  liked,
  onOpen,
  onLike,
}: {
  post: CommunityPost;
  liked: boolean;
  onOpen: () => void;
  onLike: () => void;
}) {
  const car = carLabel(post);
  const cover = post.image_urls[0];

  return (
    <article className="group overflow-hidden rounded-3xl border border-border bg-card transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(11,19,36,.12)]">
      <button type="button" onClick={onOpen} className="block w-full text-left" aria-label={`Open ${post.title}`}>
        {cover && (
          <div className="relative aspect-[4/3] overflow-hidden bg-muted">
            <img src={cover} alt="" loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
            {post.image_urls.length > 1 && (
              <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-bold text-white">
                +{post.image_urls.length - 1}
              </span>
            )}
          </div>
        )}
        <div className="p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-extrabold", KIND_TONE[post.kind])}>{KIND_LABEL[post.kind]}</span>
            {car && <span className="truncate text-xs font-semibold text-muted-foreground">{car}</span>}
          </div>
          <h3 className="mt-3 text-lg font-extrabold leading-snug tracking-tight">{post.title}</h3>
          {post.body && <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">{post.body}</p>}
          {(post.location || post.event_at) && (
            <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold text-muted-foreground">
              {post.event_at && (
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {new Date(post.event_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                </span>
              )}
              {post.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {post.location}
                </span>
              )}
            </div>
          )}
        </div>
      </button>
      <footer className="flex items-center justify-between gap-3 border-t border-border px-5 py-3">
        <span className="flex min-w-0 items-center gap-2">
          <Avatar name={post.author_name} url={post.author_avatar_url} size={28} />
          <span className="truncate text-xs font-semibold">{post.author_name || "AutoConnect member"}</span>
          <span className="shrink-0 text-xs text-muted-foreground">· {timeAgo(post.created_at)}</span>
        </span>
        <span className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onLike}
            aria-pressed={liked}
            aria-label={liked ? "Unlike" : "Like"}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-bold transition hover:bg-muted"
          >
            <Heart className={cn("h-4 w-4", liked && "fill-teal-500 text-teal-500")} />
            {post.like_count}
          </button>
          <button
            type="button"
            onClick={onOpen}
            aria-label="Comments"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-bold transition hover:bg-muted"
          >
            <MessageCircle className="h-4 w-4" />
            {post.comment_count}
          </button>
        </span>
      </footer>
    </article>
  );
}

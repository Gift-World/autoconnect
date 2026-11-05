import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Save-only favourites helper (same `favorites` table and query keys as FavoriteButton).
 * Used by flows that "save" rather than toggle, such as swipe mode.
 * Resolves to "saved" | "already" | "auth" (not signed in).
 */
export function useSaveFavorite() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: async (carId: string): Promise<"saved" | "already"> => {
      if (!user) throw new Error("auth");
      const { data: existing, error: readError } = await supabase
        .from("favorites")
        .select("id")
        .eq("car_id", carId)
        .eq("buyer_id", user.id)
        .maybeSingle();
      if (readError) throw readError;
      if (existing) return "already";
      const { error } = await supabase.from("favorites").insert({ car_id: carId, buyer_id: user.id });
      if (error) throw error;
      return "saved";
    },
    onSuccess: (_result, carId) => {
      qc.invalidateQueries({ queryKey: ["favorite", carId] });
      qc.invalidateQueries({ queryKey: ["favorites"] });
    },
  });

  const save = async (carId: string): Promise<"saved" | "already" | "auth"> => {
    if (!user) return "auth";
    return mutation.mutateAsync(carId);
  };

  return {
    save,
    isSignedIn: !!user,
    goToLogin: () => navigate({ to: "/login" }),
  };
}

export function FavoriteButton({
  carId,
  variant = "icon",
  className,
}: {
  carId: string;
  variant?: "icon" | "full";
  className?: string;
}) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data: isFav } = useQuery({
    enabled: !!user,
    queryKey: ["favorite", carId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("favorites")
        .select("id")
        .eq("car_id", carId)
        .eq("buyer_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
  });

  const toggle = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("auth");
      if (isFav) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("car_id", carId)
          .eq("buyer_id", user.id);
        if (error) throw error;
        return false;
      }
      const { error } = await supabase
        .from("favorites")
        .insert({ car_id: carId, buyer_id: user.id });
      if (error) throw error;
      return true;
    },
    onSuccess: (now) => {
      qc.invalidateQueries({ queryKey: ["favorite", carId] });
      qc.invalidateQueries({ queryKey: ["favorites"] });
      toast.success(now ? "Saved to favorites" : "Removed from favorites");
    },
    onError: (e: Error) => {
      if (e.message === "auth") return;
      toast.error(e.message);
    },
  });

  const handle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    toggle.mutate();
  };

  if (variant === "full") {
    return (
      <Button
        type="button"
        variant="outline"
        onClick={handle}
        className={cn("h-11 w-full justify-center rounded-full", className)}
      >
        <Heart className={cn("mr-2 h-4 w-4", isFav && "fill-destructive text-destructive")} />
        {isFav ? "Saved" : "Save to favorites"}
      </Button>
    );
  }

  return (
    <button
      type="button"
      aria-label={isFav ? "Remove favorite" : "Add favorite"}
      aria-pressed={!!isFav}
      onClick={handle}
      className={cn(
        "grid h-11 w-11 place-items-center rounded-full bg-white/95 text-ac-ink shadow-sm transition hover:scale-105 active:scale-95",
        className,
        isFav && "border-transparent bg-ac-accent text-ac-ink",
      )}
    >
      <Heart className={cn("h-[18px] w-[18px]", isFav && "fill-current")} />
    </button>
  );
}

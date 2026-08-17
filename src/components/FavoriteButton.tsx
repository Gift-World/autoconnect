import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
        className={cn("w-full justify-center", className)}
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
      onClick={handle}
      className={cn(
        "grid h-9 w-9 place-items-center rounded-full bg-white/95 text-foreground shadow-sm transition hover:scale-105",
        className,
      )}
    >
      <Heart className={cn("h-4 w-4", isFav && "fill-destructive text-destructive")} />
    </button>
  );
}

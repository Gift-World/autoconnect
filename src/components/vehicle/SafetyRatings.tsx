import React, { useEffect, useState } from "react";
import { Shield, ShieldAlert, Star } from "lucide-react";
import { getSafetyVehicleId, getSafetyRatings, type NhtsaSafetyRating } from "@/lib/nhtsa-safety";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface SafetyRatingsProps {
  make: string;
  model: string;
  year: number;
}

export function SafetyRatings({ make, model, year }: SafetyRatingsProps) {
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState<NhtsaSafetyRating | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchRatings = async () => {
      setLoading(true);
      try {
        const vehicleId = await getSafetyVehicleId(year, make, model);
        if (!isMounted) return;

        if (vehicleId) {
          const data = await getSafetyRatings(vehicleId);
          if (isMounted) setRating(data);
        }
      } catch (error) {
        console.error("Failed to fetch safety ratings", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchRatings();

    return () => {
      isMounted = false;
    };
  }, [make, model, year]);

  if (loading) {
    return (
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" /> Safety Ratings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Gracefully hide if no safety data found (e.g. for JDM vehicles not tested by NHTSA)
  if (!rating || rating.OverallRating === "Not Rated") {
    return null; 
  }

  const renderStars = (ratingStr: string) => {
    const stars = parseInt(ratingStr, 10);
    if (isNaN(stars)) return <span className="text-muted-foreground text-xs">{ratingStr}</span>;
    
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${i <= stars ? "text-yellow-400 fill-yellow-400" : "text-muted/30"}`}
          />
        ))}
      </div>
    );
  };

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base flex items-center gap-2">
          <Shield className="h-4 w-4 text-green-500" /> NHTSA Safety Ratings
        </CardTitle>
        <Badge variant="outline" className="text-[10px]">US Govt Data</Badge>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
          <div className="flex flex-col items-center justify-center p-4 bg-muted/50 rounded-2xl min-w-[140px]">
            <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Overall</span>
            {renderStars(rating.OverallRating)}
            <span className="text-[10px] text-muted-foreground mt-2">{rating.OverallRating}/5 Stars</span>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-3 w-full">
            <div className="flex flex-col justify-between py-1 border-b border-border/50">
              <span className="text-xs text-muted-foreground">Front Crash</span>
              <div className="mt-1">{renderStars(rating.OverallFrontCrashRating)}</div>
            </div>
            <div className="flex flex-col justify-between py-1 border-b border-border/50">
              <span className="text-xs text-muted-foreground">Side Crash</span>
              <div className="mt-1">{renderStars(rating.OverallSideCrashRating)}</div>
            </div>
            <div className="flex flex-col justify-between py-1">
              <span className="text-xs text-muted-foreground">Rollover</span>
              <div className="mt-1">{renderStars(rating.RolloverRating)}</div>
            </div>
            
            {/* Recalls/Complaints */}
            {(rating.RecallsCount > 0 || rating.ComplaintsCount > 0) && (
              <div className="flex flex-col justify-between py-1">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <ShieldAlert className="h-3 w-3 text-amber-500" /> Notices
                </span>
                <span className="text-xs mt-1 font-medium">
                  {rating.RecallsCount} Recalls, {rating.ComplaintsCount} Complaints
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

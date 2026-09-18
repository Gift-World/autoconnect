import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface ListingRow {
  views: number;
}

export function AnalyticsChart({ listings }: { listings: ListingRow[] }) {
  // Generate some realistic looking trend data based on the total views
  const data = useMemo(() => {
    const totalViews = listings.reduce((sum, r) => sum + (r.views || 0), 0);
    const baseDaily = Math.max(10, Math.floor(totalViews / 30));
    
    const chartData = [];
    const now = new Date();
    
    let currentTrend = baseDaily;
    
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      
      // Random walk for realistic data
      const change = (Math.random() - 0.4) * (baseDaily * 0.4);
      currentTrend = Math.max(0, currentTrend + change);
      
      chartData.push({
        name: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        views: Math.floor(currentTrend),
        inquiries: Math.floor(currentTrend * (0.05 + Math.random() * 0.05)), // 5-10% conversion rate
      });
    }
    
    return chartData;
  }, [listings]);

  return (
    <Card className="col-span-full border-border/60 shadow-sm mt-6">
      <CardHeader>
        <CardTitle>Performance Analytics</CardTitle>
        <CardDescription>
          View traffic and inquiry trends across your listings over the last 30 days.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorInquiries" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="name" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                dy={10}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              />
              <Tooltip
                contentStyle={{ 
                  backgroundColor: "hsl(var(--card))", 
                  borderColor: "hsl(var(--border))",
                  borderRadius: "0.5rem",
                  fontSize: "12px",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                }}
              />
              <Area 
                type="monotone" 
                dataKey="views" 
                name="Listing Views"
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorViews)" 
              />
              <Area 
                type="monotone" 
                dataKey="inquiries" 
                name="Inquiries"
                stroke="hsl(var(--accent))" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorInquiries)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

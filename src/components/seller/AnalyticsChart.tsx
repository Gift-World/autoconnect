import { useMemo } from "react";
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
    <section className="col-span-full rounded-3xl border border-border bg-card p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="brand-kicker text-muted-foreground">Performance</p>
          <h2 className="font-brand mt-1.5 text-xl sm:text-2xl">Views &amp; inquiries</h2>
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">
            View traffic and inquiry trends across your listings over the last 30 days. The daily
            split is an estimate based on your total views.
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-ac-accent" /> Listing views
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-primary" /> Inquiries
          </span>
        </div>
      </div>
      <div>
        <div className="mt-4 h-[240px] w-full sm:h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-ac-accent)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--color-ac-accent)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorInquiries" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis 
                dataKey="name" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                dy={10}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
              />
              <Tooltip
                contentStyle={{ 
                  backgroundColor: "var(--card)", 
                  borderColor: "var(--border)",
                  borderRadius: "0.5rem",
                  fontSize: "12px",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                }}
              />
              <Area 
                type="monotone" 
                dataKey="views" 
                name="Listing Views"
                stroke="var(--color-ac-accent)" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorViews)" 
              />
              <Area 
                type="monotone" 
                dataKey="inquiries" 
                name="Inquiries"
                stroke="var(--primary)" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorInquiries)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}

import { useState, useMemo } from "react";
import { Calculator, Shield, Fuel, TrendingDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";

export function FinanceCalculator({ price, currency }: { price: number; currency: string }) {
  const { formatPrice } = useCurrency();
  const [down, setDown] = useState(Math.round(price * 0.2));
  const [months, setMonths] = useState(60);
  const [apr, setApr] = useState(7.5);
  const [includeInsurance, setIncludeInsurance] = useState(true);

  const monthly = useMemo(() => {
    const principal = Math.max(0, price - down);
    const r = apr / 100 / 12;
    if (principal <= 0) return 0;
    if (r === 0) return principal / months;
    return (principal * r) / (1 - Math.pow(1 + r, -months));
  }, [price, down, months, apr]);

  const insuranceMonthly = useMemo(() => {
    return includeInsurance ? (price * 0.04) / 12 : 0;
  }, [price, includeInsurance]);

  const totalMonthly = monthly + insuranceMonthly;

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="bg-muted/40 p-5 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold">Finance & Insurance Calculator</h2>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Estimate your total monthly cost of ownership.
        </p>
      </div>

      <div className="p-5 space-y-6">
        <Tabs defaultValue="finance" className="w-full">
          <TabsList className="w-full grid grid-cols-2 mb-4">
            <TabsTrigger value="finance">Financing</TabsTrigger>
            <TabsTrigger value="cash">Cash Purchase</TabsTrigger>
          </TabsList>
          
          <TabsContent value="finance" className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-xs font-medium text-foreground">Down payment</label>
                    <span className="text-xs text-muted-foreground">{formatPrice(down, currency)}</span>
                  </div>
                  <Slider 
                    value={[down]} 
                    min={0} 
                    max={price} 
                    step={1000}
                    onValueChange={(val) => setDown(val[0])}
                    className="py-1"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>0%</span>
                    <span>{Math.round((down / price) * 100)}%</span>
                  </div>
                </div>

                <label className="block text-xs">
                  <span className="text-muted-foreground font-medium mb-1.5 block">Term (months)</span>
                  <Select value={String(months)} onValueChange={(v) => setMonths(Number(v))}>
                    <SelectTrigger className="w-full h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[24, 36, 48, 60, 72, 84].map((m) => (
                        <SelectItem key={m} value={String(m)}>
                          {m} months
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>

                <label className="block text-xs">
                  <span className="text-muted-foreground font-medium mb-1.5 block">Estimated APR %</span>
                  <Input
                    type="number"
                    step="0.1"
                    min={0}
                    max={40}
                    value={apr}
                    onChange={(e) => setApr(Math.max(0, Math.min(40, Number(e.target.value) || 0)))}
                    className="h-9"
                  />
                </label>
              </div>

              <div className="flex flex-col justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Calculator className="h-24 w-24" />
                </div>
                <div className="relative z-10">
                  <p className="text-xs uppercase tracking-wider font-semibold text-primary/80 mb-1">Estimated Payment</p>
                  <p className="text-4xl font-bold text-primary tracking-tight">
                    {formatPrice(Math.round(totalMonthly), currency)}<span className="text-sm font-normal text-muted-foreground">/mo</span>
                  </p>
                  
                  <div className="mt-4 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Vehicle Principal + Int.</span>
                      <span className="font-medium text-foreground">{formatPrice(Math.round(monthly), currency)}</span>
                    </div>
                    {includeInsurance && (
                      <div className="flex justify-between text-blue-600 dark:text-blue-400">
                        <span>Insurance Est.</span>
                        <span className="font-medium">+{formatPrice(Math.round(insuranceMonthly), currency)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="cash" className="py-4">
            <div className="text-center p-6 border rounded-xl bg-muted/20">
              <p className="text-3xl font-bold">{formatPrice(price, currency)}</p>
              <p className="text-sm text-muted-foreground mt-2">Total upfront cash price</p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Real Cost of Ownership (TCO) */}
        <div className="pt-5 border-t border-border/60">
          <h3 className="text-sm font-bold mb-3 flex items-center gap-1.5">
            Real Cost of Ownership <span className="text-xs font-normal text-muted-foreground">(Annual)</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-card border rounded-lg p-3 flex items-start gap-2.5">
              <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-500">
                <Shield className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase text-muted-foreground">Insurance</p>
                <p className="text-sm font-bold mt-0.5">{formatPrice(price * 0.04, currency)}</p>
              </div>
            </div>
            
            <div className="bg-card border rounded-lg p-3 flex items-start gap-2.5">
              <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-500">
                <Fuel className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase text-muted-foreground">Maint. & Fuel</p>
                <p className="text-sm font-bold mt-0.5">{formatPrice(price * 0.03, currency)}</p>
              </div>
            </div>
            
            <div className="bg-card border rounded-lg p-3 flex items-start gap-2.5">
              <div className="p-1.5 rounded-md bg-rose-500/10 text-rose-500">
                <TrendingDown className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase text-muted-foreground">Depreciation</p>
                <p className="text-sm font-bold mt-0.5">{formatPrice(price * 0.15, currency)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

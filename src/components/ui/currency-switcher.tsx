import React from "react";
import { useCurrency, CurrencyCode } from "@/contexts/CurrencyContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Coins, Check } from "lucide-react";

export function CurrencySwitcher({ variant = "ghost" }: { variant?: "ghost" | "outline" }) {
  const { currency, setCurrency, currencies, currentConfig } = useCurrency();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size="sm"
          className="h-9 px-2.5 rounded-xl gap-1.5 font-medium text-xs border-border hover:bg-accent/10 hover:text-accent transition-colors"
          title="Change Display Currency"
        >
          <Coins className="h-3.5 w-3.5 text-accent" />
          <span>{currentConfig.code}</span>
          <span className="text-[10px] text-muted-foreground font-mono">({currentConfig.symbol})</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 p-1.5 rounded-xl bg-card border-border shadow-xl">
        <div className="px-2 py-1.5 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
          Select Currency
        </div>
        {(Object.keys(currencies) as CurrencyCode[]).map((code) => {
          const config = currencies[code];
          const isSelected = currency === code;
          return (
            <DropdownMenuItem
              key={code}
              onClick={() => setCurrency(code)}
              className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-xs cursor-pointer ${
                isSelected
                  ? "bg-accent/15 text-accent font-semibold"
                  : "hover:bg-muted text-foreground"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-6 text-center font-mono font-bold text-xs opacity-75">{config.symbol}</span>
                <span>{config.name}</span>
              </div>
              {isSelected && <Check className="h-3.5 w-3.5 text-accent" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

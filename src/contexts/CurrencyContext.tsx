import React, { createContext, useContext, useState, useEffect, useMemo } from "react";

export type CurrencyCode = "KES" | "USD" | "JPY" | "GBP" | "EUR";

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
  rateFromKes: number; // Multiply KES amount by this rate
  prefix: string;
  decimals: number;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  KES: {
    code: "KES",
    symbol: "KSh",
    name: "Kenyan Shilling",
    rateFromKes: 1.0,
    prefix: "KES ",
    decimals: 0,
  },
  USD: {
    code: "USD",
    symbol: "$",
    name: "US Dollar",
    rateFromKes: 1 / 129.5,
    prefix: "$",
    decimals: 0,
  },
  JPY: {
    code: "JPY",
    symbol: "¥",
    name: "Japanese Yen",
    rateFromKes: 1 / 0.86,
    prefix: "¥",
    decimals: 0,
  },
  GBP: {
    code: "GBP",
    symbol: "£",
    name: "British Pound",
    rateFromKes: 1 / 168.0,
    prefix: "£",
    decimals: 0,
  },
  EUR: {
    code: "EUR",
    symbol: "€",
    name: "Euro",
    rateFromKes: 1 / 141.0,
    prefix: "€",
    decimals: 0,
  },
};

interface CurrencyContextType {
  currency: CurrencyCode;
  setCurrency: (code: CurrencyCode) => void;
  currencies: Record<CurrencyCode, CurrencyConfig>;
  currentConfig: CurrencyConfig;
  formatPrice: (amountInKes: number | null | undefined, options?: { compact?: boolean; hidePrefix?: boolean }) => string;
  convertPrice: (amountInKes: number | null | undefined) => number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const STORAGE_KEY = "autoconnect_selected_currency";

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>("KES");

  const currentConfig: CurrencyConfig = CURRENCIES[currency] || CURRENCIES.KES;

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as CurrencyCode;
      if (saved && CURRENCIES[saved]) {
        setCurrencyState(saved);
      }
    } catch {
      // Ignore storage errors in restricted contexts
    }
  }, []);

  const setCurrency = (code: CurrencyCode) => {
    setCurrencyState(code);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, code);
      } catch {
        // Ignore storage errors
      }
    }
  };

  const normalizeToKes = (amount: number | null | undefined, baseCurrency?: string): number => {
    if (amount == null || isNaN(amount)) return 0;
    if (baseCurrency) {
      const code = baseCurrency.toUpperCase();
      if (code === "USD") return amount * 129.5;
      if (code === "JPY") return amount * 0.86;
      if (code === "GBP") return amount * 168.0;
      if (code === "EUR") return amount * 141.0;
      if (code === "KES" || code === "KSH") return amount;
    }
    // Auto-detect: if a car price is under 250,000, it is stored as USD/EUR/GBP, e.g. 58,500 USD
    if (amount > 0 && amount < 250_000) {
      return amount * 129.5;
    }
    return amount;
  };

  const convertPrice = (
    amount: number | null | undefined,
    baseCurrency?: string
  ): number => {
    if (amount == null || isNaN(amount)) return 0;
    const amountInKes = normalizeToKes(amount, baseCurrency);
    return amountInKes * currentConfig.rateFromKes;
  };

  const formatPrice = (
    amount: number | null | undefined,
    baseCurrencyOrOptions?: string | { compact?: boolean; hidePrefix?: boolean },
    options?: { compact?: boolean; hidePrefix?: boolean }
  ): string => {
    const baseCurrency = typeof baseCurrencyOrOptions === "string" ? baseCurrencyOrOptions : undefined;
    const opts = typeof baseCurrencyOrOptions === "object" ? baseCurrencyOrOptions : options;

    if (amount == null || isNaN(amount) || amount === 0) {
      return `${opts?.hidePrefix ? "" : currentConfig.prefix}0`;
    }

    const converted = convertPrice(amount, baseCurrency);

    if (opts?.compact) {
      if (converted >= 1_000_000) {
        return `${opts?.hidePrefix ? "" : currentConfig.prefix}${(converted / 1_000_000).toFixed(1)}M`;
      }
      if (converted >= 1_000) {
        return `${opts?.hidePrefix ? "" : currentConfig.prefix}${(converted / 1_000).toFixed(0)}k`;
      }
    }

    const formattedNum = Math.round(converted).toLocaleString("en-US", {
      maximumFractionDigits: currentConfig.decimals,
    });

    return opts?.hidePrefix ? formattedNum : `${currentConfig.prefix}${formattedNum}`;
  };

  const value = useMemo(
    () => ({
      currency,
      setCurrency,
      currencies: CURRENCIES,
      currentConfig,
      formatPrice,
      convertPrice,
    }),
    [currency, currentConfig]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency(): CurrencyContextType {
  const context = useContext(CurrencyContext);
  if (!context) {
    const fallbackConfig = CURRENCIES.KES;
    return {
      currency: "KES" as CurrencyCode,
      setCurrency: () => {},
      currencies: CURRENCIES,
      currentConfig: fallbackConfig,
      formatPrice: (
        amount: number | null | undefined,
        baseCurrencyOrOptions?: string | { compact?: boolean; hidePrefix?: boolean },
        options?: { compact?: boolean; hidePrefix?: boolean }
      ) => {
        if (!amount) return "KES 0";
        const opts = typeof baseCurrencyOrOptions === "object" ? baseCurrencyOrOptions : options;
        if (opts?.hidePrefix) return amount.toLocaleString();
        return `KES ${amount.toLocaleString()}`;
      },
      convertPrice: (amount: number | null | undefined) => amount || 0,
    };
  }
  return context;
}

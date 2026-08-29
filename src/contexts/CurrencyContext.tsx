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

  useEffect(() => {
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
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      // Ignore storage errors
    }
  };

  const currentConfig = CURRENCIES[currency] || CURRENCIES.KES;

  const convertPrice = (amountInKes: number | null | undefined): number => {
    if (amountInKes == null || isNaN(amountInKes)) return 0;
    return amountInKes * currentConfig.rateFromKes;
  };

  const formatPrice = (
    amountInKes: number | null | undefined,
    options?: { compact?: boolean; hidePrefix?: boolean }
  ): string => {
    if (amountInKes == null || isNaN(amountInKes) || amountInKes === 0) {
      return `${options?.hidePrefix ? "" : currentConfig.prefix}0`;
    }

    const converted = convertPrice(amountInKes);

    if (options?.compact) {
      if (converted >= 1_000_000) {
        return `${options?.hidePrefix ? "" : currentConfig.prefix}${(converted / 1_000_000).toFixed(1)}M`;
      }
      if (converted >= 1_000) {
        return `${options?.hidePrefix ? "" : currentConfig.prefix}${(converted / 1_000).toFixed(0)}k`;
      }
    }

    const formattedNum = Math.round(converted).toLocaleString("en-US", {
      maximumFractionDigits: currentConfig.decimals,
    });

    return options?.hidePrefix ? formattedNum : `${currentConfig.prefix}${formattedNum}`;
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

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    const fallbackConfig = CURRENCIES.KES;
    return {
      currency: "KES" as CurrencyCode,
      setCurrency: () => {},
      currencies: CURRENCIES,
      currentConfig: fallbackConfig,
      formatPrice: (amt?: number | null) => (amt ? `KES ${amt.toLocaleString()}` : "KES 0"),
      convertPrice: (amt?: number | null) => amt || 0,
    };
  }
  return context;
}

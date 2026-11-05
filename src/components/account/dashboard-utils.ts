/** Shared class strings and helpers for the buyer / owner dashboards. */

/** Signal-orange primary button (one per page). Use on <button> or <Link>. */
export const primaryButton =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-ac-accent px-5 text-sm font-extrabold text-ac-ink transition hover:brightness-110 active:translate-y-px disabled:pointer-events-none disabled:opacity-60";

/** Quiet secondary button. */
export const secondaryButton =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-border bg-card px-5 text-sm font-bold text-foreground transition hover:border-foreground/30 hover:bg-muted active:translate-y-px disabled:pointer-events-none disabled:opacity-60";

/** Ghost button used on dark (bg-ac-ink) surfaces. */
export const onDarkButton =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/20 px-5 text-sm font-bold text-white transition hover:border-ac-accent active:translate-y-px";


export function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

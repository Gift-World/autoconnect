import type { ReactNode } from "react";
import { Check } from "lucide-react";

/**
 * Airbnb-simple sign-in layout: one form card on the left, a car photo with a
 * short promise on the right (desktop only).
 */
export function AuthShell({
  kicker,
  title,
  subtitle,
  image,
  imageAlt,
  asideKicker,
  asideTitle,
  asidePoints = [],
  children,
  below,
}: {
  kicker: string;
  title: string;
  subtitle?: ReactNode;
  image: string;
  imageAlt: string;
  asideKicker: string;
  asideTitle: ReactNode;
  asidePoints?: string[];
  /** The form card content. */
  children: ReactNode;
  /** Secondary content under the card (links, demo personas). */
  below?: ReactNode;
}) {
  return (
    <main className="bg-background px-3 py-3 text-foreground sm:px-5 sm:py-5">
      <div className="mx-auto grid max-w-[1360px] gap-5 lg:min-h-[calc(100svh-6.5rem)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <div className="flex flex-col justify-center px-1 py-8 sm:px-6 sm:py-12 lg:px-10">
          <div className="mx-auto w-full max-w-[460px]">
            <p className="brand-kicker text-muted-foreground">{kicker}</p>
            <h1 className="font-brand mt-3 text-4xl text-foreground sm:text-5xl">{title}</h1>
            {subtitle && <p className="mt-3 text-base leading-7 text-muted-foreground">{subtitle}</p>}
            <div className="mt-8 rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-7">
              {children}
            </div>
            {below}
          </div>
        </div>

        <aside
          className="relative hidden min-h-[640px] overflow-hidden rounded-[36px] bg-ac-ink lg:block"
        >
          <img src={image} alt={imageAlt} className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,19,36,.15),rgba(11,19,36,.35)_45%,rgba(11,19,36,.9))]" />
          <div className="absolute inset-x-0 bottom-0 p-10 text-white xl:p-14">
            <p className="brand-kicker text-ac-accent">{asideKicker}</p>
            <h2 className="font-brand mt-4 max-w-lg text-5xl xl:text-6xl">{asideTitle}</h2>
            {asidePoints.length > 0 && (
              <ul className="mt-6 space-y-3">
                {asidePoints.map((point) => (
                  <li key={point} className="flex items-start gap-3 text-base text-white/85">
                    <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ac-accent text-ac-ink">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                    {point}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}

/** "or" divider between the primary method and the secondary one. */
export function AuthDivider({ label = "or" }: { label?: string }) {
  return (
    <div className="my-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      <span className="h-px flex-1 bg-border" />
      {label}
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

/** Secondary full-width outline button used for "Continue with phone/email". */
export const authSecondaryButton =
  "flex h-12 w-full items-center justify-center gap-2 rounded-full border border-border bg-background text-sm font-bold text-foreground transition hover:border-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/** Primary full-width orange button class for auth submits. */
export const authPrimaryButton =
  "h-12 w-full rounded-full bg-ac-accent text-sm font-extrabold text-ac-ink shadow-none hover:bg-ac-accent hover:brightness-110";

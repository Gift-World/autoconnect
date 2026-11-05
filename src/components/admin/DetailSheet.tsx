import type { ReactNode } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

/**
 * Right-hand side sheet for reviewing one queue item.
 * Full width on phones, a calm 36rem panel on larger screens.
 * Header and footer stay put; the body scrolls.
 */
export function DetailSheet({
  open,
  onOpenChange,
  kicker,
  title,
  description,
  children,
  footer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kicker?: string;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-xl [&>button]:top-5 [&>button]:grid [&>button]:h-11 [&>button]:w-11 [&>button]:place-items-center [&>button]:rounded-full"
      >
        <SheetHeader className="border-b border-border px-5 py-5 pr-16 text-left sm:px-6">
          {kicker && <p className="brand-kicker text-muted-foreground">{kicker}</p>}
          <SheetTitle className="font-brand text-2xl leading-tight">{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        {footer && (
          <div className="flex flex-col-reverse gap-2 border-t border-border bg-card px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            {footer}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

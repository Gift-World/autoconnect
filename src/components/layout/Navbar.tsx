import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Car, Heart, LogOut, Menu, Scale, Settings, User as UserIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DEMO_MODE, useAuth, roleHomePath } from "@/contexts/AuthContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { NotificationBell } from "@/components/NotificationBell";
import { RoleSwitcher } from "@/components/RoleSwitcher";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { CurrencySwitcher } from "@/components/ui/currency-switcher";

/** The four doors shown in the bar on large screens. */
const primaryLinks = [
  { to: "/cars", label: "Buy" },
  { to: "/import", label: "Import" },
  { to: "/services", label: "Care" },
  { to: "/community", label: "Community" },
] as const;

/** Everything, grouped, in the menu. */
const menuGroups = [
  {
    title: "Buy",
    links: [
      { to: "/cars", label: "Browse cars" },
      { to: "/auctions", label: "Auctions" },
      { to: "/yards", label: "Dealerships" },
      { to: "/compare", label: "Compare" },
      { to: "/import", label: "Import a car" },
      { to: "/import-tracker", label: "Track an import" },
    ],
  },
  {
    title: "Own",
    links: [
      { to: "/garage", label: "My Garage" },
      { to: "/services", label: "Car care" },
      { to: "/parts", label: "Parts" },
      { to: "/community", label: "Community" },
    ],
  },
  {
    title: "Sell & trust",
    links: [
      { to: "/seller", label: "Sell your car" },
      { to: "/pricing", label: "Seller pricing" },
      { to: "/trust", label: "Trust centre" },
      { to: "/how-payments-work", label: "How payments work" },
      { to: "/support", label: "Support" },
    ],
  },
] as const;

const ROLE_LABEL: Record<string, string> = {
  buyer: "Buyer view",
  seller: "Seller / dealer view",
  yard_manager: "Yard admin view",
  admin: "Super admin view",
};

export function Navbar() {
  const { user, profile, signOut, loading, activeRole } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const initials =
    profile?.full_name
      ?.split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() ||
    user?.email?.slice(0, 2).toUpperCase() ||
    "U";

  const close = () => setMenuOpen(false);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled ? "border-b border-border/80 bg-background/85 shadow-sm backdrop-blur-2xl" : "border-b border-transparent bg-background/60 backdrop-blur-md"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-[1360px] items-center justify-between gap-3 px-4 sm:h-18 sm:px-6">
        <Link to="/" className="group flex shrink-0 items-center gap-2.5" aria-label="AutoConnect home">
          <span className="grid h-10 w-10 overflow-hidden rounded-xl border border-border bg-white">
            <img src="/logo-mark.jpg" alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
          </span>
          <span className="font-brand hidden text-xl min-[380px]:inline">
            Auto<span className="ml-0.5 rounded-md bg-ac-accent px-1 text-ac-ink">Connect</span>
          </span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {primaryLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
              activeProps={{ className: "bg-muted text-foreground" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {loading ? (
            <div className="h-10 w-24 animate-pulse rounded-full bg-muted" />
          ) : user ? (
            <>
              <NotificationBell />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-10 gap-2 rounded-full px-1.5 hover:bg-muted sm:pr-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-ac-ink text-xs font-bold text-ac-accent">{initials}</AvatarFallback>
                    </Avatar>
                    <span className="hidden max-w-[140px] truncate text-xs font-semibold md:inline">
                      {DEMO_MODE ? `Preview · ${profile?.full_name || "Workspace"}` : profile?.full_name || user.email}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60 rounded-2xl border-border p-1.5 shadow-2xl">
                  <DropdownMenuLabel className="flex flex-col px-3 py-2">
                    <span className="truncate text-sm font-bold">{profile?.full_name || user.email}</span>
                    <span className="text-[11px] font-semibold text-muted-foreground">{ROLE_LABEL[activeRole] ?? "Member view"}</span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="cursor-pointer rounded-xl">
                    <Link to={roleHomePath(activeRole) as never}>
                      <UserIcon className="mr-2 h-4 w-4" /> Active dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer rounded-xl">
                    <Link to="/account/favorites">
                      <Heart className="mr-2 h-4 w-4" /> Saved favourites
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer rounded-xl">
                    <Link to="/garage">
                      <Car className="mr-2 h-4 w-4" /> My Garage
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer rounded-xl">
                    <Link to="/compare">
                      <Scale className="mr-2 h-4 w-4" /> Vehicle comparison
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="cursor-pointer rounded-xl">
                    <Link to="/account">
                      <Settings className="mr-2 h-4 w-4" /> Account settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => void signOut()} className="cursor-pointer rounded-xl text-destructive">
                    <LogOut className="mr-2 h-4 w-4" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Link to="/login" className="hidden min-h-10 items-center rounded-full px-4 text-sm font-semibold hover:bg-muted sm:inline-flex">
              Sign in
            </Link>
          )}

          <Link
            to="/seller"
            className="hidden min-h-10 items-center rounded-full bg-ac-accent px-5 text-sm font-extrabold text-ac-ink transition hover:brightness-105 md:inline-flex"
          >
            List your car
          </Link>

          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                aria-label="Open menu"
                className="grid h-10 w-10 place-items-center rounded-full bg-ac-ink text-white transition hover:bg-ac-ink/85 dark:bg-white dark:text-ac-ink"
              >
                <Menu className="h-4 w-4" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="flex w-full flex-col overflow-y-auto p-0 sm:max-w-md">
              <SheetHeader className="border-b border-border px-6 py-5 text-left">
                <SheetTitle className="font-brand text-2xl">Menu</SheetTitle>
              </SheetHeader>

              <div className="flex-1 space-y-8 px-6 py-6">
                {!user && (
                  <div className="grid grid-cols-2 gap-2">
                    <Link to="/login" onClick={close} className="flex min-h-12 items-center justify-center rounded-full border border-border text-sm font-bold">
                      Sign in
                    </Link>
                    <Link to="/register" onClick={close} className="flex min-h-12 items-center justify-center rounded-full bg-ac-ink text-sm font-bold text-white dark:bg-white dark:text-ac-ink">
                      Sign up
                    </Link>
                  </div>
                )}

                {menuGroups.map((group) => (
                  <nav key={group.title} aria-label={group.title}>
                    <p className="brand-kicker mb-2 text-muted-foreground">{group.title}</p>
                    <ul>
                      {group.links.map((l) => (
                        <li key={`${group.title}-${l.label}`}>
                          <Link
                            to={l.to}
                            onClick={close}
                            className="group flex min-h-12 items-center justify-between rounded-2xl px-3 text-base font-semibold transition hover:bg-muted"
                          >
                            {l.label}
                            <ArrowUpRight className="h-4 w-4 text-muted-foreground transition group-hover:text-foreground" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </nav>
                ))}

                <div>
                  <p className="brand-kicker mb-3 text-muted-foreground">Preferences</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <CurrencySwitcher />
                    <ThemeToggle />
                  </div>
                  <div className="mt-4">
                    <RoleSwitcher className="w-full justify-between rounded-2xl" />
                  </div>
                </div>
              </div>

              <div className="border-t border-border p-6">
                <Link
                  to="/seller"
                  onClick={close}
                  className="flex min-h-12 items-center justify-center rounded-full bg-ac-accent text-sm font-extrabold text-ac-ink"
                >
                  List your car
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

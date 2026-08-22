import { Link } from "@tanstack/react-router";
import {
  Globe,
  Menu,
  LogOut,
  User as UserIcon,
  ShieldCheck,
  Heart,
  Car,
  Store,
  Compass,
} from "lucide-react";
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
import { useAuth, roleHomePath } from "@/contexts/AuthContext";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { NotificationBell } from "@/components/NotificationBell";
import { RoleSwitcher } from "@/components/RoleSwitcher";

const navLinks = [
  { to: "/cars", label: "Browse Cars" },
  { to: "/yards", label: "Car Yards" },
  { to: "/import", label: "Import a Car" },
  { to: "/how-payments-work", label: "How Payments Work" },
] as const;

export function Navbar() {
  const { user, profile, signOut, loading, activeRole, setActiveRole } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
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

  return (
    <header
      className={`sticky top-0 z-40 w-full backdrop-blur-xl transition-all duration-200 ${
        scrolled
          ? "border-b border-border bg-card/80 shadow-card"
          : "border-b border-transparent bg-card/60"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-xl bg-primary text-primary-foreground shadow-card">
            <Globe className="h-4 w-4 opacity-70" />
            <Car className="absolute h-3.5 w-3.5 translate-y-[1px]" />
          </span>
          <span className="font-display text-lg text-foreground font-semibold tracking-tight">
            AutoConnect
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((l) => (
            <Link
              key={l.label}
              to={l.to as never}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              activeProps={{ className: "text-foreground font-semibold" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2.5">
          {/* Universal Role Perspective Switcher */}
          <RoleSwitcher />

          {loading ? (
            <div className="h-9 w-20 animate-pulse rounded-md bg-muted" />
          ) : user ? (
            <>
              <NotificationBell />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 px-2 h-9 rounded-full">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden text-sm font-medium sm:inline">
                      {profile?.full_name || user.email}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  <DropdownMenuLabel className="flex flex-col">
                    <span className="text-sm font-medium truncate">{profile?.full_name || user.email}</span>
                    <span className="text-[11px] font-normal capitalize text-muted-foreground">
                      Active: {activeRole.replace("_", " ")}
                    </span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard">
                      <Globe className="mr-2 h-4 w-4 text-primary" /> Consolidated Portal
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={roleHomePath(activeRole) as never}>
                      <UserIcon className="mr-2 h-4 w-4 text-primary" /> Active Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/account/favorites">
                      <Heart className="mr-2 h-4 w-4 text-rose-500" /> Favorites
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-[10px] uppercase font-semibold text-muted-foreground">
                    Quick Navigation
                  </DropdownMenuLabel>
                  <DropdownMenuItem asChild>
                    <Link to="/account">
                      <Compass className="mr-2 h-4 w-4 text-purple-500" /> Buyer Account
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/seller">
                      <Car className="mr-2 h-4 w-4 text-blue-500" /> Seller Portal
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/seller/yard">
                      <Store className="mr-2 h-4 w-4 text-emerald-500" /> Car Yard Admin
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/admin">
                      <ShieldCheck className="mr-2 h-4 w-4 text-amber-500" /> Super Admin
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => void signOut()} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Button asChild variant="ghost" size="sm">
                <Link to="/login">Login</Link>
              </Button>
              <Button
                asChild
                size="sm"
                className="bg-accent text-accent-foreground hover:bg-accent/90 btn-press"
              >
                <Link to="/seller">List Your Car</Link>
              </Button>
            </div>
          )}

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <div className="mt-6 flex flex-col gap-1">
                <div className="mb-4 pb-3 border-b">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">
                    Current Perspective
                  </span>
                  <RoleSwitcher className="w-full justify-between" />
                </div>
                {navLinks.map((l) => (
                  <Link
                    key={l.label}
                    to={l.to as never}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-md px-3 py-2.5 text-base font-medium text-foreground hover:bg-muted"
                  >
                    {l.label}
                  </Link>
                ))}
                {!user && (
                  <div className="mt-4 flex flex-col gap-2">
                    <Link
                      to="/login"
                      onClick={() => setMobileOpen(false)}
                      className="rounded-md border border-input px-3 py-2.5 text-center text-base font-medium"
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMobileOpen(false)}
                      className="rounded-md bg-primary px-3 py-2.5 text-center text-base font-medium text-primary-foreground"
                    >
                      Register
                    </Link>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

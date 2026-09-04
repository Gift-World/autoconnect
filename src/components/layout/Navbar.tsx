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
  Scale,
  Settings,
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
import { DEMO_MODE, useAuth, roleHomePath } from "@/contexts/AuthContext";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { NotificationBell } from "@/components/NotificationBell";
import { RoleSwitcher } from "@/components/RoleSwitcher";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { CurrencySwitcher } from "@/components/ui/currency-switcher";

const navLinks = [
  { to: "/cars", label: "Explore Cars" },
  { to: "/parts", label: "Parts" },
  { to: "/services", label: "Care" },
  { to: "/yards", label: "Yards" },
  { to: "/import", label: "Import" },
] as const;

export function Navbar() {
  const { user, profile, signOut, loading, activeRole, setActiveRole } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
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

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "border-b border-border/80 bg-background/85 backdrop-blur-2xl shadow-sm"
          : "border-b border-transparent bg-background/50 backdrop-blur-md"
      }`}
    >
      <div className="mx-auto flex h-16 sm:h-18 max-w-[1280px] items-center justify-between px-4 sm:px-6">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <span className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white shadow-md border border-white/10 group-hover:border-teal-500/40 transition-colors">
            <Globe className="h-4 w-4 text-teal-400 opacity-60 group-hover:rotate-45 transition-transform duration-500" />
            <Car className="absolute h-3.5 w-3.5 text-white translate-y-[1px]" />
          </span>
          <div className="flex flex-col">
            <span className="font-display text-lg sm:text-xl text-foreground font-extrabold tracking-tight">
              Auto<span className="text-teal-500">Connect</span>
            </span>
            <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-semibold -mt-1 hidden sm:block">
              Global Verified
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden items-center gap-1 lg:gap-1.5 md:flex">
          {navLinks.map((l) => (
            <Link
              key={l.label}
              to={l.to as never}
              className="rounded-xl px-3.5 py-2 text-xs sm:text-sm font-semibold text-muted-foreground transition-all duration-150 hover:bg-muted/80 hover:text-foreground"
              activeProps={{ className: "text-foreground font-bold bg-muted/60" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Right Action Area */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Universal Role Perspective Switcher */}
          <RoleSwitcher />

          {loading ? (
            <div className="h-9 w-20 animate-pulse rounded-xl bg-muted" />
          ) : user ? (
            <>
              <CurrencySwitcher />
              <ThemeToggle />
              <NotificationBell />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 px-2 h-9 rounded-full hover:bg-muted">
                    <Avatar className="h-7 w-7 ring-2 ring-teal-500/30">
                      <AvatarFallback className="bg-slate-900 text-xs font-bold text-teal-400">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden text-xs font-semibold sm:inline max-w-[140px] truncate">
                      {DEMO_MODE ? `Preview · ${profile?.full_name || "Workspace"}` : profile?.full_name || user.email}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 rounded-2xl p-1.5 shadow-2xl border-border">
                    <DropdownMenuLabel className="flex flex-col px-3 py-2">
                      <span className="text-sm font-bold truncate">{profile?.full_name || user.email}</span>
                      <span className="text-[11px] font-semibold text-teal-400">
                        {activeRole === "buyer"
                          ? "Buyer View"
                          : activeRole === "seller"
                          ? "Seller / Dealer View"
                          : activeRole === "yard_manager"
                          ? "Yard Admin View"
                          : activeRole === "admin"
                          ? "Super Admin View"
                          : "Member View"}
                      </span>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild className="rounded-xl cursor-pointer">
                      <Link to={roleHomePath(activeRole) as never}>
                        <UserIcon className="mr-2 h-4 w-4 text-teal-500" /> Active Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="rounded-xl cursor-pointer">
                      <Link to="/account/favorites">
                        <Heart className="mr-2 h-4 w-4 text-rose-500" /> Saved Favorites
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="rounded-xl cursor-pointer">
                      <Link to="/garage">
                        <Car className="mr-2 h-4 w-4 text-teal-500" /> My Garage
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="rounded-xl cursor-pointer">
                      <Link to="/compare">
                        <Scale className="mr-2 h-4 w-4 text-accent" /> Vehicle Comparison
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="rounded-xl cursor-pointer">
                      <Link to="/account">
                        <Settings className="mr-2 h-4 w-4 text-primary" /> Account Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => void signOut()} className="text-destructive rounded-xl cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" /> Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <CurrencySwitcher />
              <ThemeToggle />
              <Button asChild variant="ghost" size="sm" className="rounded-xl font-semibold text-xs h-9 px-4">
                <Link to="/login">Login</Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="rounded-xl font-semibold text-xs h-9 px-4">
                <Link to="/register">Register</Link>
              </Button>
              <Button
                asChild
                size="sm"
                className="h-9 rounded-xl bg-teal-500 font-bold text-slate-950 hover:bg-teal-400 text-xs px-4 shadow-sm"
              >
                <Link to="/seller">List Your Car</Link>
              </Button>
            </div>
          )}

          {/* Mobile hamburger menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden rounded-xl">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 p-6">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 mb-6">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-900 text-teal-400">
                    <Car className="h-4 w-4" />
                  </span>
                  <span className="font-display font-extrabold text-lg flex-1">AutoConnect</span>
                  <CurrencySwitcher />
                  <ThemeToggle />
                </div>

                <div className="mb-4 pb-4 border-b border-border">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                    Active View Perspective
                  </span>
                  <RoleSwitcher className="w-full justify-between rounded-xl" />
                </div>

                {navLinks.map((l) => (
                  <Link
                    key={l.label}
                    to={l.to as never}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-xl px-3 py-2.5 text-sm font-semibold text-foreground hover:bg-muted"
                  >
                    {l.label}
                  </Link>
                ))}

                {!user && (
                  <div className="mt-6 flex flex-col gap-2 pt-4 border-t border-border">
                    <Link
                      to="/login"
                      onClick={() => setMobileOpen(false)}
                      className="rounded-xl border border-input px-4 py-2.5 text-center text-sm font-semibold"
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMobileOpen(false)}
                      className="rounded-xl bg-teal-500 px-4 py-2.5 text-center text-sm font-bold text-slate-950 hover:bg-teal-400"
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

import { Link } from "@tanstack/react-router";
import {
  Globe,
  Menu,
  LogOut,
  User as UserIcon,
  ShieldCheck,
  Heart,
  Car,
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

const navLinks = [
  { to: "/cars", label: "Browse Cars" },
  { to: "/yards", label: "Car Yards" },
  { to: "/import", label: "Import a Car" },
  { to: "/import", label: "How It Works" },
] as const;

export function Navbar() {
  const { user, profile, signOut, loading } = useAuth();
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
          <span className="font-display text-lg text-foreground">
            AutoConnect
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((l) => (
            <Link
              key={l.label}
              to={l.to as never}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {loading ? (
            <div className="h-9 w-20 animate-pulse rounded-md bg-muted" />
          ) : user ? (
            <>
              <NotificationBell />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 px-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-xs text-primary-foreground">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden text-sm font-medium sm:inline">
                    {profile?.full_name || user.email}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="flex flex-col">
                  <span className="text-sm">{profile?.full_name || user.email}</span>
                  <span className="text-xs font-normal capitalize text-muted-foreground">
                    {profile?.role ?? "buyer"}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to={roleHomePath(profile?.role) as never}>
                    <UserIcon className="mr-2 h-4 w-4" /> Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/account/favorites">
                    <Heart className="mr-2 h-4 w-4" /> Favorites
                  </Link>
                </DropdownMenuItem>
                {profile?.role === "admin" && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin">
                      <ShieldCheck className="mr-2 h-4 w-4" /> Admin
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onSelect={() => void signOut()}>
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
              <div className="mt-8 flex flex-col gap-1">
                {navLinks.map((l) => (
                  <Link
                    key={l.label}
                    to={l.to as never}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-md px-3 py-3 text-base font-medium text-foreground hover:bg-muted"
                  >
                    {l.label}
                  </Link>
                ))}
                {!user && (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setMobileOpen(false)}
                      className="mt-4 rounded-md border border-input px-3 py-3 text-center text-base font-medium"
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMobileOpen(false)}
                      className="rounded-md bg-primary px-3 py-3 text-center text-base font-medium text-primary-foreground"
                    >
                      Register
                    </Link>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

import React, { useState } from "react";
import { useAuth, AppRole } from "@/contexts/AuthContext";
import { DEMO_PERSONAS, DemoPersona } from "@/components/DemoPersonaSwitcher";
import {
  User as UserIcon,
  Car,
  Store,
  ShieldCheck,
  ChevronUp,
  Sparkles,
  ArrowRight,
  Layers,
  Check,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

export function PersonaControlDock() {
  const { activeRole, setActiveRole } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const currentPersona =
    DEMO_PERSONAS.find((p) => p.role === activeRole) || DEMO_PERSONAS[0];

  const handleSwitch = (persona: DemoPersona) => {
    setActiveRole(persona.role);
    toast.success(`Switched perspective to: ${persona.name}`, {
      description: persona.scenario,
      icon: <Sparkles className="h-4 w-4 text-accent" />,
    });
  };

  const handleJumpWorkspace = (path: string) => {
    setIsOpen(false);
    navigate({ to: path as never });
  };

  const getRoleIcon = (role: AppRole) => {
    switch (role) {
      case "seller":
        return Car;
      case "yard_manager":
        return Store;
      case "admin":
        return ShieldCheck;
      default:
        return UserIcon;
    }
  };

  const ActiveIcon = getRoleIcon(activeRole);

  return (
    <>
      {/* Floating Bottom Left Trigger Button */}
      <div className="fixed bottom-6 left-6 z-40">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="group flex items-center gap-2.5 bg-card/95 hover:bg-card text-foreground px-3.5 py-2.5 rounded-full shadow-2xl border border-border hover:border-accent/50 backdrop-blur-xl transition-all duration-300 hover:scale-105"
            title="Switch User Persona & View Perspective"
          >
            <div className="relative">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-accent/15 text-accent border border-accent/30 font-bold text-xs">
                {currentPersona.avatarText}
              </span>
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />
            </div>

            <div className="text-left hidden sm:block">
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-xs font-bold truncate max-w-[130px]">
                  {currentPersona.name.split(" ")[0]}
                </span>
                <Badge
                  variant="outline"
                  className="text-[9px] px-1 py-0 h-4 border-accent/40 text-accent font-semibold uppercase"
                >
                  {currentPersona.badge.split(" ")[0]}
                </Badge>
              </div>
              <span className="text-[10px] text-muted-foreground block mt-0.5">
                Click to switch persona
              </span>
            </div>

            <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors ml-1" />
          </button>
        )}
      </div>

      {/* Expandable Glassmorphic Persona Deck */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-start sm:pl-6 p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-card/95 backdrop-blur-2xl border border-border rounded-3xl shadow-2xl p-5 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-2xl bg-accent/15 text-accent flex items-center justify-center border border-accent/30">
                  <Layers className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Live Persona Switcher
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Experience AutoConnect from all 4 ecosystem perspectives
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Persona Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 py-4">
              {DEMO_PERSONAS.map((persona) => {
                const isSelected = activeRole === persona.role;
                const Icon = getRoleIcon(persona.role);

                return (
                  <div
                    key={persona.id}
                    onClick={() => handleSwitch(persona)}
                    className={`group relative p-3.5 rounded-2xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? "border-accent bg-accent/10 shadow-sm"
                        : "border-border hover:border-accent/40 bg-muted/30 hover:bg-muted/60"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`h-8 w-8 rounded-xl flex items-center justify-center font-bold text-xs border ${
                            isSelected
                              ? "bg-accent text-accent-foreground border-accent"
                              : "bg-muted text-foreground border-border"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-foreground truncate max-w-[130px]">
                            {persona.name.split(" ")[0]} {persona.name.split(" ")[1] || ""}
                          </h4>
                          <span className="text-[10px] text-muted-foreground block truncate">
                            {persona.badge}
                          </span>
                        </div>
                      </div>
                      {isSelected && (
                        <span className="h-5 w-5 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-[10px]">
                          <Check className="h-3 w-3" />
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-muted-foreground mt-2 line-clamp-1">
                      {persona.tagline}
                    </p>

                    <div className="mt-2.5 pt-2 border-t border-border/50 flex items-center justify-between text-[10px]">
                      <span className="text-muted-foreground truncate max-w-[120px]">
                        {persona.location}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSwitch(persona);
                          handleJumpWorkspace(persona.targetPath);
                        }}
                        className="text-accent font-semibold flex items-center gap-0.5 hover:underline"
                      >
                        <span>Open Portal</span>
                        <ArrowRight className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
              <Link to="/dashboard" onClick={() => setIsOpen(false)}>
                <Button variant="outline" size="sm" className="h-9 text-xs rounded-xl border-border">
                  <Layers className="h-3.5 w-3.5 mr-1.5 text-accent" />
                  All-in-One Dashboard
                </Button>
              </Link>
              <Button
                size="sm"
                onClick={() => handleJumpWorkspace(currentPersona.targetPath)}
                className="h-9 text-xs rounded-xl bg-accent text-accent-foreground font-semibold"
              >
                <span>Jump into {currentPersona.badge}</span>
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

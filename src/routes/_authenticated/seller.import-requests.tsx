import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Mail, Phone, MapPin, Calendar, Wallet, Inbox, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { countryByCode } from "@/lib/countries";

export const Route = createFileRoute("/_authenticated/seller/import-requests")({
  head: () => ({ meta: [{ title: "Import Requests — Seller — AutoConnect" }] }),
  component: ImportRequestsPage,
});

type ImportRequest = {
  id: string;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string | null;
  buyer_country: string;
  make_name: string;
  model_name: string | null;
  year_from: number | null;
  year_to: number | null;
  budget_min: number | null;
  budget_max: number | null;
  budget_currency: string;
  preferred_condition: string | null;
  preferred_source_country: string | null;
  transmission_preference: string | null;
  fuel_preference: string | null;
  additional_notes: string | null;
  status: string;
  created_at: string;
};

function ImportRequestsPage() {
  const { user } = useAuth();
  const [q, setQ] = useState("");

  const sellerQuery = useQuery({
    queryKey: ["seller-status", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("sellers")
        .select("is_approved, offers_international_shipping")
        .eq("profile_id", user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const requestsQuery = useQuery({
    queryKey: ["import-requests-open"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("import_requests")
        .select("*")
        .eq("status", "open")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ImportRequest[];
    },
    enabled: !!sellerQuery.data?.is_approved && !!sellerQuery.data?.offers_international_shipping,
  });

  if (sellerQuery.isLoading) {
    return <div className="text-muted-foreground">Loading…</div>;
  }

  const seller = sellerQuery.data;
  if (!seller?.is_approved || !seller?.offers_international_shipping) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-warning" />
        <h2 className="mt-3 text-xl font-semibold">Exporter access required</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Only approved sellers who offer international shipping can view buyer
          import requests. {seller && !seller.is_approved
            ? "Your seller account is pending approval."
            : "Enable international shipping in your seller profile to request access."}
        </p>
      </div>
    );
  }

  const all = requestsQuery.data ?? [];
  const term = q.trim().toLowerCase();
  const filtered = term
    ? all.filter(
        (r) =>
          r.make_name.toLowerCase().includes(term) ||
          r.model_name?.toLowerCase().includes(term) ||
          r.buyer_country.toLowerCase().includes(term),
      )
    : all;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Buyer import requests</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Open requests from verified buyers worldwide. Contact directly to send
          a quote.
        </p>
      </header>

      <Input
        placeholder="Search by make, model, or country…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="max-w-md"
      />

      {requestsQuery.isLoading ? (
        <div className="text-muted-foreground">Loading requests…</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border bg-card p-10 text-center">
          <Inbox className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            {all.length === 0 ? "No open import requests yet." : "No requests match your search."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((r) => (
            <RequestCard key={r.id} r={r} />
          ))}
        </div>
      )}
    </div>
  );
}

function RequestCard({ r }: { r: ImportRequest }) {
  const destination = countryByCode(r.buyer_country);
  const source = r.preferred_source_country ? countryByCode(r.preferred_source_country) : null;
  const budget =
    r.budget_min || r.budget_max
      ? `${r.budget_min?.toLocaleString() ?? "—"}–${r.budget_max?.toLocaleString() ?? "—"} ${r.budget_currency}`
      : "Not specified";
  const years =
    r.year_from || r.year_to ? `${r.year_from ?? "any"}–${r.year_to ?? "any"}` : "Any year";

  return (
    <div className="rounded-lg border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">
            {r.make_name} {r.model_name ?? ""}
          </h3>
          <div className="mt-1 flex flex-wrap gap-2 text-xs">
            {r.preferred_condition && r.preferred_condition !== "any" && (
              <Badge variant="secondary">{r.preferred_condition}</Badge>
            )}
            {r.transmission_preference && (
              <Badge variant="outline">{r.transmission_preference}</Badge>
            )}
            {r.fuel_preference && <Badge variant="outline">{r.fuel_preference}</Badge>}
          </div>
        </div>
        <Badge className="bg-success text-success-foreground">Open</Badge>
      </div>

      <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
        <Row icon={<Calendar className="h-4 w-4" />} label="Years" value={years} />
        <Row icon={<Wallet className="h-4 w-4" />} label="Budget" value={budget} />
        <Row
          icon={<MapPin className="h-4 w-4" />}
          label="Ship to"
          value={destination ? `${destination.flag} ${destination.name}` : r.buyer_country}
        />
        {source && (
          <Row
            icon={<MapPin className="h-4 w-4" />}
            label="From"
            value={`${source.flag} ${source.name}`}
          />
        )}
      </div>

      {r.additional_notes && (
        <p className="mt-4 rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
          {r.additional_notes}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
        <div className="text-sm">
          <div className="font-medium">{r.buyer_name}</div>
          <div className="mt-1 flex flex-wrap gap-4 text-xs text-muted-foreground">
            <a href={`mailto:${r.buyer_email}`} className="flex items-center gap-1 hover:text-primary">
              <Mail className="h-3 w-3" /> {r.buyer_email}
            </a>
            {r.buyer_phone && (
              <a href={`tel:${r.buyer_phone}`} className="flex items-center gap-1 hover:text-primary">
                <Phone className="h-3 w-3" /> {r.buyer_phone}
              </a>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <a href={`mailto:${r.buyer_email}?subject=Quote for ${encodeURIComponent(`${r.make_name} ${r.model_name ?? ""}`)}`}>
            <Button size="sm">Send quote</Button>
          </a>
        </div>
      </div>

      <div className="mt-2 text-right text-xs text-muted-foreground">
        Posted {new Date(r.created_at).toLocaleDateString()}
      </div>
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="font-medium">{value}</div>
      </div>
    </div>
  );
}

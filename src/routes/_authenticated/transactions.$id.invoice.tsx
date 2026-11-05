import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, FileX2, Printer, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { primaryButton } from "@/components/account/dashboard-utils";

export const Route = createFileRoute("/_authenticated/transactions/$id/invoice")({
  component: InvoicePage,
});

type InvoiceData = {
  id: string;
  created_at: string;
  status: string;
  display_currency: string;
  display_car_price: number;
  display_service_fee: number;
  display_total: number;
  buyer_id: string;
  seller_id: string;
  cars: {
    title: string;
    year: number;
    vin: string | null;
    registration_number: string | null;
  } | null;
  sellers: {
    business_name: string | null;
    country: string;
    city: string | null;
    address: string | null;
    kra_pin: string | null;
  } | null;
  buyer_profile?: {
    full_name: string | null;
    email: string | null;
    phone: string | null;
  };
};

function fmt(amount: number, currency: string) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function InvoicePage() {
  const { id } = Route.useParams();
  const { session } = useAuth();
  const [data, setData] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!session) return;
      try {
        const { data: tx, error } = await supabase
          .from("transactions")
          .select("id,created_at,status,display_currency,display_car_price,display_service_fee,display_total,buyer_id,seller_id,cars(title,year,vin,registration_number),sellers(business_name,country,city,address,kra_pin)")
          .eq("id", id)
          .single();

        if (error) throw error;

        // Verify authorization
        const isBuyer = tx.buyer_id === session.user.id;
        const isSeller = tx.seller_id === session.user.id;
        const isAdmin = session.user.user_metadata?.role === "admin" || session.user.user_metadata?.role === "superadmin";

        if (!isBuyer && !isSeller && !isAdmin) {
          throw new Error("Unauthorized to view this invoice.");
        }

        // Fetch buyer profile manually since there's no direct relation to profiles from transactions
        const { data: buyerProfile } = await supabase
          .from("profiles")
          .select("full_name, email, phone")
          .eq("id", tx.buyer_id)
          .single();

        setData({
          ...(tx as unknown as Omit<InvoiceData, "buyer_profile">),
          buyer_profile: buyerProfile || undefined
        });
      } catch (err) {
        toast.error((err as { message?: string } | null)?.message || "Unable to load invoice.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, session]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 px-4 py-8" aria-busy="true" aria-label="Loading invoice">
        <Skeleton className="h-11 w-full rounded-full" />
        <Skeleton className="h-[520px] w-full rounded-[28px]" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <div className="rounded-[28px] border border-border bg-card p-8 text-center sm:p-10">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-muted text-muted-foreground">
            <FileX2 className="h-6 w-6" />
          </span>
          <h2 className="font-brand mt-4 text-3xl">Invoice Not Found</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Only the buyer, the seller or an admin can open this invoice. Check you are signed in
            with the right account.
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full border border-border px-5 text-sm font-bold transition hover:bg-muted"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const invoiceNumber = `INV-${data.id.split("-")[0].toUpperCase()}`;
  const invoiceDate = new Date(data.created_at).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-background pb-20 print:min-h-0 print:bg-white print:pb-0">
      {/* Print isolation: only the invoice document prints, on a plain white page. */}
      <style>{`
        @media print {
          @page { margin: 16mm; }
          html, body { background: #fff !important; color: #000 !important; }
          /* Hide everything that is neither the invoice nor one of its ancestors (navbar, footer, toasts…). */
          body *:not(:has(#ac-invoice)):not(#ac-invoice):not(#ac-invoice *) { display: none !important; }
          /* Flatten the invoice's ancestors so it starts at the top of a white page. */
          body *:has(#ac-invoice) { margin: 0 !important; padding: 0 !important; border: 0 !important;
            box-shadow: none !important; background: #fff !important; min-height: 0 !important;
            max-width: none !important; overflow: visible !important; }
          #ac-invoice { width: 100%; max-width: none; margin: 0 !important;
            background: #fff !important; color: #000 !important; box-shadow: none !important; border: 0 !important; }
          #ac-invoice * { color: #000 !important; border-color: rgba(0,0,0,.15) !important; }
        }
      `}</style>

      {/* Non-printable header controls */}
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-6 print:hidden">
        <Link
          to=".."
          className="inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Transaction
        </Link>
        <button type="button" onClick={() => window.print()} className={primaryButton}>
          <Printer className="h-4 w-4" /> Print / Save PDF
        </button>
      </div>

      {/* Invoice Document — always a white sheet, even in dark mode */}
      <div className="px-4 print:px-0">
        <div
          id="ac-invoice"
          className="mx-auto max-w-4xl rounded-[28px] bg-white p-6 text-slate-900 shadow-sm ring-1 ring-black/5 sm:p-12 print:rounded-none print:p-0 print:text-black print:shadow-none print:ring-0"
        >
          {/* Header */}
          <div className="mb-10 flex flex-col justify-between gap-6 sm:mb-12 sm:flex-row">
            <div>
              <div className="mb-1 flex items-center gap-2 text-2xl font-bold text-[#0b1324]">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#0b1324] text-[#ff7a21] print:bg-white print:text-black">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <span className="font-brand">AutoConnect</span>
              </div>
              <p className="text-sm text-slate-500 print:text-black">Nairobi, Kenya</p>
              <p className="text-sm text-slate-500 print:text-black">support@autoconnect.co.ke</p>
            </div>
            <div className="sm:text-right">
              <h1 className="font-brand mb-2 text-4xl text-slate-900 print:text-black">INVOICE</h1>
              <p className="break-all font-mono text-sm text-slate-600 print:text-black">
                {invoiceNumber}
              </p>
              <p className="mt-1 text-sm text-slate-500 print:text-black">Date: {invoiceDate}</p>
              <p className="text-sm text-slate-500 print:text-black">
                Status:{" "}
                <span className="font-semibold uppercase">{data.status.replace(/_/g, " ")}</span>
              </p>
            </div>
          </div>

          {/* Bill To / From */}
          <div className="mb-10 grid grid-cols-1 gap-8 border-t border-slate-200 pt-8 sm:mb-12 sm:grid-cols-2 sm:gap-12 print:border-black/10">
            <div className="min-w-0">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400 print:text-black/50">
                Billed To
              </h3>
              <p className="font-semibold text-slate-900 print:text-black">
                {data.buyer_profile?.full_name || "Guest Buyer"}
              </p>
              {data.buyer_profile?.email && (
                <p className="break-words text-sm text-slate-600 print:text-black">
                  {data.buyer_profile.email}
                </p>
              )}
              {data.buyer_profile?.phone && (
                <p className="text-sm text-slate-600 print:text-black">{data.buyer_profile.phone}</p>
              )}
            </div>
            <div className="min-w-0">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400 print:text-black/50">
                Vehicle Sourced From
              </h3>
              <p className="font-semibold text-slate-900 print:text-black">
                {data.sellers?.business_name || "Private Seller"}
              </p>
              {data.sellers?.address && (
                <p className="text-sm text-slate-600 print:text-black">{data.sellers.address}</p>
              )}
              {(data.sellers?.city || data.sellers?.country) && (
                <p className="text-sm text-slate-600 print:text-black">
                  {[data.sellers.city, data.sellers.country].filter(Boolean).join(", ")}
                </p>
              )}
              {data.sellers?.kra_pin && (
                <p className="text-sm text-slate-600 print:text-black">
                  KRA PIN: {data.sellers.kra_pin}
                </p>
              )}
            </div>
          </div>

          {/* Line Items */}
          <div className="mb-10 sm:mb-12">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-left text-sm print:min-w-0">
                <thead className="border-b-2 border-slate-200 print:border-black/20">
                  <tr>
                    <th className="py-3 font-semibold text-slate-900 print:text-black">
                      Description
                    </th>
                    <th className="py-3 text-right font-semibold text-slate-900 print:text-black">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 print:divide-black/10">
                  <tr>
                    <td className="py-4 pr-4">
                      <p className="font-medium text-slate-900 print:text-black">
                        {data.cars?.year} {data.cars?.title}
                      </p>
                      {data.cars?.vin && (
                        <p className="text-xs text-slate-500 print:text-black">VIN: {data.cars.vin}</p>
                      )}
                      {data.cars?.registration_number && (
                        <p className="text-xs text-slate-500 print:text-black">
                          Reg: {data.cars.registration_number}
                        </p>
                      )}
                    </td>
                    <td className="py-4 text-right tabular-nums text-slate-900 print:text-black">
                      {fmt(data.display_car_price, data.display_currency)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-4 pr-4">
                      <p className="font-medium text-slate-900 print:text-black">
                        AutoConnect Escrow & Service Fee
                      </p>
                      <p className="text-xs text-slate-500 print:text-black">
                        Platform verification and funds protection
                      </p>
                    </td>
                    <td className="py-4 text-right tabular-nums text-slate-900 print:text-black">
                      {fmt(data.display_service_fee, data.display_currency)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-full max-w-sm">
              <div className="flex justify-between border-t border-slate-100 py-3 text-sm print:border-black/10">
                <span className="text-slate-600 print:text-black">Subtotal</span>
                <span className="tabular-nums print:text-black">
                  {fmt(data.display_total, data.display_currency)}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-100 py-3 text-sm print:border-black/10">
                <span className="text-slate-600 print:text-black">Taxes (Inclusive)</span>
                <span className="tabular-nums print:text-black">
                  {fmt(0, data.display_currency)}
                </span>
              </div>
              <div className="mt-2 flex justify-between border-t-2 border-slate-900 py-4 print:border-black">
                <span className="text-lg font-bold print:text-black">Total</span>
                <span className="text-lg font-bold tabular-nums print:text-black">
                  {fmt(data.display_total, data.display_currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-16 border-t border-slate-100 pt-8 text-center text-sm text-slate-500 sm:mt-24 print:border-black/10 print:text-black">
            <p>Thank you for using AutoConnect to secure your vehicle.</p>
            <p className="mt-1">
              For any queries, please contact support@autoconnect.co.ke referencing your Invoice
              Number.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

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
      } catch (err: any) {
        toast.error(err.message || "Unable to load invoice.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, session]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <h2 className="text-2xl font-bold mb-4">Invoice Not Found</h2>
        <Button asChild variant="outline">
          <Link to="/">Return to Dashboard</Link>
        </Button>
      </div>
    );
  }

  const invoiceNumber = `INV-${data.id.split("-")[0].toUpperCase()}`;
  const invoiceDate = new Date(data.created_at).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20 print:bg-white print:pb-0">
      {/* Non-printable header controls */}
      <div className="max-w-4xl mx-auto px-4 py-6 print:hidden flex items-center justify-between">
        <Button variant="ghost" asChild className="gap-2">
          <Link to="..">
            <ArrowLeft className="h-4 w-4" /> Back to Transaction
          </Link>
        </Button>
        <Button onClick={() => window.print()} className="gap-2">
          <Printer className="h-4 w-4" /> Print / Save PDF
        </Button>
      </div>

      {/* Invoice Document */}
      <div className="max-w-4xl mx-auto bg-white dark:bg-slate-950 p-8 sm:p-12 shadow-sm rounded-xl print:shadow-none print:p-0 print:text-black">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 text-primary font-bold text-2xl mb-1">
              <ShieldCheck className="h-7 w-7" />
              <span>AutoConnect</span>
            </div>
            <p className="text-sm text-slate-500 print:text-black">Nairobi, Kenya</p>
            <p className="text-sm text-slate-500 print:text-black">support@autoconnect.co.ke</p>
          </div>
          <div className="sm:text-right">
            <h1 className="text-4xl font-light text-slate-900 dark:text-slate-100 print:text-black mb-2">INVOICE</h1>
            <p className="font-mono text-sm text-slate-600 print:text-black">{invoiceNumber}</p>
            <p className="text-sm text-slate-500 mt-1 print:text-black">Date: {invoiceDate}</p>
            <p className="text-sm text-slate-500 print:text-black">Status: <span className="uppercase font-semibold">{data.status.replace(/_/g, " ")}</span></p>
          </div>
        </div>

        {/* Bill To / From */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 mb-12 border-t border-slate-100 dark:border-slate-800 pt-8 print:border-black/10">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 print:text-black/50 mb-3">Billed To</h3>
            <p className="font-semibold text-slate-900 dark:text-slate-100 print:text-black">{data.buyer_profile?.full_name || "Guest Buyer"}</p>
            {data.buyer_profile?.email && <p className="text-sm text-slate-600 print:text-black">{data.buyer_profile.email}</p>}
            {data.buyer_profile?.phone && <p className="text-sm text-slate-600 print:text-black">{data.buyer_profile.phone}</p>}
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 print:text-black/50 mb-3">Vehicle Sourced From</h3>
            <p className="font-semibold text-slate-900 dark:text-slate-100 print:text-black">{data.sellers?.business_name || "Private Seller"}</p>
            {data.sellers?.address && <p className="text-sm text-slate-600 print:text-black">{data.sellers.address}</p>}
            {(data.sellers?.city || data.sellers?.country) && (
              <p className="text-sm text-slate-600 print:text-black">{[data.sellers.city, data.sellers.country].filter(Boolean).join(", ")}</p>
            )}
            {data.sellers?.kra_pin && <p className="text-sm text-slate-600 print:text-black">KRA PIN: {data.sellers.kra_pin}</p>}
          </div>
        </div>

        {/* Line Items */}
        <div className="mb-12">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b-2 border-slate-200 dark:border-slate-800 print:border-black/20">
                <tr>
                  <th className="py-3 font-semibold text-slate-900 dark:text-slate-100 print:text-black">Description</th>
                  <th className="py-3 font-semibold text-slate-900 dark:text-slate-100 print:text-black text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 print:divide-black/10">
                <tr>
                  <td className="py-4">
                    <p className="font-medium text-slate-900 dark:text-slate-100 print:text-black">
                      {data.cars?.year} {data.cars?.title}
                    </p>
                    {data.cars?.vin && <p className="text-xs text-slate-500 print:text-black">VIN: {data.cars.vin}</p>}
                    {data.cars?.registration_number && <p className="text-xs text-slate-500 print:text-black">Reg: {data.cars.registration_number}</p>}
                  </td>
                  <td className="py-4 text-right tabular-nums text-slate-900 dark:text-slate-100 print:text-black">
                    {fmt(data.display_car_price, data.display_currency)}
                  </td>
                </tr>
                <tr>
                  <td className="py-4">
                    <p className="font-medium text-slate-900 dark:text-slate-100 print:text-black">AutoConnect Escrow & Service Fee</p>
                    <p className="text-xs text-slate-500 print:text-black">Platform verification and funds protection</p>
                  </td>
                  <td className="py-4 text-right tabular-nums text-slate-900 dark:text-slate-100 print:text-black">
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
            <div className="flex justify-between py-3 text-sm border-t border-slate-100 dark:border-slate-800 print:border-black/10">
              <span className="text-slate-600 print:text-black">Subtotal</span>
              <span className="tabular-nums print:text-black">{fmt(data.display_total, data.display_currency)}</span>
            </div>
            <div className="flex justify-between py-3 text-sm border-t border-slate-100 dark:border-slate-800 print:border-black/10">
              <span className="text-slate-600 print:text-black">Taxes (Inclusive)</span>
              <span className="tabular-nums print:text-black">{fmt(0, data.display_currency)}</span>
            </div>
            <div className="flex justify-between py-4 mt-2 border-t-2 border-slate-900 dark:border-slate-100 print:border-black">
              <span className="font-bold text-lg print:text-black">Total</span>
              <span className="font-bold text-lg tabular-nums print:text-black">{fmt(data.display_total, data.display_currency)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-24 pt-8 border-t border-slate-100 dark:border-slate-800 print:border-black/10 text-center text-sm text-slate-500 print:text-black">
          <p>Thank you for using AutoConnect to secure your vehicle.</p>
          <p className="mt-1">For any queries, please contact support@autoconnect.co.ke referencing your Invoice Number.</p>
        </div>

      </div>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { Lock, ShieldCheck, Banknote, CheckCircle2, RotateCcw, AlertTriangle, Smartphone, Handshake } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/how-payments-work")({
  head: () => ({ meta: [
    { title: "How Payments Work — AutoConnect" },
    { name: "description", content: "Payment protected: card, M-Pesa or bank transfer. Funds released after verification. See how AutoConnect handles payments, handover and disputes." },
    { property: "og:title", content: "How Payments Work — AutoConnect" },
    { property: "og:description", content: "Payment protected, funds released after verification. Card, M-Pesa or bank transfer with admin review." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ]}),
  component: HowPaymentsWork,
});

function HowPaymentsWork() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <header className="text-center">
        <span className="inline-flex items-center gap-1 rounded-full border bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
          <Lock className="h-3 w-3" /> Payment protected
        </span>
        <h1 className="mt-4 text-4xl font-bold tracking-tight">How payments work on AutoConnect</h1>
        <p className="mt-3 text-muted-foreground">
          AutoConnect holds the payment while documents are reviewed and the car changes hands. Funds are
          released after verification.
        </p>
      </header>

      <ol className="mt-12 space-y-6">
        <Step n={1} icon={<Lock />} title="Buyer pays or reserves">
          Pay by card through Stripe, or reserve with M-Pesa or a bank transfer. The amount is the car price
          plus a 5% service fee. Money is never sent straight to the seller.
        </Step>
        <Step n={2} icon={<Smartphone />} title="Manual payment reviewed by admin">
          M-Pesa and bank transfers are an MVP manual flow: you submit the payer name, phone and reference, and
          the transaction sits in review until AutoConnect confirms the funds landed. Card payments are
          confirmed automatically.
        </Step>
        <Step n={3} icon={<ShieldCheck />} title="Car moves to Under Transaction">
          Once payment is confirmed the listing is marked Under Transaction so nobody else can buy it, and
          documents are reviewed by AutoConnect.
        </Step>
        <Step n={4} icon={<Handshake />} title="Seller prepares handover">
          The seller gets the car, keys and paperwork ready and marks the handover as ready. You arrange
          collection or delivery.
        </Step>
        <Step n={5} icon={<CheckCircle2 />} title="Buyer confirms receipt">
          After you have the car and documents, you confirm receipt. This starts the final review.
        </Step>
        <Step n={6} icon={<Banknote />} title="Funds released after verification">
          AutoConnect releases the car price to the seller — via Stripe Connect (typically 2-5 business days)
          or a manual payout for M-Pesa and bank deals. The 5% service fee covers verification, payment
          handling and dispute support.
        </Step>
        <Step n={7} icon={<AlertTriangle />} title="If there's a dispute…" subtle>
          You can raise a dispute before confirming receipt. Funds stay held while our team reviews the case.
        </Step>
        <Step n={8} icon={<RotateCcw />} title="Refunds" subtle>
          If a case is decided in the buyer's favour, AutoConnect returns the payment — to the card for Stripe
          payments, or to the M-Pesa/bank account used for manual payments. Outcomes depend on the review.
        </Step>
      </ol>

      <section className="mt-12 rounded-2xl border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Example: KES 3,850,000 car</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <Row label="Car price" value="KES 3,850,000" />
          <Row label="Service fee (5%)" value="KES 192,500" />
          <div className="my-2 border-t" />
          <Row label="Buyer pays" value="KES 4,042,500" bold />
          <Row label="Seller receives (after release)" value="KES 3,850,000" />
          <Row label="AutoConnect keeps" value="KES 192,500" />
        </dl>
      </section>

      <div className="mt-10 flex justify-center">
        <Button asChild size="lg"><Link to="/cars">Browse cars</Link></Button>
      </div>
    </div>
  );
}

function Step({ n, icon, title, children, subtle }: { n: number; icon: React.ReactNode; title: string; children: React.ReactNode; subtle?: boolean }) {
  return (
    <li className={`flex gap-4 rounded-xl border p-5 ${subtle ? "bg-muted/30" : "bg-card shadow-sm"}`}>
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">{icon}</div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Step {n}</p>
        <h3 className="mt-1 text-lg font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{children}</p>
      </div>
    </li>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between">
      <dt className={bold ? "font-semibold" : "text-muted-foreground"}>{label}</dt>
      <dd className={bold ? "font-bold text-primary" : ""}>{value}</dd>
    </div>
  );
}

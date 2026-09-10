import { createFileRoute } from "@tanstack/react-router";
import { PublicPolicyPage } from "@/components/PublicPolicyPage";

export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [{ title: "Terms of Use — AutoConnect" }] }),
  component: () => (
    <PublicPolicyPage
      eyebrow="Terms of use"
      title="Marketplace rules that protect every side"
      intro="Version 2026 09 10. These terms describe the responsibilities of buyers, sellers, providers and AutoConnect when using the marketplace. They require business and legal review before a public launch."
      sections={[
        {
          title: "Marketplace role",
          body: "AutoConnect provides tools for listings, verification evidence, communication, and recorded transaction workflows. Sellers remain responsible for the accuracy of their listings and legal ability to sell.",
        },
        {
          title: "Buyer responsibilities",
          body: "Buyers should review listing evidence, inspect vehicles where possible, use the recorded payment process, and raise a dispute before confirming receipt if a material issue exists.",
        },
        {
          title: "Seller and provider responsibilities",
          body: "Sellers and providers must give accurate information, have authority to offer the vehicle or service, keep documents private unless approved for publication, and respond honestly to enquiries and bookings.",
        },
        {
          title: "Auction and flash offer rules",
          body: "An auction or flash offer is not public until AutoConnect approval. Bidder identities are masked publicly. A winning reservation is time limited and payment pending until actual provider or bank evidence is verified.",
        },
        {
          title: "Payment and handover",
          body: "A reference number, reservation or screen message is not payment confirmation. The payment and release process must be backed by real provider or bank evidence. Do not send money outside the recorded workflow.",
        },
        {
          title: "Evidence and verification",
          body: "Evidence is marked verified only after a recorded review. Missing evidence, public recall information or a seller statement must not be treated as a history report, ownership clearance, inspection result or regulatory approval.",
        },
        {
          title: "Disputes and contact",
          body: "Raise a dispute through the recorded transaction or support channel before accepting handover where possible. The final operating policy must name the registered business, contact address, governing law and formal dispute process.",
        },
        {
          title: "Prohibited conduct",
          body: "No false vehicle information, off-platform payment pressure, identity misuse, document forgery, fraud, or attempts to bypass security controls.",
        },
      ]}
    />
  ),
});

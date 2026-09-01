import { createFileRoute } from "@tanstack/react-router";
import { PublicPolicyPage } from "@/components/PublicPolicyPage";

export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [{ title: "Terms of Use — AutoConnect" }] }),
  component: () => <PublicPolicyPage eyebrow="Terms of use" title="Marketplace rules that protect every side" intro="These terms describe the responsibilities of buyers, sellers, and AutoConnect when using the marketplace." sections={[
    { title: "Marketplace role", body: "AutoConnect provides tools for listings, verification evidence, communication, and recorded transaction workflows. Sellers remain responsible for the accuracy of their listings and legal ability to sell." },
    { title: "Buyer responsibilities", body: "Buyers should review listing evidence, inspect vehicles where possible, use the recorded payment process, and raise a dispute before confirming receipt if a material issue exists." },
    { title: "Prohibited conduct", body: "No false vehicle information, off-platform payment pressure, identity misuse, document forgery, fraud, or attempts to bypass security controls." },
  ]} />,
});

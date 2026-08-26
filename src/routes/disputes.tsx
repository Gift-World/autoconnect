import { createFileRoute } from "@tanstack/react-router";
import { PublicPolicyPage } from "@/components/PublicPolicyPage";

export const Route = createFileRoute("/disputes")({
  head: () => ({ meta: [{ title: "Buyer Dispute Process — AutoConnect" }] }),
  component: () => <PublicPolicyPage eyebrow="Buyer protection" title="Raise concerns before confirming receipt" intro="A dispute is part of the recorded transaction workflow. It is not a guarantee of an outcome; review the vehicle and its documentation before release." sections={[
    { title: "When to raise a dispute", body: "Raise it before confirming handover if the vehicle, title, evidence, or agreed condition materially differs from the recorded transaction." },
    { title: "What happens next", body: "The transaction is marked for review. Keep communication and evidence in the platform so an administrator can assess the case." },
    { title: "What to provide", body: "Add clear photos, inspection notes, title or registration concerns, and the exact part of the listing or agreement that does not match." },
  ]} />,
});

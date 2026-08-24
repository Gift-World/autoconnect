import { createFileRoute } from "@tanstack/react-router";
import { PublicPolicyPage } from "@/components/PublicPolicyPage";

export const Route = createFileRoute("/support")({
  head: () => ({ meta: [{ title: "Support — AutoConnect" }] }),
  component: () => <PublicPolicyPage eyebrow="Support" title="Get help through the recorded workflow" intro="For a vehicle question, use the inquiry form on that listing. For a live transaction, use the transaction workspace so the relevant evidence and history stay connected to your case." sections={[
    { title: "Vehicle and seller questions", body: "Use the listing inquiry form. Ask for the vehicle passport, inspection evidence, ownership information, and viewing arrangements before paying." },
    { title: "Payment and handover", body: "Use the transaction workspace for payment references, handover steps, and disputes. Never share a payment reference or personal documents over an unverified channel." },
    { title: "Account access", body: "Use the account sign-in and verification screens for profile and seller verification issues. Add a staffed support email and service-hours commitment before public launch." },
    { title: "Urgent safety concern", body: "Stop the transaction, retain all messages and evidence, and use the dispute workflow before confirming vehicle receipt." },
  ]} />,
});

import { createFileRoute } from "@tanstack/react-router";
import { PublicPolicyPage } from "@/components/PublicPolicyPage";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [{ title: "Privacy Notice — AutoConnect" }] }),
  component: () => <PublicPolicyPage eyebrow="Privacy notice" title="How we handle your information" sections={[
    { title: "Information we collect", body: "Account details, listing information, transaction records, messages, uploaded verification documents, and technical information needed to secure the service." },
    { title: "How information is used", body: "To provide marketplace features, verify sellers and vehicles, prevent fraud, process recorded transactions, respond to support requests, and meet applicable legal obligations." },
    { title: "Sharing and retention", body: "Information is shared only with parties needed to deliver the service, such as transaction providers and verified counterparties, or where required by law." },
  ]} />,
});

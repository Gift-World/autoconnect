import { createFileRoute } from "@tanstack/react-router";
import { PublicPolicyPage } from "@/components/PublicPolicyPage";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [{ title: "Privacy Notice — AutoConnect" }] }),
  component: () => (
    <PublicPolicyPage
      eyebrow="Privacy notice"
      title="How we handle your information"
      intro="Version 2026 09 10. This notice explains the information AutoConnect needs to operate a secure vehicle marketplace. It requires business and legal review before a public launch."
      sections={[
        {
          title: "Information we collect",
          body: "Account details, listing information, transaction records, messages, uploaded verification documents, and technical information needed to secure the service.",
        },
        {
          title: "How information is used",
          body: "To provide marketplace features, verify sellers and vehicles, prevent fraud, process recorded transactions, respond to support requests, and meet applicable legal obligations.",
        },
        {
          title: "Sharing and retention",
          body: "Information is shared only with parties needed to deliver the service, such as transaction providers and verified counterparties, or where required by law.",
        },
        {
          title: "Your choices",
          body: "Use Account and Support to update information, manage communications or ask questions about your data. The final launch notice must include the registered business contact and the legally required data rights for each market.",
        },
      ]}
    />
  ),
});

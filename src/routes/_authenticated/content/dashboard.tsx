import { createFileRoute } from "@tanstack/react-router";
import { NotAvailableYet } from "@/components/common/NotAvailableYet";

// Planned role area; real content and role checks arrive in a later phase.
export const Route = createFileRoute("/_authenticated/content/dashboard")({
  head: () => ({
    meta: [
      { title: "Coming soon — AgriVet OS" },
      { name: "description", content: "This AgriVet OS area is not available yet." },
      { property: "og:title", content: "Coming soon — AgriVet OS" },
      { property: "og:description", content: "This AgriVet OS area is not available yet." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NotAvailableYet,
});

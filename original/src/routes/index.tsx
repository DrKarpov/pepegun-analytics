import { createFileRoute } from "@tanstack/react-router";
import { Dashboard } from "@/components/dashboard/Dashboard";

const title = "Pepegun Analytics: independent on-chain dashboard";
const description =
  "Live fee revenue, active wallets, retention and venue breakdown for the Pepegun fee collector on TON, computed from public blockchain data. Unofficial.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="min-h-screen">
      <Dashboard />
    </main>
  );
}
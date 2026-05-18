import { createFileRoute } from "@tanstack/react-router";
import { AdminPage } from "./admin";

// Hidden admin entry. URL is intentionally obfuscated (defense-in-depth);
// admin role check inside AdminPage is the real gate.
export const Route = createFileRoute("/sys-ctrl-x9k2-prime-7af3")({
  component: AdminPage,
  head: () => ({
    meta: [
      { title: "Sistema" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

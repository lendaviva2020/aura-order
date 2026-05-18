import { createFileRoute } from "@tanstack/react-router";

// Hidden admin entry point. URL is intentionally obfuscated so it cannot be
// guessed. Access still requires the admin role (RLS + role check inside the
// AdminPage component), so this is defense-in-depth, not the only barrier.
export { AdminPage as component } from "@/components/admin/AdminPageExport";

export const Route = createFileRoute("/sys-ctrl-x9k2-prime-7af3")({
  component: AdminPageRoute,
  head: () => ({
    meta: [
      { title: "Sistema" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

import { AdminPage } from "@/components/admin/AdminPageExport";

function AdminPageRoute() {
  return <AdminPage />;
}

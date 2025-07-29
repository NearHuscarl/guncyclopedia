import { createFileRoute, redirect } from "@tanstack/react-router";
import z from "zod/v4";
import { getGunStats } from "@/client";
import { Page } from "@/modules/page";

const schema = z.object({
  debug: z.boolean().optional(),
});

export const Route = createFileRoute("/")({
  validateSearch: (raw) => schema.parse(raw),
  beforeLoad({ location }) {
    if (import.meta.env.DEV && location.pathname === "/" && !location.search) {
      return redirect({
        to: "/",
        search: (prev) => ({ ...prev, debug: true }),
      });
    }
  },
  loader: async () => {
    const { guns, stats } = getGunStats();
    return {
      guns,
      stats,
    };
  },
  component: Page,
});

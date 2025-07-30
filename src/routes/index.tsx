import { createFileRoute, redirect } from "@tanstack/react-router";
import z from "zod/v4";
import { getGuns, getGunStats } from "@/client";
import { Page } from "@/modules/page";
import { pickRandom } from "@/lib/lang";
import type { TAppState } from "@/modules/shared/hooks/useAppState";

const schema = z.object({
  debug: z.boolean().optional(),
  selectedId: z.number().int().nonnegative().optional(),
  sortBy: z.enum(["none", "quality", "maxAmmo", "cooldownTime"]).optional(),
});

export const Route = createFileRoute("/")({
  validateSearch: (raw) => schema.parse(raw),
  beforeLoad({ search }) {
    const newSearch: Partial<TAppState> = {};
    if (search.debug === undefined && import.meta.env.DEV) {
      newSearch.debug = true;
    }

    if (search.selectedId === undefined) {
      newSearch.selectedId = pickRandom(getGuns()).id;
    }

    if (Object.keys(newSearch).length > 0) {
      return redirect({
        to: "/",
        search: (prev) => ({ ...prev, ...newSearch }),
      });
    }
  },
  loader: async () => {
    const { guns, stats } = getGunStats();
    console.log("loader");
    return {
      guns,
      stats,
    };
  },

  // Don't let search changes trigger the loader
  loaderDeps: () => ({}),
  pendingMinMs: 0,
  // Force no reload while staying on this route
  shouldReload: false,
  staleTime: Infinity,
  // Never remount this component on search-only navs
  remountDeps: () => null,

  component: Page,
});

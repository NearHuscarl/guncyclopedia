import { createFileRoute, redirect } from "@tanstack/react-router";
import { getGunStats } from "@/client";
import { Page } from "@/modules/page";
import { pickRandom } from "@/lib/lang";
import { useGunStore } from "@/modules/shared/store/gun.store";
import { SearchParams } from "@/modules/shared/route/schema";
import type { TAppState } from "@/modules/shared/hooks/useAppState";
import { GameObjectService } from "@/client/service/game-object.service";

export const Route = createFileRoute("/")({
  validateSearch: (raw) => SearchParams.parse(raw),
  beforeLoad({ search }) {
    const newSearch: Partial<TAppState> = {};
    if (search.debug === undefined && import.meta.env.DEV) {
      newSearch.debug = true;
    }

    if (search.selectedId === undefined) {
      newSearch.selectedId = pickRandom(GameObjectService.getGuns()).id;
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
    useGunStore.getState().createGunLookup(guns);
    return { guns, stats };
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

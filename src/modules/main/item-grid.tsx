import { useMemo } from "react";
import clsx from "clsx";
import { Button } from "@/components/ui/button";
import { AnimatedSprite } from "@/modules/shared/components/animated-sprite";
import { Gun } from "@/client/generated/models/gun.model";
import { useAppState } from "../shared/hooks/useAppState";
import { useAppStateMutation } from "../shared/hooks/useAppStateMutation";
import { useFilteredGuns } from "../shared/hooks/useGuns";
import { usePreloadSpritesheets } from "../shared/hooks/usePreloadImages";
import { useGunStore } from "../shared/store/gun.store";
import { useFilter } from "../shared/hooks/useFilter";

const qualityWeights = Gun.shape.quality.options.reduce<Record<string, number>>((acc, quality, index) => {
  acc[quality] = index;
  return acc;
}, {});

function useGunResults() {
  const sortBy = useAppState((state) => state.sortBy);
  const filter = useFilter();
  const filteredGuns = useFilteredGuns(filter);

  return useMemo(() => {
    if (sortBy !== "none") {
      filteredGuns.sort((a, b) => {
        switch (sortBy) {
          case "quality":
            return qualityWeights[b.quality] - qualityWeights[a.quality];
          case "maxAmmo":
            return b.maxAmmo - a.maxAmmo;
          case "cooldownTime":
            return b.reloadTime - a.reloadTime;
          default:
            return b.id - a.id;
        }
      });
    }

    return filteredGuns;
  }, [filteredGuns, sortBy]);
}

export function ItemGrid() {
  const setHoverGun = useGunStore((state) => state.setHoverGun);
  const guns = useGunResults();
  const setAppState = useAppStateMutation();
  const selectedId = useAppState((state) => state.selectedId);
  const { error } = usePreloadSpritesheets();

  if (error) {
    return <div>{error.message}</div>;
  }

  return (
    <div className="flex flex-wrap gap-2 p-2 items-center content-start" onMouseLeave={() => setHoverGun(-1)}>
      {guns.map((gun) => (
        <Button
          key={gun.id}
          variant="secondary"
          onMouseEnter={() => setHoverGun(gun.id)}
          onClick={() => setAppState({ selectedId: gun.id })}
          className={clsx({
            "h-14 p-3": true,
            "bg-primary!": selectedId === gun.id,
          })}
        >
          <AnimatedSprite animation={gun.animation} scale={2.5} />
        </Button>
      ))}
    </div>
  );
}

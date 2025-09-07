import { memo, useMemo } from "react";
import clsx from "clsx";
import { Button } from "@/components/ui/button";
import { AnimatedSprite } from "@/modules/shared/components/animated-sprite";
import { Gun } from "@/client/generated/models/gun.model";
import { useAppState } from "../shared/hooks/useAppState";
import { useAppStateMutation } from "../shared/hooks/useAppStateMutation";
import { useFilteredGuns } from "../shared/hooks/useGuns";
import { usePreloadSpritesheets } from "../shared/hooks/usePreloadSpritesheets";
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

type TGridItemProps = {
  id: number;
  isSelected: boolean;
  isComparisonMode?: boolean;
};

const GridItemImpl = ({ id, isSelected, isComparisonMode }: TGridItemProps) => {
  const setHoverGun = useGunStore((state) => state.setHoverGun);
  const setAppState = useAppStateMutation();
  const gun = useGunStore((state) => state.gunLookup[id]);

  return (
    <Button
      variant="secondary"
      onMouseEnter={() => isComparisonMode && setHoverGun(gun.id)}
      onClick={() => setAppState({ selectedId: gun.id })}
      className={clsx({
        "h-12 p-2": true,
        "bg-primary!": isSelected,
      })}
    >
      <AnimatedSprite animation={gun.animation.idle} scale={2} />
    </Button>
  );
};

const GridItem = memo(GridItemImpl);

export function ItemGrid() {
  const setHoverGun = useGunStore((state) => state.setHoverGun);
  const guns = useGunResults();
  const { error } = usePreloadSpritesheets();
  const selectedId = useAppState((state) => state.selectedId);
  const isComparisonMode = useAppState((state) => state.isComparisonMode);

  if (error) {
    return <div>{error.message}</div>;
  }

  return (
    <div className="flex flex-wrap gap-2 items-center content-start" onMouseLeave={() => setHoverGun(-1)}>
      {guns.map((gun) => (
        <GridItem key={gun.id} id={gun.id} isSelected={selectedId === gun.id} isComparisonMode={isComparisonMode} />
      ))}
    </div>
  );
}

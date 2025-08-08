import { useMemo } from "react";
import clsx from "clsx";
import { Button } from "@/components/ui/button";
import { AnimatedSprite } from "@/modules/shared/components/animated-sprite";
import { Gun } from "@/client/generated/models/gun.model";
import { useAppState } from "../shared/hooks/useAppState";
import { useAppStateMutation } from "../shared/hooks/useAppStateMutation";
import { useGuns } from "../shared/hooks/useGuns";
import { usePreloadSpritesheets } from "../shared/hooks/usePreloadImages";

const qualityWeights = Gun.shape.quality.options.reduce<Record<string, number>>((acc, quality, index) => {
  acc[quality] = index;
  return acc;
}, {});

function useGunResults() {
  const guns = useGuns();
  const sortBy = useAppState((state) => state.sortBy);
  const tag = useAppState((state) => state.tag);
  const color = useAppState((state) => state.color);
  return useMemo(() => {
    const res = guns.filter((g) => {
      let match = true;
      if (color && g.animation.frames[0].colors[0] !== color) {
        match = false;
      }
      if (tag && !g.featureFlags.includes(tag)) {
        match = false;
      }
      return match;
    });

    if (sortBy !== "none") {
      res.sort((a, b) => {
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

    return res;
  }, [guns, sortBy, color, tag]);
}

export function ItemGrid() {
  const guns = useGunResults();
  const setAppState = useAppStateMutation();
  const selectedId = useAppState((state) => state.selectedId);
  const { error } = usePreloadSpritesheets();

  if (error) {
    return <div>{error.message}</div>;
  }

  return (
    <div className="flex flex-wrap gap-2 p-2 items-center content-start">
      {guns.map((gun) => (
        <Button
          key={gun.id}
          variant="secondary"
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

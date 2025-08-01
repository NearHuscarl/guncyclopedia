import { useMemo } from "react";
import clsx from "clsx";
import { Button } from "@/components/ui/button";
import { AnimatedSprite } from "@/modules/shared/components/animated-sprite";
import { Gun } from "@/client/generated/models/gun.model";
import { useAppState } from "../shared/hooks/useAppState";
import { useAppStateMutation } from "../shared/hooks/useAppStateMutation";
import { useGuns } from "../shared/hooks/useGuns";

function useGunResults() {
  const guns = useGuns();
  const sortBy = useAppState((state) => state.sortBy);

  const effectiveGuns = useMemo(() => {
    if (sortBy === "none") return guns;

    const qualityWeights = Gun.shape.quality.options.reduce<Record<string, number>>((acc, quality, index) => {
      acc[quality] = index;
      return acc;
    }, {});

    return [...guns].sort((a, b) => {
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
  }, [guns, sortBy]);

  return effectiveGuns;
}

export function ItemGrid() {
  const guns = useGunResults();
  const setAppState = useAppStateMutation();
  const selectedId = useAppState((state) => state.selectedId);

  return (
    <div className="flex flex-wrap gap-2 p-2 items-center content-start">
      {guns.map((gun) => (
        <Button
          key={gun.id}
          variant="secondary"
          onClick={() => setAppState({ selectedId: gun.id })}
          className={clsx({
            "h-12 p-3": true,
            "bg-primary!": selectedId === gun.id,
          })}
        >
          <AnimatedSprite animation={gun.animation} scale={2.5} />
        </Button>
      ))}
    </div>
  );
}

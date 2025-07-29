import { useLoaderData } from "@tanstack/react-router";
import { useUiStore } from "../shared/store/ui.store";
import { Button } from "@/components/ui/button";
import { AnimatedSprite } from "@/modules/shared/components/animated-sprite";
import { useMemo } from "react";
import { Gun } from "@/client/generated/models/gun.model";

function useGuns() {
  const { guns } = useLoaderData({ from: "/" });
  const sortBy = useUiStore((state) => state.gun.sortBy);

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
  const guns = useGuns();
  const selectItem = useUiStore((state) => state.selectItem);

  return (
    <div className="flex flex-wrap gap-2 p-2 items-center content-start">
      {guns.map((gun) => (
        <Button key={gun.id} variant="secondary" className="h-12 p-3" onClick={() => selectItem(gun.id)}>
          <AnimatedSprite animation={gun.animation} scale={2.5} />
        </Button>
      ))}
    </div>
  );
}

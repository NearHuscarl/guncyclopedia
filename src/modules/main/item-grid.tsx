import { AnimatedSprite } from "./animated-sprite";
import { useLoaderData } from "@tanstack/react-router";
import { useUiStore } from "./ui.store";
import { Button } from "@/components/ui/button";

export function ItemGrid() {
  const { guns } = useLoaderData({ from: "/" });
  const selectItem = useUiStore((state) => state.selectItem);

  return (
    <div className="flex flex-wrap gap-2 p-2 items-center content-start">
      {guns.map((gun) => (
        <Button
          key={gun.id}
          variant="secondary"
          className="bg-stone-900 h-16 p-3 hover:bg-stone-700 focus:bg-stone-700 active:bg-stone-600"
          onClick={() => selectItem(gun.id)}
        >
          <AnimatedSprite animation={gun.animation} scale={3} />
        </Button>
      ))}
    </div>
  );
}

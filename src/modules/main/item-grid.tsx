import { AnimatedSprite } from "./animated-sprite";
import { useLoaderData } from "@tanstack/react-router";
import { useUiStore } from "./ui.store";

export function ItemGrid() {
  const { guns } = useLoaderData({ from: "/" });
  const selectItem = useUiStore((state) => state.selectItem);

  return (
    <div className="flex flex-wrap gap-2 p-2 items-center content-start">
      {guns.map((gun) => (
        <div key={gun.id} onClick={() => selectItem(gun.id)}>
          <AnimatedSprite animation={gun.animation} scale={3} />
        </div>
      ))}
    </div>
  );
}

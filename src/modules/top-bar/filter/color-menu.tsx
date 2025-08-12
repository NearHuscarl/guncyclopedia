import { useMemo } from "react";
import { MenubarCheckboxItem, MenubarSub, MenubarSubContent, MenubarSubTrigger } from "@/components/ui/menubar";
import { useAppState } from "../../shared/hooks/useAppState";
import { useFilterStateMutation } from "../../shared/hooks/useFilterStateMutation";
import { basicColors } from "@/client/generated/models/color.model";
import { useFilteredGuns } from "@/modules/shared/hooks/useGuns";
import { ColorItem } from "../shared/components/color-item";

function useSecondaryColors(primaryColor?: string) {
  const guns = useFilteredGuns({ primaryColor });

  return useMemo(() => {
    const secondaryColors = new Set<string>();

    guns.forEach((g) => {
      const color = g.animation.frames[0].colors[1];
      if (color) {
        secondaryColors.add(color);
      }
    });

    return [...secondaryColors];
  }, [guns]);
}

export function ColorMenu() {
  const primaryColor = useAppState((state) => state.filter?.primaryColor);
  const secondaryColor = useAppState((state) => state.filter?.secondaryColor);
  const secondaryColors = useSecondaryColors(primaryColor);
  const setFilter = useFilterStateMutation();

  return (
    <>
      <MenubarSub>
        <MenubarSubTrigger>Primary Color</MenubarSubTrigger>
        <MenubarSubContent>
          {["None"].concat(Object.keys(basicColors)).map((colorKey) => {
            return (
              <MenubarCheckboxItem
                key={colorKey}
                className="flex items-center"
                checked={colorKey === (primaryColor ?? "None")}
                onCheckedChange={(checked) => {
                  const r = colorKey === "None" || !checked ? undefined : colorKey;
                  setFilter({ primaryColor: r, secondaryColor: undefined });
                }}
              >
                <ColorItem color={colorKey} />
              </MenubarCheckboxItem>
            );
          })}
        </MenubarSubContent>
      </MenubarSub>
      <MenubarSub>
        <MenubarSubTrigger>Secondary Color</MenubarSubTrigger>
        <MenubarSubContent>
          {["None"].concat(secondaryColors).map((colorKey) => {
            return (
              <MenubarCheckboxItem
                key={colorKey}
                className="flex items-center"
                checked={colorKey === (secondaryColor ?? "None")}
                onCheckedChange={(checked) => {
                  const r = colorKey === "None" || !checked ? undefined : colorKey;
                  setFilter({ secondaryColor: r });
                }}
              >
                <ColorItem color={colorKey} />
              </MenubarCheckboxItem>
            );
          })}
        </MenubarSubContent>
      </MenubarSub>
    </>
  );
}
